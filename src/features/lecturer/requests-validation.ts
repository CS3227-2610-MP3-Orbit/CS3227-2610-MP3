import { z } from "zod";

const uuid = z.string().uuid();
const text = z
  .string()
  .max(200)
  .transform((value) => value.trim());
export const decisionInputSchema = z
  .object({
    bookingId: uuid,
    decision: z.enum(["approved", "rejected"]),
    reason: text,
    version: z.string().min(1).max(512),
    operationKey: uuid,
  })
  .strict();
export const requestSchema = z
  .object({
    bookingId: uuid,
    slotId: uuid,
    status: z.enum(["pending", "approved", "rejected", "cancelled", "completed"]),
    courseCode: z.string(),
    courseName: z.string(),
    lecturerName: z.string(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    topic: z.string(),
    questions: z.string(),
    studentId: uuid,
    rejectionReason: z.string().nullable(),
    version: z.string().min(1),
  })
  .strict();
const failures = [
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
  z.object({ kind: z.literal("validation_error"), field: z.enum(["request", "reason"]) }).strict(),
  z.object({ kind: z.literal("conflict"), reason: z.literal("request_changed") }).strict(),
] as const;
export const listResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), requests: z.array(requestSchema) }).strict(),
  ...failures,
]);
export const decisionResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("success"),
      bookingId: uuid,
      status: z.enum(["approved", "rejected"]),
      notificationPending: z.boolean(),
    })
    .strict(),
  ...failures,
]);
export type Request = z.infer<typeof requestSchema>;
export type ListResult = z.infer<typeof listResultSchema>;
export type DecisionResult = z.infer<typeof decisionResultSchema>;
