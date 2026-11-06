import { z } from "zod";

export const locales = ["en", "uk"] as const;
export type Locale = (typeof locales)[number];

export const slugs = [
  "",
  "portfolio",
  "contact",
  "privacy-policy",
  "terms-and-conditions",
] as const;
export type Slug = (typeof slugs)[number];

export const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    message: z.string().trim().min(10).max(5000),
    locale: z.enum(locales),
    website: z.string().max(200),
    submissionId: z.string().uuid(),
  })
  .strict();

export type ContactRequest = z.infer<typeof contactSchema>;

export interface ContactResponse {
  status:
    | "accepted"
    | "invalid"
    | "unavailable"
    | "limited"
    | "pending"
    | "conflict";
}

export const MAX_BODY_BYTES = 24576;

