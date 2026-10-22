import "server-only";

import { randomUUID } from "node:crypto";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/client";

import { precedingPeriod } from "./period";
import { ACTIVITY_SUMMARY_SYSTEM_PROMPT, buildActivitySummaryPrompt } from "./prompt";
import { truncateSummary } from "./presentation";
import {
  boundedInput,
  fieldSchema,
  generateActivitySummaryInputSchema,
  getBookingReportInputSchema,
  rawBookingReportResultSchema,
  type GenerateActivitySummaryResult,
  type GetBookingReportResult,
  type ReportField,
} from "./validation";

// ADM-04-R5: matches the "student.improve-request" convention -- one feature name per role's
// own AI capability, admitted by the R10 migration's claim_ai_attempt allowlist.
const FEATURE = "admin.activity-summary";

function temporarilyUnavailable(): { kind: "temporarily_unavailable"; correlationId: string } {
  return { kind: "temporarily_unavailable", correlationId: randomUUID() };
}

function invalid(path?: PropertyKey): { kind: "validation_error"; field: ReportField } {
  const field = fieldSchema.safeParse(path);
  return { kind: "validation_error", field: field.success ? field.data : "request" };
}

/**
 * ADM-04-R8 (owner decision d): checked before any quota claim or provider call, by name only
 * -- never logs or returns the values themselves.
 */
function aiNotConfigured(): boolean {
  return !process.env.SOCLAAS_BASE_URL || !process.env.SOCLAAS_API_KEY;
}

/** ADM-04-R2/R3/R4: counts and catalogue labels only -- never a student id/name/topic/question. */
export async function getBookingReport(raw: unknown): Promise<GetBookingReportResult> {
  await requireRole("admin");
  const input = getBookingReportInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);

  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_get_booking_report", {
        p_start_date: input.data.startDate,
        p_end_date: input.data.endDate,
      })
      .abortSignal(AbortSignal.timeout(10000));
    if (error) return temporarilyUnavailable();

    const parsed = rawBookingReportResultSchema.safeParse(data);
    if (!parsed.success) return temporarilyUnavailable();
    const result = parsed.data;
    if (result.kind !== "success") return result;

    return {
      kind: "success",
      period: { startDate: result.startDate, endDate: result.endDate },
      totalBookings: result.totalBookings,
      byStatus: result.byStatus,
      byCourse: result.byCourse,
      byLecturer: result.byLecturer,
      byDay: result.byDay,
    };
  } catch {
    return temporarilyUnavailable();
  }
}

/** A booking-report outcome that is not itself a usable summary input, mapped 1:1 onto this
 * action's own result union (ADM-04-R7: the summary never mutates and the report path it reads
 * is produced independently of the summary request). */
function reportFailure(
  result: Exclude<GetBookingReportResult, { kind: "success" }>,
): GenerateActivitySummaryResult {
  if (result.kind === "forbidden_or_not_found" || result.kind === "validation_error") {
    return result;
  }
  return { kind: "ai_unavailable", reason: "unavailable" };
}

/**
 * ADM-04-R5/R6/R8: "Summarise this period". Authorization order matches the spec exactly --
 * requireRole, then range validation, then the not_configured guard, then the two report reads
 * that build the prompt, then (only then) generateText's own quota claim and provider call.
 */
export async function generateActivitySummary(
  raw: unknown,
): Promise<GenerateActivitySummaryResult> {
  const user = await requireRole("admin");
  const input = generateActivitySummaryInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);

  if (aiNotConfigured()) return { kind: "ai_unavailable", reason: "not_configured" };

  const current = await getBookingReport(input.data);
  if (current.kind !== "success") return reportFailure(current);

  const preceding = await getBookingReport(precedingPeriod(input.data));
  if (preceding.kind !== "success") return reportFailure(preceding);

  const prompt = buildActivitySummaryPrompt(current, preceding);
  const result = await generateText({
    userId: user.id,
    feature: FEATURE,
    system: ACTIVITY_SUMMARY_SYSTEM_PROMPT,
    input: prompt,
  });
  if (!result.ok) {
    return {
      kind: "ai_unavailable",
      reason: result.reason,
      retryAfterSeconds: result.retryAfterSeconds,
    };
  }

  const { text, truncated } = truncateSummary(result.text);
  return { kind: "success", summary: text, truncated };
}
