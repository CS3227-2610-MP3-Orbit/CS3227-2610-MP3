import type { GetBookingReportResult } from "./validation";

/** ADM-04-R6 (owner decision c): the AI summary's fixed character bound. */
export const SUMMARY_MAX_CHARS = 1200;

/** ADM-04-R6: label every AI summary carries, never presented as the report's own data. */
export const SUMMARY_LABEL = "AI-generated — advisory";

/**
 * ADM-04-R6/AC9: truncates at a word boundary, never mid-word, and never over the bound.
 * Unicode-safe (code-point array, matching this repo's other length-bounding code).
 */
export function truncateSummary(raw: string): { text: string; truncated: boolean } {
  const trimmed = raw.trim();
  const codePoints = [...trimmed];
  if (codePoints.length <= SUMMARY_MAX_CHARS) return { text: trimmed, truncated: false };

  const sliced = codePoints.slice(0, SUMMARY_MAX_CHARS).join("");
  const lastBoundary = Math.max(sliced.lastIndexOf(" "), sliced.lastIndexOf("\n"));
  const cut = lastBoundary > 0 ? sliced.slice(0, lastBoundary) : sliced;
  return { text: cut.trimEnd(), truncated: true };
}

/** Badge text for a status row's catalogue label (first letter capitalised only). */
export function statusLabel(status: string): string {
  return status.length > 0 ? status[0]!.toUpperCase() + status.slice(1) : status;
}

/** True once a successful report has at least one booking anywhere in the period. */
export function hasAnyBookings(
  result: Extract<GetBookingReportResult, { kind: "success" }>,
): boolean {
  return result.totalBookings > 0;
}
