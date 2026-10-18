import { z } from "zod";

export const uuid = z
  .string()
  .max(36)
  .uuid()
  .transform((value) => value.toLowerCase());
const safeText = z
  .string()
  .refine(
    (value) =>
      !value.includes("\0") &&
      !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value),
  );
const text = (max: number) =>
  safeText
    .transform((value) => value.trim())
    .refine((value) => [...value].length >= 1 && [...value].length <= max);
export const lookupInputSchema = z.object({ slotId: uuid }).strict();
export const recoverInputSchema = z.object({ idempotencyKey: uuid }).strict();
export const requestInputSchema = z
  .object({
    slotId: uuid,
    slotVersion: safeText.min(1).max(512),
    topic: text(200),
    questions: text(2000),
    idempotencyKey: uuid,
  })
  .strict();
export type RequestInput = z.infer<typeof requestInputSchema>;
export const fieldSchema = z.enum([
  "slotId",
  "slotVersion",
  "topic",
  "questions",
  "idempotencyKey",
  "request",
]);
export type RequestField = z.infer<typeof fieldSchema>;

// Decode only scalar application fields, retaining duplicate/unknown-field rejection.
export function boundedInput(raw: unknown): unknown {
  if (raw instanceof FormData) {
    const object: Record<string, unknown> = {};
    for (const [key, value] of raw) {
      if (key.startsWith("$ACTION_")) continue;
      if (Object.hasOwn(object, key) || typeof value !== "string") return null;
      Object.defineProperty(object, key, { value, enumerable: true });
    }
    raw = object;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  let size = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "string") return null;
    size += new TextEncoder().encode(key).length + new TextEncoder().encode(value).length;
    if (size > 16384) return null;
  }
  return raw;
}

export const slotSchema = z
  .object({
    slotId: uuid,
    courseId: uuid,
    courseCode: z.string(),
    courseName: z.string(),
    lecturerId: uuid,
    lecturerName: z.string(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    slotVersion: z.string().min(1).max(512),
  })
  .strict()
  .refine((slot) => Date.parse(slot.endsAt) > Date.parse(slot.startsAt));
export type RequestSlot = z.infer<typeof slotSchema>;
export const receiptSchema = z
  .object({
    bookingId: uuid,
    slotId: uuid,
    status: z.enum(["pending", "approved", "rejected", "cancelled", "completed"]),
  })
  .strict();
const failureSchemas = [
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z
    .object({
      kind: z.literal("conflict"),
      reason: z.enum([
        "slot_unavailable",
        "student_overlap",
        "slot_changed",
        "idempotency_mismatch",
      ]),
    })
    .strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
  z.object({ kind: z.literal("outcome_unknown"), correlationId: uuid }).strict(),
] as const;
export const receiptResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), receipt: receiptSchema }).strict(),
  ...failureSchemas,
]);
export const lookupResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), slot: slotSchema }).strict(),
  ...failureSchemas,
]);
export type ReceiptResult = z.infer<typeof receiptResultSchema>;
export type LookupResult = z.infer<typeof lookupResultSchema>;
