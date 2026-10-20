/** How many SoC LLM calls were made recently. Counted by the server from the ai_usage table. */
export interface UsageCounts {
  userLastMinute: number;
  userLastDay: number;
  globalLastMinute: number;
}

export interface QuotaLimits {
  perUserPerMinute: number;
  perUserPerDay: number;
  /** Shared by all users, because the whole app runs on one team API key. */
  globalPerMinute: number;
}

export type QuotaDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "user_minute" | "user_day" | "global_minute";
      retryAfterSeconds: number;
    };

// Placeholder values. Replace with limits derived from the SoC LLM documentation
// (only readable on the NUS network) and record where they came from in the spec.
export const DEFAULT_LIMITS: QuotaLimits = {
  perUserPerMinute: 3,
  perUserPerDay: 30,
  globalPerMinute: 20,
};

/**
 * Decides whether one more AI call is allowed.
 * Pure function: no I/O, so every rule can be unit-tested.
 */
export function decideQuota(counts: UsageCounts, limits: QuotaLimits): QuotaDecision {
  if (counts.userLastMinute >= limits.perUserPerMinute)
    return { allowed: false, reason: "user_minute", retryAfterSeconds: 60 };
  if (counts.userLastDay >= limits.perUserPerDay)
    return { allowed: false, reason: "user_day", retryAfterSeconds: 86_400 };
  if (counts.globalLastMinute >= limits.globalPerMinute)
    return { allowed: false, reason: "global_minute", retryAfterSeconds: 60 };
  return { allowed: true };
}
