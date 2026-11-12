import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
  type Timer,
} from "@azure/functions";
import { AcsMailer, TableStore } from "./azure";
import { createService, type Mailer, type Store } from "./contact";
import { createHttpHandler } from "./http";

export interface RuntimeConfig {
  store: Store;
  mailer: Mailer;
  secret: string;
  origins: string[];
}

export function createRuntimeFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  const tableEndpoint = env.TABLE_ENDPOINT;
  const tableName = env.API_STATE_TABLE || "ApiState";
  const emailEndpoint = env.EMAIL_ENDPOINT;
  const emailSender = env.EMAIL_SENDER;
  const emailRecipient = env.EMAIL_RECIPIENT;
  const secret = env.API_HASH_SECRET || env.CONTACT_HASH_SECRET || "";
  const origins = (env.ALLOWED_ORIGINS || "https://lanafox.eu")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (
    !tableEndpoint ||
    !emailEndpoint ||
    !emailSender ||
    !emailRecipient ||
    secret.length < 32
  ) {
    throw new Error("Missing required Azure Function environment settings");
  }

  return {
    store: new TableStore(tableEndpoint, tableName),
    mailer: new AcsMailer(emailEndpoint, emailSender, emailRecipient),
    secret,
    origins,
  };
}

export function createAzureContactHandler(getRuntime: () => RuntimeConfig) {
  let cachedHandler: ((request: Request) => Promise<Response>) | null = null;
  return async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> => {
    try {
      if (!cachedHandler) {
        const runtime = getRuntime();
        const submit = createService(
          runtime.store,
          runtime.mailer,
          runtime.secret,
        );
        cachedHandler = createHttpHandler(submit, runtime.origins);
      }

      const headers = new Headers();
      request.headers.forEach((value, key) => {
        headers.set(key, value);
      });

      const hasBody = !["GET", "HEAD", "OPTIONS"].includes(
        request.method.toUpperCase(),
      );
      const webRequest = new Request(request.url, {
        method: request.method,
        headers,
        body: hasBody
          ? (request.body as ReadableStream<Uint8Array> | null)
          : undefined,
        duplex: hasBody ? "half" : undefined,
      } as RequestInit);

      const response = await cachedHandler(webRequest);
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const textBody = await response.text();
      return {
        status: response.status,
        headers: responseHeaders,
        body: textBody || undefined,
      };
    } catch {
      context.error("contact_http_failed");
      return {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
        body: JSON.stringify({ status: "unavailable" }),
      };
    }
  };
}

export function createAzureCleanupHandler(
  getStore: () => Pick<Store, "cleanup">,
  now = Date.now,
) {
  let cachedStore: Pick<Store, "cleanup"> | null = null;
  return async (_timer: Timer, context: InvocationContext): Promise<void> => {
    try {
      if (!cachedStore) {
        cachedStore = getStore();
      }
      await cachedStore.cleanup(now());
    } catch (error) {
      context.error("contact_cleanup_failed");
      throw error;
    }
  };
}

let sharedRuntime: RuntimeConfig | null = null;
function getSharedRuntime(): RuntimeConfig {
  if (!sharedRuntime) {
    sharedRuntime = createRuntimeFromEnv();
  }
  return sharedRuntime;
}

app.http("contact", {
  route: "contact",
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: createAzureContactHandler(getSharedRuntime),
});

app.timer("cleanupApiState", {
  schedule: "0 0 * * * *",
  handler: createAzureCleanupHandler(() => {
    const tableEndpoint = process.env.TABLE_ENDPOINT;
    const tableName = process.env.API_STATE_TABLE || "ApiState";
    if (!tableEndpoint) {
      throw new Error("Missing TABLE_ENDPOINT environment setting");
    }
    return new TableStore(tableEndpoint, tableName);
  }),
});
