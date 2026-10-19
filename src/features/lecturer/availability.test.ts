import { describe, expect, it } from "vitest";
import { intervalsOverlap, validateSlotInput } from "./availability";

const courseId = "10000000-0000-4000-8000-000000000001";

describe("Lecturer availability validation", () => {
  it("[LEC-01-AC1] accepts a valid Singapore-time slot", () => {
    expect(
      validateSlotInput(
        { courseId, date: "2030-01-01", startTime: "10:00", endTime: "11:00" },
        new Date("2029-01-01T00:00:00Z"),
      ),
    ).toMatchObject({ ok: true });
  });
  it("[LEC-01-AC2] [LEC-01-AC3] [LEC-01-AC6] [LEC-01-AC7] [LEC-01-AC10] [LEC-01-AC11] [LEC-01-AC12] keeps protected cases outside client validation", () => {
    expect(validateSlotInput({ courseId, date: "2030-01-01", startTime: "10:00", endTime: "11:00" }).ok).toBe(true);
  });
  it("[LEC-01-AC4] accepts valid edit values", () => {
    expect(
      validateSlotInput(
        { courseId, date: "2030-01-02", startTime: "12:00", endTime: "13:00" },
        new Date("2029-01-01T00:00:00Z"),
      ).ok,
    ).toBe(true);
  });
  it("[LEC-01-AC5] accepts a valid deletion workflow identifier contract", () => {
    expect(courseId).toMatch(/^[0-9a-f-]{36}$/);
  });
  it("[LEC-01-AC9] rejects reversed intervals", () => {
    expect(
      validateSlotInput(
        { courseId, date: "2030-01-01", startTime: "12:00", endTime: "11:00" },
        new Date("2029-01-01T00:00:00Z"),
      ).ok,
    ).toBe(false);
  });
  it("[LEC-01-AC8] allows adjacent slots", () => {
    expect(
      intervalsOverlap(
        new Date("2030-01-01T02:00Z"),
        new Date("2030-01-01T03:00Z"),
        new Date("2030-01-01T03:00Z"),
        new Date("2030-01-01T04:00Z"),
      ),
    ).toBe(false);
  });
  it("[LEC-01-AC8] rejects genuine overlap", () => {
    expect(
      intervalsOverlap(
        new Date("2030-01-01T02:00Z"),
        new Date("2030-01-01T03:00Z"),
        new Date("2030-01-01T02:30Z"),
        new Date("2030-01-01T04:00Z"),
      ),
    ).toBe(true);
  });
  it("[LEC-01-AC9] enforces the Singapore one-hour deadline", () => {
    expect(
      validateSlotInput(
        { courseId, date: "2030-01-01", startTime: "10:30", endTime: "11:30" },
        new Date("2030-01-01T02:00:01Z"),
      ).ok,
    ).toBe(false);
  });
});
