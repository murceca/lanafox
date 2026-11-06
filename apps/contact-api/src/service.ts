import { createHmac } from "node:crypto";
import {
  contactSchema,
  type ContactRequest,
  type ContactResponse,
  MAX_BODY_BYTES,
} from "@lanafox/contracts";

export type SendState = "pending" | "accepted" | "uncertain" | "limited";

export interface RecordValue {
  hash: string;
  state: SendState;
  expires: number;
}

export interface Store {
  claim(id: string, value: RecordValue): Promise<RecordValue | null>;
  finish(id: string, state: SendState): Promise<void>;
  consume(key: string, limit: number, expires: number): Promise<boolean>;
  cleanup(now: number): Promise<void>;
}

export interface Mailer {
  send(message: ContactRequest): Promise<void>;
}

export interface Result {
  status: number;
  body: ContactResponse;
}

export const GLOBAL_HOURLY_LIMIT = 10;
export const SENDER_HOURLY_LIMIT = 3;
const COUNTER_TTL_MS = 7200000;
const CLAIM_TTL_MS = 86400000;

export function createService(
  store: Store,
  mailer: Mailer,
  pepper: string,
  now = Date.now,
) {
  if (pepper.length < 32)
    throw Error("Contact hashing secret is not configured");
  const hash = (v: string) =>
    createHmac("sha256", pepper).update(v).digest("hex");
  const limitedKeys = new Map<string, number>();
  const recentIds = new Set<string>();
  function markLimited(key: string, expires: number, nowMs: number) {
    if (limitedKeys.size >= 500) {
      for (const [k, exp] of limitedKeys)
        if (exp <= nowMs) limitedKeys.delete(k);
      if (limitedKeys.size >= 500) {
        const oldest = limitedKeys.keys().next().value;
        if (oldest) limitedKeys.delete(oldest);
      }
    }
    limitedKeys.set(key, expires);
  }
  return async function submit(raw: string): Promise<Result> {
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES)
      return { status: 413, body: { status: "invalid" } };
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      return { status: 400, body: { status: "invalid" } };
    }
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) return { status: 400, body: { status: "invalid" } };
    const data = parsed.data;
    if (data.website) return { status: 202, body: { status: "accepted" } };
    const time = now();
    const hour = Math.floor(time / 3600000);
    const globalKey = `global-${hour}`;
    const senderKey = `sender-${hash(data.email)}-${hour}`;
    if (!recentIds.has(data.submissionId)) {
      const globalBlockedUntil = limitedKeys.get(globalKey) ?? 0;
      const senderBlockedUntil = limitedKeys.get(senderKey) ?? 0;
      if (globalBlockedUntil > time || senderBlockedUntil > time)
        return { status: 429, body: { status: "limited" } };
    }
    const payloadHash = hash(
      JSON.stringify({ ...data, submissionId: undefined }),
    );
    try {
      const existing = await store.claim(data.submissionId, {
        hash: payloadHash,
        state: "pending",
        expires: time + CLAIM_TTL_MS,
      });
      if (recentIds.size >= 200) {
        const oldest = recentIds.values().next().value;
        if (oldest) recentIds.delete(oldest);
      }
      recentIds.add(data.submissionId);
      if (existing) {
        if (existing.hash !== payloadHash)
          return { status: 409, body: { status: "conflict" } };
        if (existing.state === "accepted")
          return { status: 202, body: { status: "accepted" } };
        if (existing.state === "limited")
          return { status: 429, body: { status: "limited" } };
        return { status: 409, body: { status: "pending" } };
      }
      const expires = time + COUNTER_TTL_MS;
      const globalAllowed = await store.consume(
        globalKey,
        GLOBAL_HOURLY_LIMIT,
        expires,
      );
      if (!globalAllowed) {
        markLimited(globalKey, expires, time);
        await store.finish(data.submissionId, "limited");
        return { status: 429, body: { status: "limited" } };
      }
      const senderAllowed = await store.consume(
        senderKey,
        SENDER_HOURLY_LIMIT,
        expires,
      );
      if (!senderAllowed) {
        markLimited(senderKey, expires, time);
        await store.finish(data.submissionId, "limited");
        return { status: 429, body: { status: "limited" } };
      }
      try {
        await mailer.send(data);
      } catch {
        await store.finish(data.submissionId, "uncertain");
        return { status: 503, body: { status: "unavailable" } };
      }
      await store.finish(data.submissionId, "accepted");
      return { status: 202, body: { status: "accepted" } };
    } catch {
      return { status: 503, body: { status: "unavailable" } };
    }
  };
}

export class MemoryStore implements Store {
  readonly records = new Map<string, RecordValue>();
  readonly counts = new Map<string, { count: number; expires: number }>();
  async claim(id: string, value: RecordValue) {
    const old = this.records.get(id);
    if (old) return old;
    this.records.set(id, { ...value });
    return null;
  }
  async finish(id: string, state: SendState) {
    const item = this.records.get(id);
    if (!item) throw Error("Missing claim");
    item.state = state;
  }
  async consume(key: string, limit: number, expires: number) {
    const item = this.counts.get(key) || { count: 0, expires };
    if (item.count >= limit) return false;
    item.count++;
    this.counts.set(key, item);
    return true;
  }
  async cleanup(now: number) {
    for (const [key, value] of this.records)
      if (value.expires < now) this.records.delete(key);
    for (const [key, value] of this.counts)
      if (value.expires < now) this.counts.delete(key);
  }
}

