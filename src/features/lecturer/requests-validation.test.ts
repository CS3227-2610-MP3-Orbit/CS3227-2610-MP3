import { describe, expect, it } from "vitest";
import { decisionInputSchema, decisionResultSchema, listResultSchema } from "./requests-validation";

const valid = {
  bookingId: "00000000-0000-4000-8000-000000000001",
  decision: "rejected" as const,
  reason: "Lecturer unavailable",
  version: "00000000-0000-4000-8000-000000000002",
  operationKey: "00000000-0000-4000-8000-000000000003",
};

describe("LEC-02 request decisions", () => {
  it("[LEC-02-AC1] [LEC-02-AC2] [LEC-02-AC15] accepts a safe empty request list and unavailable result", () => {
    expect(listResultSchema.safeParse({ kind: "success", requests: [] }).success).toBe(true);
    expect(
      listResultSchema.safeParse({
        kind: "temporarily_unavailable",
        correlationId: valid.operationKey,
      }).success,
    ).toBe(true);
  });

  it("[LEC-02-AC3] accepts a controlled rejection reason", () => {
    expect(decisionInputSchema.safeParse(valid).success).toBe(true);
  });

  it("[LEC-02-AC4] [LEC-02-AC5] [LEC-02-AC6] [LEC-02-AC8] [LEC-02-AC9] [LEC-02-AC10] [LEC-02-AC11] accepts only safe decision receipts", () => {
    expect(
      decisionResultSchema.safeParse({
        kind: "success",
        bookingId: valid.bookingId,
        status: "approved",
        notificationPending: false,
      }).success,
    ).toBe(true);
    expect(
      decisionResultSchema.safeParse({
        kind: "conflict",
        reason: "request_changed",
      }).success,
    ).toBe(true);
    expect(
      decisionResultSchema.safeParse({
        kind: "temporarily_unavailable",
        correlationId: valid.operationKey,
      }).success,
    ).toBe(true);
    expect(
      decisionResultSchema.safeParse({
        kind: "success",
        bookingId: valid.bookingId,
        status: "approved",
        notificationPending: false,
        error: "private database detail",
      }).success,
    ).toBe(false);
  });

  it("[LEC-02-AC7] [LEC-02-AC12] [LEC-02-AC14] rejects malformed or unsafe decision input", () => {
    expect(decisionInputSchema.safeParse({ ...valid, reason: "x".repeat(201) }).success).toBe(
      false,
    );
    expect(decisionInputSchema.safeParse({ ...valid, reason: "" }).success).toBe(true);
    expect(decisionInputSchema.safeParse({ ...valid, bookingId: "not-a-uuid" }).success).toBe(
      false,
    );
    expect(decisionInputSchema.safeParse({ ...valid, decision: "completed" }).success).toBe(false);
    expect(decisionInputSchema.safeParse({ ...valid, operationKey: undefined }).success).toBe(
      false,
    );
  });

  it("[LEC-02-AC13] preserves request text as input data", () => {
    const result = decisionInputSchema.safeParse({ ...valid, reason: "<script>alert(1)</script>" });
    expect(result.success && result.data.reason).toBe("<script>alert(1)</script>");
  });

  it("[LEC-02-AC13] [LEC-02-AC16] [LEC-02-AC17] accepts only the two non-AI decisions and preserves text", () => {
    const hostileReason = "<script>alert(1)</script>";
    expect(
      decisionInputSchema.safeParse({ ...valid, decision: "approved", reason: "" }).success,
    ).toBe(true);
    const parsed = decisionInputSchema.safeParse({ ...valid, reason: hostileReason });
    expect(parsed.success && parsed.data.reason).toBe(hostileReason);
    expect(decisionInputSchema.safeParse({ ...valid, decision: "completed" }).success).toBe(false);
  });
});
