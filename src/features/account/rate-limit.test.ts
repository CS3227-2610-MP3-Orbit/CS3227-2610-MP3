import { describe, expect, it } from "vitest";

import {
  ATTEMPT_WINDOW_MS,
  decidePasswordAttemptLimit,
  MAX_ATTEMPTS_PER_WINDOW,
} from "./rate-limit";

const now = new Date("2026-10-20T12:00:00.000Z");

describe("decidePasswordAttemptLimit (SH-06-R7)", () => {
  it("[SH-06-AC9] allows an attempt when the window count is at or below the limit", () => {
    for (let count = 1; count <= MAX_ATTEMPTS_PER_WINDOW; count += 1) {
      const oldest = new Date(now.getTime() - 60_000);
      expect(decidePasswordAttemptLimit(count, oldest, now)).toEqual({ allowed: true });
    }
  });

  it("[SH-06-AC9] given 5 recorded failures, the 6th attempt (count = 6, including its own claim) is refused with a retry-after time", () => {
    const oldest = new Date(now.getTime() - 5 * 60_000); // oldest counted row is 5 minutes old
    const decision = decidePasswordAttemptLimit(6, oldest, now);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      // 15-minute window minus the 5 minutes already elapsed = 10 minutes left.
      expect(decision.retryAfterSeconds).toBe(10 * 60);
    }
  });

  it("[SH-06-AC9] the retry-after counts down to exactly when the oldest counted row leaves the window", () => {
    const oldest = new Date(now.getTime() - ATTEMPT_WINDOW_MS + 30_000); // 30s left in its window
    const decision = decidePasswordAttemptLimit(10, oldest, now);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.retryAfterSeconds).toBe(30);
  });

  it("[SH-06-AC9] never returns a zero or negative retry-after, even if the oldest row's expiry already passed", () => {
    const oldest = new Date(now.getTime() - ATTEMPT_WINDOW_MS - 10_000); // already expired
    const decision = decidePasswordAttemptLimit(6, oldest, now);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("rounds a fractional number of seconds up, so the caller never undershoots the real wait", () => {
    const oldest = new Date(now.getTime() - ATTEMPT_WINDOW_MS + 1_500); // 1.5s left
    const decision = decidePasswordAttemptLimit(6, oldest, now);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.retryAfterSeconds).toBe(2);
  });
});
