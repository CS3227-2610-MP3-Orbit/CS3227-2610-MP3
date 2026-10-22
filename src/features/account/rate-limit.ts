// SH-06-R7: pure decision logic for the wrong-current-password rate limit, kept separate from
// any I/O (the database claim-then-count protocol lives in ./server.ts) so the rule itself is
// unit-testable without mocking Supabase. Mirrors the shape of src/lib/ai/quota.ts's
// decideQuota: counts and limits in, a decision out, no side effects.

/** At most this many attempts (including the just-claimed one) per user per rolling window. */
export const MAX_ATTEMPTS_PER_WINDOW = 5;

/** The rolling window SH-06-R7 counts attempts over. */
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export type AttemptLimitDecision =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Decides whether a password-change attempt may proceed to verification.
 *
 * `countInWindow` is this user's number of attempt rows within the trailing
 * ATTEMPT_WINDOW_MS, INCLUDING the row just claimed for the current attempt (the
 * claim-then-count protocol inserts that row before this decision runs, so two concurrent
 * attempts always see each other -- at worst both are refused). `oldestCreatedAt` is the
 * earliest `created_at` among those counted rows: once it ages out of the window the count
 * drops by one, which is what `retryAfterSeconds` counts down to.
 */
export function decidePasswordAttemptLimit(
  countInWindow: number,
  oldestCreatedAt: Date,
  now: Date = new Date(),
): AttemptLimitDecision {
  if (countInWindow <= MAX_ATTEMPTS_PER_WINDOW) return { allowed: true };

  const retryAfterMs = oldestCreatedAt.getTime() + ATTEMPT_WINDOW_MS - now.getTime();
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
}
