import { EmailClient, type EmailMessage } from "@azure/communication-email";
import { odata, TableClient, type TableEntityResult } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import type { ContactRequest } from "@lanafox/contracts";
import type { Mailer, RecordValue, SendState, Store } from "./contact";

export interface TableEntityRow {
  partitionKey: string;
  rowKey: string;
  hash?: string;
  state?: SendState;
  count?: number;
  expires?: number;
  etag?: string;
}

export interface TableClientLike {
  createEntity(entity: TableEntityRow): Promise<unknown>;
  getEntity(
    partitionKey: string,
    rowKey: string,
  ): Promise<TableEntityResult<Record<string, unknown>>>;
  updateEntity(
    entity: TableEntityRow,
    mode: "Merge" | "Replace",
    options?: { etag?: string },
  ): Promise<unknown>;
  deleteEntity(partitionKey: string, rowKey: string): Promise<unknown>;
  listEntities(options?: {
    queryOptions?: { filter?: string };
  }): AsyncIterable<TableEntityResult<Record<string, unknown>>>;
}

function getStatusCode(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const code = (error as { statusCode?: unknown }).statusCode;
    if (typeof code === "number") return code;
  }
  return undefined;
}

export class TableStore implements Store {
  private readonly client: TableClientLike;

  constructor(
    endpointOrClient: string | TableClientLike,
    tableName = "ApiState",
  ) {
    if (typeof endpointOrClient === "string") {
      this.client = new TableClient(
        endpointOrClient,
        tableName,
        new DefaultAzureCredential(),
      );
    } else {
      this.client = endpointOrClient;
    }
  }

  async claim(id: string, value: RecordValue): Promise<RecordValue | null> {
    try {
      await this.client.createEntity({
        partitionKey: "claim",
        rowKey: id,
        hash: value.hash,
        state: value.state,
        expires: value.expires,
      });
      return null;
    } catch (error) {
      if (getStatusCode(error) === 409) {
        const existing = await this.client.getEntity("claim", id);
        return {
          hash: String(existing.hash ?? ""),
          state: (existing.state as SendState) ?? "pending",
          expires: Number(existing.expires ?? 0),
        };
      }
      throw error;
    }
  }

  async finish(id: string, state: SendState): Promise<void> {
    await this.client.updateEntity(
      {
        partitionKey: "claim",
        rowKey: id,
        state,
      },
      "Merge",
    );
  }

  async consume(key: string, limit: number, expires: number): Promise<boolean> {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const existing = await this.client.getEntity("rate", key);
        const currentCount = Number(existing.count ?? 0);
        if (currentCount >= limit) {
          return false;
        }
        try {
          await this.client.updateEntity(
            {
              partitionKey: "rate",
              rowKey: key,
              count: currentCount + 1,
              expires,
            },
            "Merge",
            { etag: existing.etag },
          );
          return true;
        } catch (updateError) {
          if (getStatusCode(updateError) === 412) {
            continue;
          }
          throw updateError;
        }
      } catch (getError) {
        if (getStatusCode(getError) === 404) {
          try {
            await this.client.createEntity({
              partitionKey: "rate",
              rowKey: key,
              count: 1,
              expires,
            });
            return true;
          } catch (createError) {
            if (getStatusCode(createError) === 409) {
              continue;
            }
            throw createError;
          }
        }
        throw getError;
      }
    }
    throw new Error("Rate limit optimistic concurrency retries exhausted");
  }

  async cleanup(now: number): Promise<void> {
    const safeNow = Math.floor(now);
    const entities = this.client.listEntities({
      queryOptions: { filter: odata`expires lt ${safeNow}` },
    });
    for await (const entity of entities) {
      if (entity.partitionKey && entity.rowKey) {
        await this.client.deleteEntity(entity.partitionKey, entity.rowKey);
      }
    }
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeHeaderText(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export interface EmailClientLike {
  beginSend(message: EmailMessage): Promise<{
    pollUntilDone(): Promise<{ status: string }>;
  }>;
}

export class AcsMailer implements Mailer {
  private readonly client: EmailClientLike;
  private readonly sender: string;
  private readonly recipient: string;

  constructor(
    endpointOrClient: string | EmailClientLike,
    sender: string,
    recipient: string,
  ) {
    if (!sender || !recipient) {
      throw new Error("Email sender and recipient must be configured");
    }
    this.client =
      typeof endpointOrClient === "string"
        ? new EmailClient(endpointOrClient, new DefaultAzureCredential())
        : endpointOrClient;
    this.sender = sender;
    this.recipient = recipient;
  }

  async send(message: ContactRequest): Promise<void> {
    const safeName = sanitizeHeaderText(message.name);
    const escapedName = escapeHtml(message.name);
    const escapedEmail = escapeHtml(message.email);
    const escapedLocale = escapeHtml(message.locale);
    const escapedMessage = escapeHtml(message.message).replace(/\n/g, "<br />");

    const poller = await this.client.beginSend({
      senderAddress: this.sender,
      recipients: {
        to: [{ address: this.recipient }],
      },
      replyTo: [
        {
          address: message.email,
          displayName: safeName,
        },
      ],
      content: {
        subject: `[Lana Fox] New inquiry from ${safeName}`,
        plainText: [
          `Name: ${message.name}`,
          `Email: ${message.email}`,
          `Locale: ${message.locale}`,
          "",
          message.message,
        ].join("\n"),
        html: [
          "<!doctype html><html><body>",
          `<p><strong>Name:</strong> ${escapedName}</p>`,
          `<p><strong>Email:</strong> ${escapedEmail}</p>`,
          `<p><strong>Locale:</strong> ${escapedLocale}</p>`,
          "<hr />",
          `<p>${escapedMessage}</p>`,
          "</body></html>",
        ].join(""),
      },
    });

    const result = await poller.pollUntilDone();
    if (result.status !== "Succeeded") {
      throw new Error(`Email delivery failed with status ${result.status}`);
    }
  }
}

