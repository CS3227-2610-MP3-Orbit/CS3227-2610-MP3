"use server";

import "server-only";

import { requireRole } from "@/lib/auth/session";
import { generateText } from "@/lib/ai/client";
import { UNTRUSTED_DATA_RULE, wrapUntrusted } from "@/lib/ai/untrusted";

import { parseAdvice, parseImproveRequest, type ImproveResult } from "./improve-request-validation";

const FEATURE = "student.improve-request";
const SYSTEM_INSTRUCTIONS = `You improve a student's draft consultation request. Clarify only facts in the supplied data. Do not invent personal details, enrolment, deadlines, course facts, appointments, or authoritative academic advice. Return exactly one JSON object with exactly the keys topic, questions, and suggestions. topic and questions must each be one non-empty string (put each question on its own line inside the questions string, never an array); suggestions must be an array of at most five non-empty strings. Do not use Markdown, code fences, or prose outside the JSON object. ${UNTRUSTED_DATA_RULE}`;

function invalidField(raw: unknown): ImproveResult {
  const parsed = parseImproveRequest(raw);
  const field = parsed.success ? "request" : parsed.error.issues[0]?.path[0];
  return {
    kind: "validation_error",
    field: field === "topic" || field === "questions" ? field : "request",
  };
}

/**
 * Improves only the unsaved draft. This action never receives a user/slot/booking ID and never
 * mutates a booking; the authenticated identity and fixed prompt are derived server-side.
 */
export async function improveRequestDraft(raw: unknown): Promise<ImproveResult> {
  const user = await requireRole("student");
  const parsed = parseImproveRequest(raw);
  if (!parsed.success) return invalidField(raw);

  const input = `Topic:\n${wrapUntrusted("student.topic", parsed.data.topic)}\n\nQuestions:\n${wrapUntrusted("student.questions", parsed.data.questions)}`;
  const result = await generateText({
    userId: user.id,
    feature: FEATURE,
    system: SYSTEM_INSTRUCTIONS,
    input,
  });
  if (result.ok) {
    const proposal = parseAdvice(result.text);
    return proposal.success
      ? { kind: "success", proposal: proposal.data }
      : { kind: "ai_unavailable", reason: "invalid_output" };
  }
  if (result.reason === "quota_exceeded")
    return { kind: "quota_exceeded", retryAfterSeconds: result.retryAfterSeconds };
  if (result.reason === "in_flight") return { kind: "in_flight" };
  if (result.reason === "unresolved_attempt") return { kind: "unresolved_attempt" };
  if (result.reason === "input_too_long") return { kind: "validation_error", field: "request" };
  return {
    kind: "ai_unavailable",
    reason:
      result.reason === "timeout" || result.reason === "rate_limited"
        ? result.reason
        : "unavailable",
    retryAfterSeconds: result.retryAfterSeconds,
  };
}
