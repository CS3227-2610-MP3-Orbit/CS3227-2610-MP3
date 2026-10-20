/** Shared daily AI capacity, counted by trusted database time in Asia/Singapore. */
export interface UsageCounts {
  globalLastDay: number;
}

export interface QuotaLimits {
  /** Shared by all users, because the whole app runs on one team API key. */
  globalPerDay: number;
}

export type QuotaDecision =
  { allowed: true } | { allowed: false; reason: "global_day"; retryAfterSeconds: number };

export const DEFAULT_LIMITS: QuotaLimits = { globalPerDay: 100 };

/**
 * Pure policy mirror for unit tests. Database RPC enforcement remains authoritative.
 * There is deliberately no minute or per-user daily quota.
 */
export function decideQuota(counts: UsageCounts, limits: QuotaLimits): QuotaDecision {
  if (counts.globalLastDay >= limits.globalPerDay)
    return { allowed: false, reason: "global_day", retryAfterSeconds: 60 };
  return { allowed: true };
}
