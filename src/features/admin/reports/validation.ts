import { z } from "zod";

import { isBoundedPeriod, isValidIsoDate } from "./period";

// Decode only scalar application fields, retaining duplicate/unknown-field rejection. Copied from
// src/features/admin/courses/validation.ts for the same cross-feature-independence reason that
// file documents (kept self-contained per feature, even though both share one CODEOWNERS owner).
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

// ADM-04-R1/R2: validated here too (not only in admin_get_booking_report), so a malformed or
// out-of-bounds period is refused before any RPC call, matching ADM-02's defense-in-depth style.
const dateSchema = z.string().refine(isValidIsoDate);

export const fieldSchema = z.enum(["startDate", "endDate", "range", "request"]);
export type ReportField = z.infer<typeof fieldSchema>;

const periodShape = { startDate: dateSchema, endDate: dateSchema };

export const getBookingReportInputSchema = z
  .object(periodShape)
  .strict()
  .superRefine((value, ctx) => {
    if (!isBoundedPeriod(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["range"], message: "Invalid period." });
    }
  });
export type GetBookingReportInput = z.infer<typeof getBookingReportInputSchema>;

export const generateActivitySummaryInputSchema = getBookingReportInputSchema;
export type GenerateActivitySummaryInput = z.infer<typeof generateActivitySummaryInputSchema>;

export const statusCountSchema = z.object({ status: z.string(), count: z.number().int() }).strict();
export type StatusCount = z.infer<typeof statusCountSchema>;

export const courseCountSchema = z
  .object({ courseId: z.string(), code: z.string(), name: z.string(), count: z.number().int() })
  .strict();
export type CourseCount = z.infer<typeof courseCountSchema>;

export const lecturerCountSchema = z
  .object({ lecturerId: z.string(), lecturerName: z.string(), count: z.number().int() })
  .strict();
export type LecturerCount = z.infer<typeof lecturerCountSchema>;

export const dayCountSchema = z.object({ date: z.string(), count: z.number().int() }).strict();
export type DayCount = z.infer<typeof dayCountSchema>;

export const periodSchema = z.object({ startDate: z.string(), endDate: z.string() }).strict();
export type ReportPeriod = z.infer<typeof periodSchema>;

// Shape returned by admin_get_booking_report itself (snake-free, already camelCase jsonb).
const rawReportSuccessSchema = z
  .object({
    kind: z.literal("success"),
    startDate: z.string(),
    endDate: z.string(),
    totalBookings: z.number().int(),
    byStatus: z.array(statusCountSchema),
    byCourse: z.array(courseCountSchema),
    byLecturer: z.array(lecturerCountSchema),
    byDay: z.array(dayCountSchema),
  })
  .strict();

export const rawBookingReportResultSchema = z.discriminatedUnion("kind", [
  rawReportSuccessSchema,
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
]);

export const getBookingReportResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("success"),
      period: periodSchema,
      totalBookings: z.number().int(),
      byStatus: z.array(statusCountSchema),
      byCourse: z.array(courseCountSchema),
      byLecturer: z.array(lecturerCountSchema),
      byDay: z.array(dayCountSchema),
    })
    .strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: z.string() }).strict(),
]);
export type GetBookingReportResult = z.infer<typeof getBookingReportResultSchema>;

// ADM-04-R8: the full AiFailure union from src/lib/ai/client.ts, plus the local "not_configured"
// guard (owner decision d) -- re-declared rather than imported, since this feature module must
// stay importable without pulling in "server-only" (src/lib/ai/client.ts has that directive).
export const aiUnavailableReasonSchema = z.enum([
  "not_configured",
  "input_too_long",
  "quota_exceeded",
  "timeout",
  "rate_limited",
  "unavailable",
  "empty_response",
  "invalid_output",
  "in_flight",
  "unresolved_attempt",
]);
export type AiUnavailableReason = z.infer<typeof aiUnavailableReasonSchema>;

export const generateActivitySummaryResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), summary: z.string(), truncated: z.boolean() }).strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z
    .object({
      kind: z.literal("ai_unavailable"),
      reason: aiUnavailableReasonSchema,
      retryAfterSeconds: z.number().optional(),
    })
    .strict(),
]);
export type GenerateActivitySummaryResult = z.infer<typeof generateActivitySummaryResultSchema>;
