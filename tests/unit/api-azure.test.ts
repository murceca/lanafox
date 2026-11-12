import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { EmailMessage } from "@azure/communication-email";
import type { TableEntityResult } from "@azure/data-tables";
import type { HttpRequest, InvocationContext, Timer } from "@azure/functions";
import type { ContactRequest } from "@lanafox/contracts";
import {
  AcsMailer,
  createAzureCleanupHandler,
  createAzureContactHandler,
  createRuntimeFromEnv,
  escapeHtml,
  TableStore,
  type EmailClientLike,
  type TableClientLike,
  type TableEntityRow,
} from "../../apps/api/src";

class FakeTableClient implements TableClientLike {
  readonly rows = new Map<string, TableEntityRow & { etag: string }>();
  private etagCounter = 1;
  simulateNextUpdate412 = false;

  private key(partitionKey: string, rowKey: string) {
    return `${partitionKey}:${rowKey}`;
  }

  async createEntity(entity: TableEntityRow): Promise<unknown> {
    const k = this.key(entity.partitionKey, entity.rowKey);
    if (this.rows.has(k)) {
      const err = new Error("EntityAlreadyExists") as Error & {
        statusCode: number;
      };
      err.statusCode = 409;
      throw err;
    }
    this.rows.set(k, {
      ...entity,
      etag: `W/"etag-${this.etagCounter++}"`,
    });
    return {};
  }

  async getEntity(
    partitionKey: string,
    rowKey: string,
  ): Promise<TableEntityResult<Record<string, unknown>>> {
    const k = this.key(partitionKey, rowKey);
    const row = this.rows.get(k);
    if (!row) {
      const err = new Error("ResourceNotFound") as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }
    return { ...row } as TableEntityResult<Record<string, unknown>>;
  }

  async updateEntity(
    entity: TableEntityRow,
    _mode: "Merge" | "Replace",
    options?: { etag?: string },
  ): Promise<unknown> {
    const k = this.key(entity.partitionKey, entity.rowKey);
    const current = this.rows.get(k);
    if (!current) {
      const err = new Error("ResourceNotFound") as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }
    if (
      this.simulateNextUpdate412 ||
      (options?.etag && options.etag !== current.etag)
    ) {
      this.simulateNextUpdate412 = false;
      const err = new Error("UpdateConditionNotSatisfied") as Error & {
        statusCode: number;
      };
      err.statusCode = 412;
      throw err;
    }
    this.rows.set(k, {
      ...current,
      ...entity,
      etag: `W/"etag-${this.etagCounter++}"`,
    });
    return {};
  }

  async deleteEntity(partitionKey: string, rowKey: string): Promise<unknown> {
    this.rows.delete(this.key(partitionKey, rowKey));
    return {};
  }

  async *listEntities(options?: {
    queryOptions?: { filter?: string };
  }): AsyncIterable<TableEntityResult<Record<string, unknown>>> {
    const filter = options?.queryOptions?.filter ?? "";
    const match = /expires lt (\d+)/.exec(filter);
    const cutoff = match ? Number(match[1]) : Number.POSITIVE_INFINITY;
    for (const row of this.rows.values()) {
      if (typeof row.expires === "number" && row.expires < cutoff) {
        yield { ...row } as TableEntityResult<Record<string, unknown>>;
      }
    }
  }
}

test("TableStore supports claim, finish, ETag-retried consume, and expired row cleanup", async () => {
  const client = new FakeTableClient();
  const store = new TableStore(client);

  const firstClaim = await store.claim("sub-1", {
    hash: "abc",
    state: "pending",
    expires: 1000,
  });
  assert.equal(firstClaim, null);

  const duplicateClaim = await store.claim("sub-1", {
    hash: "abc",
    state: "pending",
    expires: 1000,
  });
  assert.deepEqual(duplicateClaim, {
    hash: "abc",
    state: "pending",
    expires: 1000,
  });

  await store.finish("sub-1", "accepted");
  const finishedClaim = await store.claim("sub-1", {
    hash: "abc",
    state: "pending",
    expires: 1000,
  });
  assert.equal(finishedClaim?.state, "accepted");

  // Consume with initial 404 creation and subsequent 412 ETag retry
  assert.equal(await store.consume("sender-1", 2, 500), true);
  client.simulateNextUpdate412 = true;
  assert.equal(await store.consume("sender-1", 2, 500), true);
  assert.equal(await store.consume("sender-1", 2, 500), false);

  // Cleanup removes rows with expires < now (500 < 750) while keeping 1000
  await store.cleanup(750);
  assert.equal(client.rows.has("rate:sender-1"), false);
  assert.equal(client.rows.has("claim:sub-1"), true);
});

test("AcsMailer escapes HTML entities, sanitizes subject headers, and checks delivery status", async () => {
  assert.equal(
    escapeHtml(`<script>alert("x" & 'y')</script>`),
    "&lt;script&gt;alert(&quot;x&quot; &amp; &#39;y&#39;)&lt;/script&gt;",
  );

  const sentMessages: EmailMessage[] = [];
  let statusToReturn = "Succeeded";
  const fakeEmailClient: EmailClientLike = {
    async beginSend(message) {
      sentMessages.push(message);
      return {
        async pollUntilDone() {
          return { status: statusToReturn };
        },
      };
    },
  };

  const mailer = new AcsMailer(
    fakeEmailClient,
    "DoNotReply@lanafox.eu",
    "contact@lanafox.eu",
  );

  const payload: ContactRequest = {
    name: "Lesya\r\nUkrainska <img src=x>",
    email: "lesya@example.com",
    message: "Line 1\n<b>Line 2</b>",
    locale: "uk",
    website: "",
    submissionId: randomUUID(),
  };

  await mailer.send(payload);
  assert.equal(sentMessages.length, 1);
  const msg = sentMessages[0];
  assert.equal(msg.senderAddress, "DoNotReply@lanafox.eu");
  assert.equal(
    msg.content.subject,
    "[Lana Fox] New inquiry from Lesya Ukrainska <img src=x>",
  );
  assert.ok(!msg.content.subject.includes("\r"));
  assert.ok(
    msg.content.html?.includes(
      "Lesya\r\nUkrainska &lt;img src=x&gt;",
    ),
  );
  assert.ok(msg.content.html?.includes("Line 1<br />&lt;b&gt;Line 2&lt;/b&gt;"));

  statusToReturn = "Failed";
  await assert.rejects(() => mailer.send(payload), /Email delivery failed/);
});

test("Azure Functions HTTP and Timer handlers process requests and log cleanup failures without leaking secrets", async () => {
  const client = new FakeTableClient();
  const store = new TableStore(client);
  let sentCount = 0;

  const contactHandler = createAzureContactHandler(() => ({
    store,
    mailer: {
      async send() {
        sentCount++;
      },
    },
    secret: "azure-function-unit-test-secret-32-chars",
    origins: ["https://lanafox.eu"],
  }));

  const errors: string[] = [];
  const fakeContext = {
    error(msg: string) {
      errors.push(msg);
    },
  } as unknown as InvocationContext;

  const bodyText = JSON.stringify({
    name: "Ivan Franko",
    email: "ivan@example.com",
    message: "Hello from Lviv, testing Azure Function HTTP handler.",
    locale: "en",
    website: "",
    submissionId: randomUUID(),
  });

  const fakeRequest = {
    url: "https://api.lanafox.eu/api/contact",
    method: "POST",
    headers: new Headers({
      Origin: "https://lanafox.eu",
      "Content-Type": "application/json",
    }),
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from(bodyText, "utf8"));
        controller.close();
      },
    }),
  } as unknown as HttpRequest;

  const response = await contactHandler(fakeRequest, fakeContext);
  assert.equal(response.status, 202);
  assert.equal(sentCount, 1);

  const cleanupHandler = createAzureCleanupHandler(
    () => ({
      async cleanup() {
        throw new Error("Simulated Table timeout");
      },
    }),
    () => 123456,
  );

  await assert.rejects(() =>
    cleanupHandler({} as Timer, fakeContext),
  );
  assert.deepEqual(errors, ["contact_cleanup_failed"]);

  assert.throws(
    () => createRuntimeFromEnv({}),
    /Missing required Azure Function environment settings/,
  );
});

