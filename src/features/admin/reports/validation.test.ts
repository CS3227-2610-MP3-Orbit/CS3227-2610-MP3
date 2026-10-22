import { describe, expect, it } from "vitest";

import { boundedInput, getBookingReportInputSchema } from "./validation";

describe("ADM-04 report input validation", () => {
  it("[ADM-04-AC1] accepts a well-formed, bounded period", () => {
    const parsed = getBookingReportInputSchema.safeParse({
      startDate: "2026-03-10",
      endDate: "2026-03-16",
    });
    expect(parsed.success).toBe(true);
  });

  it("[ADM-04-AC1] refuses a 93-day span with field 'range'", () => {
    const parsed = getBookingReportInputSchema.safeParse({
      startDate: "2026-01-01",
      endDate: "2026-04-03",
    });
    expect(parsed.success).toBe(false);
    expect(parsed.success ? null : parsed.error.issues[0]?.path[0]).toBe("range");
  });

  it("[ADM-04-AC1] refuses end < start with field 'range'", () => {
    const parsed = getBookingReportInputSchema.safeParse({
      startDate: "2026-03-16",
      endDate: "2026-03-10",
    });
    expect(parsed.success).toBe(false);
    expect(parsed.success ? null : parsed.error.issues[0]?.path[0]).toBe("range");
  });

  it("refuses a malformed date string with the matching field", () => {
    const badStart = getBookingReportInputSchema.safeParse({
      startDate: "not-a-date",
      endDate: "2026-03-16",
    });
    expect(badStart.success).toBe(false);
    expect(badStart.success ? null : badStart.error.issues[0]?.path[0]).toBe("startDate");
  });

  it("rejects an unknown field (strict) and non-object/FormData shapes", () => {
    expect(
      getBookingReportInputSchema.safeParse({
        startDate: "2026-03-10",
        endDate: "2026-03-16",
        extra: "nope",
      }).success,
    ).toBe(false);
    expect(boundedInput(null)).toBeNull();
    expect(boundedInput("a string")).toBeNull();
    expect(boundedInput({ startDate: 1 })).toBeNull();
  });

  it("boundedInput decodes FormData into a plain object", () => {
    const form = new FormData();
    form.set("startDate", "2026-03-10");
    form.set("endDate", "2026-03-16");
    expect(boundedInput(form)).toEqual({ startDate: "2026-03-10", endDate: "2026-03-16" });
  });
});
