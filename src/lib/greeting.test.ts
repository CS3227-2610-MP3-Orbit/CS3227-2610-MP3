import { describe, expect, it } from "vitest";

import { greetingFor, timeOfDayInSingapore } from "./greeting";

// Builds a UTC Date instant corresponding to the given Singapore-time (SGT, UTC+8) hour/minute.
// The function under test only reads the UTC hour/minute, so the calendar date is irrelevant --
// Date.UTC normalizes an out-of-range hour (e.g. 04:00 SGT is UTC hour -4) into the previous day.
function sgt(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 0, 1, hour - 8, minute));
}

describe("timeOfDayInSingapore [SH-07-AC14]", () => {
  it("is evening just before the morning boundary (04:59 SGT)", () => {
    expect(timeOfDayInSingapore(sgt(4, 59))).toBe("evening");
  });

  it("is morning at the morning boundary (05:00 SGT)", () => {
    expect(timeOfDayInSingapore(sgt(5, 0))).toBe("morning");
  });

  it("is still morning just before the afternoon boundary (11:59 SGT)", () => {
    expect(timeOfDayInSingapore(sgt(11, 59))).toBe("morning");
  });

  it("is afternoon at the afternoon boundary (12:00 SGT)", () => {
    expect(timeOfDayInSingapore(sgt(12, 0))).toBe("afternoon");
  });

  it("is still afternoon just before the evening boundary (17:59 SGT)", () => {
    expect(timeOfDayInSingapore(sgt(17, 59))).toBe("afternoon");
  });

  it("is evening at the evening boundary (18:00 SGT)", () => {
    expect(timeOfDayInSingapore(sgt(18, 0))).toBe("evening");
  });

  it("is still evening after midnight (00:00 SGT)", () => {
    expect(timeOfDayInSingapore(sgt(0, 0))).toBe("evening");
  });
});

describe("greetingFor [SH-07-AC14]", () => {
  it("renders the dashboard header greeting with the signed-in user's full name", () => {
    expect(greetingFor(sgt(9, 0), "Ada Lovelace")).toBe("Good morning, Ada Lovelace");
    expect(greetingFor(sgt(14, 0), "Ada Lovelace")).toBe("Good afternoon, Ada Lovelace");
    expect(greetingFor(sgt(20, 0), "Ada Lovelace")).toBe("Good evening, Ada Lovelace");
  });
});
