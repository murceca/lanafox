import assert from "node:assert/strict";
import test from "node:test";
import { contactSchema, MAX_BODY_BYTES } from "@lanafox/contracts";

const validPayload = {
  name: "  Olena Koval  ",
  email: "  Olena@Example.com  ",
  message: "  Hello Svitlana, I would love to book a portrait session!  ",
  locale: "en" as const,
  website: "",
  submissionId: "550e8400-e29b-41d4-a716-446655440000",
};

test("contactSchema parses, normalizes email lowercase, and trims valid payloads", () => {
  assert.equal(MAX_BODY_BYTES, 24_576);
  const parsed = contactSchema.parse(validPayload);
  assert.equal(parsed.name, "Olena Koval");
  assert.equal(parsed.email, "olena@example.com");
  assert.equal(
    parsed.message,
    "Hello Svitlana, I would love to book a portrait session!",
  );
  assert.equal(parsed.locale, "en");
});

test("contactSchema rejects malformed or out-of-bounds fields", () => {
  assert.equal(
    contactSchema.safeParse({ ...validPayload, email: "not-an-email" }).success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({ ...validPayload, name: "A" }).success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({ ...validPayload, locale: "de" }).success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({ ...validPayload, submissionId: "not-a-uuid" })
      .success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({ ...validPayload, message: "short" }).success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({ ...validPayload, message: "x".repeat(5001) })
      .success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({ ...validPayload, extraField: "nope" }).success,
    false,
  );
});
