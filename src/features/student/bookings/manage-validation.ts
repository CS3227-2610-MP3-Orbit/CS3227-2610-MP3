import { z } from "zod";
import { boundedInput, uuid } from "./request-validation";

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
const version = safeText.min(1).max(512);
export const bookingStatus = z.enum(["pending", "approved", "rejected", "cancelled", "completed"]);
export const bookingSchema = z
  .object({
    bookingId: uuid,
    slotId: uuid,
    status: bookingStatus,
    courseCode: z.string(),
    courseName: z.string(),
    lecturerName: z.string(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    topic: z.string(),
    questions: z.string(),
    rejectionReason: z.string().nullable(),
    version,
  })
  .strict();
export const listBookingSchema = bookingSchema.omit({ questions: true, rejectionReason: true });
export const getInputSchema = z.object({ bookingId: uuid }).strict();
export const updateInputSchema = z
  .object({
    bookingId: uuid,
    version,
    topic: text(200),
    questions: text(2000),
    idempotencyKey: uuid,
  })
  .strict();
export const cancelInputSchema = z
  .object({ bookingId: uuid, version, idempotencyKey: uuid })
  .strict();
export const fieldSchema = z.enum([
  "bookingId",
  "version",
  "topic",
  "questions",
  "idempotencyKey",
  "request",
]);
const failures = [
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z
    .object({
      kind: z.literal("conflict"),
      reason: z.enum(["booking_changed", "idempotency_mismatch"]),
    })
    .strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
  z.object({ kind: z.literal("outcome_unknown"), correlationId: uuid }).strict(),
] as const;
export const listResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), bookings: z.array(listBookingSchema) }).strict(),
  ...failures,
]);
export const bookingResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), booking: bookingSchema }).strict(),
  ...failures,
]);
export { boundedInput };
export type Booking = z.infer<typeof bookingSchema>;
export type ListResult = z.infer<typeof listResultSchema>;
export type BookingResult = z.infer<typeof bookingResultSchema>;
