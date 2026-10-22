import { describe, expect, it } from "vitest";

import {
  addDaysIso,
  daysBetween,
  isBoundedPeriod,
  isValidIsoDate,
  precedingPeriod,
  presetPeriod,
  todaySgtIso,
} from "./period";

describe("ADM-04 report period arithmetic", () => {
  it("[ADM-04-AC1] resolves 'Last 7 days' to today plus the preceding 6 SGT days", () => {
    // 2026-03-15T23:30:00Z is already 2026-03-16 in SGT (UTC+8).
    const now = new Date("2026-03-15T23:30:00.000Z");
    expect(todaySgtIso(now)).toBe("2026-03-16");
    expect(presetPeriod("7", now)).toEqual({ startDate: "2026-03-10", endDate: "2026-03-16" });
  });

  it("[ADM-04-AC1] resolves 'Last 30 days' to today plus the preceding 29 SGT days", () => {
    const now = new Date("2026-03-16T04:00:00.000Z");
    expect(presetPeriod("30", now)).toEqual({ startDate: "2026-02-15", endDate: "2026-03-16" });
  });

  it("[ADM-04-AC1] accepts a 92-day span and refuses a 93-day span", () => {
    expect(isBoundedPeriod({ startDate: "2026-01-01", endDate: "2026-04-02" })).toBe(true); // 92 days
    expect(isBoundedPeriod({ startDate: "2026-01-01", endDate: "2026-04-03" })).toBe(false); // 93 days
  });

  it("[ADM-04-AC1] refuses end < start", () => {
    expect(isBoundedPeriod({ startDate: "2026-02-01", endDate: "2026-01-31" })).toBe(false);
  });

  it("[ADM-04-AC1] refuses a malformed or non-existent calendar date", () => {
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("not-a-date")).toBe(false);
    expect(isValidIsoDate("2026-1-1")).toBe(false);
    expect(isBoundedPeriod({ startDate: "2026-02-30", endDate: "2026-03-01" })).toBe(false);
  });

  it("daysBetween/addDaysIso are exact inverses across a month boundary", () => {
    expect(daysBetween("2026-01-31", "2026-02-02")).toBe(2);
    expect(addDaysIso("2026-01-31", 2)).toBe("2026-02-02");
    expect(addDaysIso("2026-02-02", -2)).toBe("2026-01-31");
  });

  it("precedingPeriod returns the immediately preceding period of equal length", () => {
    expect(precedingPeriod({ startDate: "2026-03-10", endDate: "2026-03-16" })).toEqual({
      startDate: "2026-03-03",
      endDate: "2026-03-09",
    });
    // Single-day period: the preceding period is also exactly one day.
    expect(precedingPeriod({ startDate: "2026-03-10", endDate: "2026-03-10" })).toEqual({
      startDate: "2026-03-09",
      endDate: "2026-03-09",
    });
  });
});
