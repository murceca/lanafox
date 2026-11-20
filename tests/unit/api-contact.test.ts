import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { MAX_BODY_BYTES, type ContactRequest } from "@lanafox/contracts";
import {
  createHttpHandler,
  createService,
  GLOBAL_HOURLY_LIMIT,
  MemoryStore,
  SENDER_HOURLY_LIMIT,
  type Store,
} from "../../apps/api/src";

const TEST_SECRET = "unit-test-only-hmac-secret-at-least-32-chars";

function makePayload(overrides: Partial<ContactRequest> = {}): ContactRequest {
  return {
    name: "Taras Shevchenko",
    email: "taras@example.com",
    message: "Hello, I would like to inquire about portrait photography.",
    locale: "uk",
    website: "",
    submissionId: randomUUID(),
    ...overrides,
  };
}

test("contact service delivers once, deduplicates repeated submissionId, and detects conflicts", async () => {
  const store = new MemoryStore();
  const sent: ContactRequest[] = [];
  const submit = createService(
    store,
    {
      async send(msg) {
        sent.push(msg);
      },
    },
    TEST_SECRET,
  );

  const payload = makePayload();
  const raw = JSON.stringify(payload);
  const first = await submit(raw);
  assert.equal(first.status, 202);
  assert.equal(first.body.status, "accepted");
  assert.equal(sent.length, 1);

  const duplicate = await submit(raw);
  assert.equal(duplicate.status, 202);
  assert.equal(duplicate.body.status, "accepted");
  assert.equal(sent.length, 1);

  const tampered = await submit(
    JSON.stringify({ ...payload, message: "Different message with same UUID!" }),
  );
  assert.equal(tampered.status, 409);
  assert.equal(tampered.body.status, "conflict");
});

test("contact service silently drops honeypot submissions without sending email", async () => {
  const store = new MemoryStore();
  let sentCount = 0;
  const submit = createService(
    store,
    {
      async send() {
        sentCount++;
      },
    },
    TEST_SECRET,
  );

  const res = await submit(
    JSON.stringify(makePayload({ website: "https://spam-bot.invalid" })),
  );
  assert.equal(res.status, 202);
  assert.equal(sentCount, 0);
});

test("contact service enforces 3/hr sender limit and short-circuits subsequent floods in memory", async () => {
  const backing = new MemoryStore();
  let storeConsumeCalls = 0;
  const countingStore: Store = {
    claim: (id, value) => backing.claim(id, value),
    finish: (id, state) => backing.finish(id, state),
    cleanup: (now) => backing.cleanup(now),
    consume: async (key, limit, expires) => {
      storeConsumeCalls++;
      return backing.consume(key, limit, expires);
    },
  };

  const submit = createService(
    countingStore,
    { async send() {} },
    TEST_SECRET,
  );

  for (let i = 0; i < SENDER_HOURLY_LIMIT; i++) {
    const ok = await submit(
      JSON.stringify(makePayload({ email: "repeat@example.com" })),
    );
    assert.equal(ok.status, 202);
  }

  const callsBefore4th = storeConsumeCalls;
  const fourth = await submit(
    JSON.stringify(makePayload({ email: "repeat@example.com" })),
  );
  assert.equal(fourth.status, 429);
  const callsAfter4th = storeConsumeCalls;
  assert.ok(callsAfter4th > callsBefore4th);

  // 5th attempt with a fresh submissionId is blocked by limitedKeys pre-check before touching Store
  const fifth = await submit(
    JSON.stringify(makePayload({ email: "repeat@example.com" })),
  );
  assert.equal(fifth.status, 429);
  assert.equal(storeConsumeCalls, callsAfter4th);

  // Confirm per-sender 429 on 4th attempt did NOT consume a 4th global slot
  const globalEntry = [...backing.counts.entries()].find(([k]) =>
    k.startsWith("global-"),
  );
  assert.equal(globalEntry?.[1].count, SENDER_HOURLY_LIMIT);
});

test("contact service allows retrying uncertain (transiently failed) submissions with the same submissionId", async () => {
  const store = new MemoryStore();
  let shouldFail = true;
  let sentCount = 0;
  const submit = createService(
    store,
    {
      async send() {
        if (shouldFail) throw new Error("Transient ACS timeout");
        sentCount++;
      },
    },
    TEST_SECRET,
  );

  const payload = makePayload();
  const raw = JSON.stringify(payload);

  const first = await submit(raw);
  assert.equal(first.status, 503);
  assert.equal(first.body.status, "unavailable");
  assert.equal(sentCount, 0);

  shouldFail = false;
  const retry = await submit(raw);
  assert.equal(retry.status, 202);
  assert.equal(retry.body.status, "accepted");
  assert.equal(sentCount, 1);
});

test("contact service enforces 3/hr per-IP limit across rotating fake email addresses without burning global quota", async () => {
  const store = new MemoryStore();
  const submit = createService(store, { async send() {} }, TEST_SECRET);
  const handler = createHttpHandler(submit, ["https://lanafox.eu"]);

  for (let i = 0; i < SENDER_HOURLY_LIMIT; i++) {
    const res = await handler(
      new Request("https://api.lanafox.eu/api/contact", {
        method: "POST",
        headers: {
          Origin: "https://lanafox.eu",
          "Content-Type": "application/json",
          "CF-Connecting-IP": "203.0.113.42",
        },
        body: JSON.stringify(
          makePayload({ email: `rotating-${i}@example.com` }),
        ),
      }),
    );
    assert.equal(res.status, 202);
  }

  // 4th request from same IP with a brand-new email address is blocked by per-IP limit
  const fourthFromSameIp = await handler(
    new Request("https://api.lanafox.eu/api/contact", {
      method: "POST",
      headers: {
        Origin: "https://lanafox.eu",
        "Content-Type": "application/json",
        "CF-Connecting-IP": "203.0.113.42",
      },
      body: JSON.stringify(
        makePayload({ email: "rotating-fourth@example.com" }),
      ),
    }),
  );
  assert.equal(fourthFromSameIp.status, 429);

  // Another visitor from a different IP can still submit normally
  const otherVisitor = await handler(
    new Request("https://api.lanafox.eu/api/contact", {
      method: "POST",
      headers: {
        Origin: "https://lanafox.eu",
        "Content-Type": "application/json",
        "CF-Connecting-IP": "198.51.100.77",
      },
      body: JSON.stringify(makePayload({ email: "legit@example.com" })),
    }),
  );
  assert.equal(otherVisitor.status, 202);
});

test("contact service enforces 10/hr global limit across distinct senders", async () => {
  const store = new MemoryStore();
  const submit = createService(store, { async send() {} }, TEST_SECRET);

  for (let i = 0; i < GLOBAL_HOURLY_LIMIT; i++) {
    const res = await submit(
      JSON.stringify(makePayload({ email: `sender-${i}@example.com` })),
    );
    assert.equal(res.status, 202);
  }

  const eleventh = await submit(
    JSON.stringify(makePayload({ email: "sender-overflow@example.com" })),
  );
  assert.equal(eleventh.status, 429);
});

test("HTTP handler enforces CORS, HTTP methods, content-type, Retry-After, and body size bounds", async () => {
  const store = new MemoryStore();
  const submit = createService(store, { async send() {} }, TEST_SECRET);
  const handler = createHttpHandler(submit, ["http://localhost:3102"]);

  const preflightOk = await handler(
    new Request("http://localhost:7071/api/contact", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:3102" },
    }),
  );
  assert.equal(preflightOk.status, 204);
  assert.equal(
    preflightOk.headers.get("Access-Control-Allow-Origin"),
    "http://localhost:3102",
  );

  const badOrigin = await handler(
    new Request("http://localhost:7071/api/contact", {
      method: "POST",
      headers: {
        Origin: "https://evil.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(makePayload()),
    }),
  );
  assert.equal(badOrigin.status, 403);

  const wrongMethod = await handler(
    new Request("http://localhost:7071/api/contact", { method: "GET" }),
  );
  assert.equal(wrongMethod.status, 405);

  const wrongType = await handler(
    new Request("http://localhost:7071/api/contact", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "hello",
    }),
  );
  assert.equal(wrongType.status, 415);

  const tooLarge = await handler(
    new Request("http://localhost:7071/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "x".repeat(MAX_BODY_BYTES + 1024),
    }),
  );
  assert.equal(tooLarge.status, 413);

  const throwingHandler = createHttpHandler(
    async () => {
      throw new Error("Unexpected internal failure");
    },
    ["http://localhost:3102"],
  );
  const unexpectedErr = await throwingHandler(
    new Request("http://localhost:7071/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(makePayload()),
    }),
  );
  assert.equal(unexpectedErr.status, 503);
});
