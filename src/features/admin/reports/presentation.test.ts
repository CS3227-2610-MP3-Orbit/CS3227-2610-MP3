import { describe, expect, it } from "vitest";

import {
  SUMMARY_LABEL,
  SUMMARY_MAX_CHARS,
  hasAnyBookings,
  statusLabel,
  truncateSummary,
} from "./presentation";

describe("[ADM-04-AC9] AI summary output bounding", () => {
  it("leaves a short summary untouched and marks it not truncated", () => {
    const result = truncateSummary("A short summary.");
    expect(result).toEqual({ text: "A short summary.", truncated: false });
  });

  it("truncates a summary over 1,200 characters at a word boundary, never mid-word", () => {
    const words = Array.from({ length: 400 }, (_, index) => `word${index}`);
    const long = words.join(" "); // far over 1,200 characters
    const result = truncateSummary(long);

    expect(result.truncated).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(SUMMARY_MAX_CHARS);
    // The cut text must be a prefix of the original, ending at a whole word.
    expect(long.startsWith(result.text)).toBe(true);
    const nextChar = long[result.text.length];
    expect(nextChar === " " || nextChar === undefined).toBe(true);
    expect(result.text.endsWith(" ")).toBe(false);
  });

  it("trims surrounding whitespace even when under the bound", () => {
    expect(truncateSummary("  padded text  \n")).toEqual({ text: "padded text", truncated: false });
  });

  it("the advisory label is present for the UI to render alongside any summary", () => {
    expect(SUMMARY_LABEL).toBe("AI-generated — advisory");
  });

  it("statusLabel capitalises only the first letter of a booking_status value", () => {
    expect(statusLabel("pending")).toBe("Pending");
    expect(statusLabel("cancelled")).toBe("Cancelled");
  });

  it("hasAnyBookings reflects totalBookings being greater than zero", () => {
    const base = {
      period: { startDate: "a", endDate: "b" },
      byStatus: [] as { status: string; count: number }[],
      byCourse: [] as { courseId: string; code: string; name: string; count: number }[],
      byLecturer: [] as { lecturerId: string; lecturerName: string; count: number }[],
      byDay: [] as { date: string; count: number }[],
    };
    expect(hasAnyBookings({ kind: "success", totalBookings: 0, ...base })).toBe(false);
    expect(hasAnyBookings({ kind: "success", totalBookings: 3, ...base })).toBe(true);
  });
});
