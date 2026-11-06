import { MAX_BODY_BYTES } from "@lanafox/contracts";
import type { Result } from "./service";

export async function readBounded(body: ReadableStream<Uint8Array> | null) {
  if (!body) return "";
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw Error("oversize");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createHttpHandler(
  submit: (body: string) => Promise<Result>,
  origins: string[],
) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Vary: "Origin",
      "X-Content-Type-Options": "nosniff",
    };
    if (origin && !origins.includes(origin))
      return new Response(JSON.stringify({ status: "invalid" }), {
        status: 403,
        headers,
      });
    if (origin) headers["Access-Control-Allow-Origin"] = origin;
    if (request.method === "OPTIONS") {
      headers["Access-Control-Allow-Methods"] = "POST";
      headers["Access-Control-Allow-Headers"] = "Content-Type";
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST")
      return new Response(null, {
        status: 405,
        headers: { ...headers, Allow: "POST, OPTIONS" },
      });
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return new Response(JSON.stringify({ status: "invalid" }), {
        status: 415,
        headers,
      });
    try {
      const raw = await readBounded(request.body);
      const result = await submit(raw);
      if (result.status === 429) headers["Retry-After"] = "3600";
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers,
      });
    } catch {
      return new Response(JSON.stringify({ status: "invalid" }), {
        status: 413,
        headers,
      });
    }
  };
}

