import { createServer } from "node:http";
import { Readable } from "node:stream";
import type { ContactRequest } from "@lanafox/contracts";
import { createService, MemoryStore } from "../apps/api/src/contact";
import { createHttpHandler } from "../apps/api/src/http";

const store = new MemoryStore();
// Local-only, bounded inbox; restarting clears it. Never log message bodies.
const inbox: ContactRequest[] = [];

const submit = createService(
  store,
  {
    async send(message) {
      inbox.push(message);
      if (inbox.length > 100) inbox.shift();
    },
  },
  "local-test-only-secret-at-least-32-characters",
);

const handler = createHttpHandler(submit, [
  "http://localhost:3000",
  "http://localhost:3101",
  "http://localhost:3102",
]);

createServer(async (req, res) => {
  try {
    if (req.url === "/__test/inbox" && req.method === "GET") {
      if (
        req.headers.origin ||
        !["localhost:7071", "127.0.0.1:7071"].includes(req.headers.host || "")
      ) {
        res.writeHead(403);
        res.end();
        return;
      }
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(inbox, null, 2));
      return;
    }

    const response = await handler(
      new Request(`http://localhost:7071${req.url}`, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: ["POST", "PUT"].includes(req.method || "")
          ? Readable.toWeb(req)
          : undefined,
        duplex: "half",
      } as RequestInit),
    );
    res.writeHead(response.status, Object.fromEntries(response.headers));
    const body = await response.text();
    res.end(
      response.status === 202
        ? JSON.stringify({ ...JSON.parse(body), delivery: "preview" })
        : body,
    );
  } catch {
    res.writeHead(500);
    res.end();
  }
}).listen(7071, "127.0.0.1", () =>
  console.log(
    "Mock contact API http://localhost:7071/api/contact (inbox: http://localhost:7071/__test/inbox) — sends no email",
  ),
);

