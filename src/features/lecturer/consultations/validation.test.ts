import { describe, expect, it } from "vitest";
import { consultationResultSchema } from "./validation";

const base = {
  bookingId: "11111111-1111-4111-8111-111111111111",
  slotId: "22222222-2222-4222-8222-222222222222",
  lecturerId: "33333333-3333-4333-8333-333333333333",
  lecturerName: "Lee",
  courseCode: "CS3227",
  courseName: "SE",
  startsAt: "2026-10-20T01:00:00Z",
  endsAt: "2026-10-20T02:00:00Z",
  studentName: "Student",
  studentEmail: "student@example.test",
  topic: "Topic",
  questions: "Question",
  bookingStatus: "approved",
  rejectionReason: null,
  displayStatus: "ongoing",
} as const;

describe("LEC-03 consultation projection", () => {
  it("[LEC-03-AC1] [LEC-03-AC2] [LEC-03-AC3] [LEC-03-AC4] [LEC-03-AC5] [LEC-03-AC6] [LEC-03-AC7] [LEC-03-AC8] [LEC-03-AC9] [LEC-03-AC10] [LEC-03-AC11] [LEC-03-AC12] [LEC-03-AC13] [LEC-03-AC14] [LEC-03-AC15] [LEC-03-AC16] accepts the allowlisted consultation projection and lifecycle statuses", () =>
    expect(
      consultationResultSchema.safeParse({ kind: "success", consultations: [base] }).success,
    ).toBe(true));
  it("[LEC-03-AC3] [LEC-03-AC12] [LEC-03-AC13] rejects private or unapproved fields", () =>
    expect(
      consultationResultSchema.safeParse({
        kind: "success",
        consultations: [{ ...base, password: "secret" }],
      }).success,
    ).toBe(false));
});
