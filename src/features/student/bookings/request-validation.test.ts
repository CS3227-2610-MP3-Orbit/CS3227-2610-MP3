import { describe, expect, it } from "vitest";
import { boundedInput, requestInputSchema, slotSchema } from "./request-validation";

const input = {
  slotId: "11111111-1111-4111-8111-111111111111",
  slotVersion: "version",
  idempotencyKey: "22222222-2222-4222-8222-222222222222",
  topic: " SQL joins ",
  questions: " Why? ",
};
describe("request input normalization", () => {
  it("[STU-02-AC19] accepts UTC-Z slot timestamps and rejects offset alternatives", () => {
    const slot = {
      slotId: input.slotId,
      courseId: input.slotId,
      courseCode: "CS3227",
      courseName: "Security",
      lecturerId: input.idempotencyKey,
      lecturerName: "Lecturer",
      slotVersion: "version",
      startsAt: "2098-01-01T01:00:00.000000Z",
      endsAt: "2098-01-01T02:00:00.000000Z",
    };
    expect(slotSchema.safeParse(slot).success).toBe(true);
    expect(slotSchema.safeParse({ ...slot, startsAt: "2098-01-01T01:00:00+00:00" }).success).toBe(
      false,
    );
    expect(slotSchema.safeParse({ ...slot, endsAt: "2098-01-01T10:00:00+08:00" }).success).toBe(
      false,
    );
  });
  it("[STU-02-AC4] trims ECMAScript whitespace without changing interior text", () => {
    expect(requestInputSchema.parse({ ...input, topic: "\uFEFF\u2000a\n b\u00a0" }).topic).toBe(
      "a\n b",
    );
  });
  it("[STU-02-AC4] counts Unicode code points and rejects malformed Unicode and NUL", () => {
    expect(requestInputSchema.safeParse({ ...input, topic: "😀".repeat(200) }).success).toBe(true);
    expect(requestInputSchema.safeParse({ ...input, topic: "😀".repeat(201) }).success).toBe(false);
    for (const topic of ["\ud800", "\udc00", "x\0y", "   "])
      expect(requestInputSchema.safeParse({ ...input, topic }).success).toBe(false);
  });
  it("[STU-02-AC9] refuses injected ownership and duplicate form values", () => {
    expect(requestInputSchema.safeParse({ ...input, studentId: input.slotId }).success).toBe(false);
    const form = new FormData();
    form.append("topic", "first");
    form.append("topic", "second");
    expect(boundedInput(form)).toBe(null);
  });
  it("[STU-02-AC16] bounds decoded input before normalization", () => {
    expect(boundedInput({ ...input, topic: " ".repeat(16384) })).toBe(null);
  });
});
