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
  it("accepts the allowlisted fields", () =>
    expect(
      consultationResultSchema.safeParse({ kind: "success", consultations: [base] }).success,
    ).toBe(true));
  it("rejects private/unapproved fields", () =>
    expect(
      consultationResultSchema.safeParse({
        kind: "success",
        consultations: [{ ...base, password: "secret" }],
      }).success,
    ).toBe(false));
});
