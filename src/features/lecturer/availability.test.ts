import { describe, expect, it } from "vitest";
import { intervalsOverlap, validateSlotInput } from "./availability";

const courseId = "00000000-0000-0000-0000-000000000001";

describe("Lecturer availability validation", () => {
  it("[LEC-01-AC9] rejects reversed intervals", () => {
    expect(validateSlotInput({ courseId, date: "2030-01-01", startTime: "12:00", endTime: "11:00" }, new Date("2029-01-01T00:00:00Z")).ok).toBe(false);
  });
  it("[LEC-01-AC8] allows adjacent slots", () => {
    expect(intervalsOverlap(new Date("2030-01-01T02:00Z"), new Date("2030-01-01T03:00Z"), new Date("2030-01-01T03:00Z"), new Date("2030-01-01T04:00Z"))).toBe(false);
  });
  it("[LEC-01-AC8] rejects genuine overlap", () => {
    expect(intervalsOverlap(new Date("2030-01-01T02:00Z"), new Date("2030-01-01T03:00Z"), new Date("2030-01-01T02:30Z"), new Date("2030-01-01T04:00Z"))).toBe(true);
  });
  it("[LEC-01-AC9] enforces the Singapore one-hour deadline", () => {
    expect(validateSlotInput({ courseId, date: "2030-01-01", startTime: "10:30", endTime: "11:30" }, new Date("2030-01-01T02:00:01Z")).ok).toBe(false);
  });
});
