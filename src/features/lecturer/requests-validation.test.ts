import { describe, expect, it } from "vitest";
import { decisionInputSchema } from "./requests-validation";

const valid = {
  bookingId: "00000000-0000-4000-8000-000000000001",
  decision: "rejected" as const,
  reason: "Lecturer unavailable",
  version: "00000000-0000-4000-8000-000000000002",
  operationKey: "00000000-0000-4000-8000-000000000003",
};

describe("LEC-02 request decisions", () => {
  it("[LEC-02-AC3] accepts a controlled rejection reason", () => {
    expect(decisionInputSchema.safeParse(valid).success).toBe(true);
  });

  it("[LEC-02-AC12] rejects oversized or missing rejection reasons", () => {
    expect(decisionInputSchema.safeParse({ ...valid, reason: "x".repeat(201) }).success).toBe(
      false,
    );
    expect(decisionInputSchema.safeParse({ ...valid, reason: "" }).success).toBe(true);
  });

  it("[LEC-02-AC13] preserves request text as input data", () => {
    const result = decisionInputSchema.safeParse({ ...valid, reason: "<script>alert(1)</script>" });
    expect(result.success && result.data.reason).toBe("<script>alert(1)</script>");
  });

  it("[LEC-02-AC17] accepts only the two non-AI decisions", () => {
    expect(
      decisionInputSchema.safeParse({ ...valid, decision: "approved", reason: "" }).success,
    ).toBe(true);
    expect(decisionInputSchema.safeParse({ ...valid, decision: "completed" }).success).toBe(false);
  });
});
