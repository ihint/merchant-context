import { z } from "zod";

const httpsUrl = z.string().url().startsWith("https://");
const sourceLink = z
  .object({
    name: z.string().min(1),
    url: httpsUrl,
  })
  .strict();
const price = z
  .object({
    amount: z.number().min(0),
    currency: z.string().regex(/^[A-Z]{3}$/),
    billing_period: z
      .enum(["one_time", "day", "week", "month", "year"])
      .optional(),
    tax_included: z.boolean().optional(),
  })
  .strict();
const offer = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    canonical_url: httpsUrl,
    audience: z.string().optional(),
    price: price.optional(),
    availability: z.enum([
      "available",
      "limited",
      "unavailable",
      "contact_merchant",
    ]),
    limits: z.array(z.string()).optional(),
    updated_at: z.string().datetime({ offset: true }),
  })
  .strict();
const action = z
  .object({
    name: z.enum([
      "learn_more",
      "contact",
      "request_quote",
      "book",
      "checkout",
    ]),
    method: z.enum(["GET", "POST"]),
    url: httpsUrl,
    human_confirmation_required: z.boolean(),
    protocol: z.string().optional(),
  })
  .strict();

export const merchantContextSchema = z
  .object({
    version: z.literal("0.1"),
    merchant: z
      .object({
        name: z.string().min(1),
        canonical_url: httpsUrl,
        legal_name: z.string().optional(),
        support_url: z.string().url().optional(),
      })
      .strict(),
    offers: z.array(offer).min(1),
    policies: z.array(sourceLink),
    actions: z.array(action),
    provenance: z
      .object({
        generated_at: z.string().datetime({ offset: true }),
        source_urls: z.array(z.string().url()).min(1),
      })
      .strict(),
  })
  .strict();
