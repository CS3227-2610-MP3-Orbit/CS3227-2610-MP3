import { z } from "zod";

import { boundedInput } from "./request-validation";
export { parseAdvice, type Advice } from "@/lib/ai/output-validation";

const safeText = z
  .string()
  .refine(
    (value) =>
      !value.includes("\0") &&
      !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value),
  )
  .transform((value) => value.trim());

const inputText = (max: number) =>
  safeText.refine((value) => [...value].length >= 1 && [...value].length <= max);

export const improveRequestInputSchema = z
  .object({ topic: inputText(200), questions: inputText(2000) })
  .strict();

export type ImproveRequestInput = z.infer<typeof improveRequestInputSchema>;

export type ImproveResult =
  | { kind: "success"; proposal: import("@/lib/ai/output-validation").Advice }
  | { kind: "validation_error"; field: "topic" | "questions" | "request" }
  | { kind: "forbidden_or_not_found" }
  | { kind: "quota_exceeded"; retryAfterSeconds?: number }
  | { kind: "in_flight" }
  | {
      kind: "ai_unavailable";
      reason: "timeout" | "rate_limited" | "unavailable" | "invalid_output";
      retryAfterSeconds?: number;
    }
  | { kind: "unresolved_attempt" };

export function parseImproveRequest(raw: unknown) {
  return improveRequestInputSchema.safeParse(boundedInput(raw));
}

export function validateProposalForApply(
  raw: unknown,
):
  | { success: true; data: { topic: string; questions: string } }
  | { success: false; field: "topic" | "questions" } {
  const parsed = z.object({ topic: inputText(200), questions: inputText(2000) }).safeParse(raw);
  if (parsed.success) return { success: true, data: parsed.data };
  const field = parsed.error.issues[0]?.path[0];
  return { success: false, field: field === "questions" ? "questions" : "topic" };
}
