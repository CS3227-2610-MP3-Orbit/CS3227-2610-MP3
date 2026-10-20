// Real local Supabase Auth integration for SH-06. Mirrors, with direct supabase-js calls,
// exactly the sequence src/features/account/server.ts performs: a non-persisting throwaway
// client verifies the current password via signInWithPassword, then the caller's own
// session calls auth.updateUser({password}). This exercises the live GoTrue server and the
// real `profiles` table/RLS; it does not re-exercise Next.js's cookies()-to-@supabase/ssr
// wiring, which is shared, generic session plumbing already covered by tests/e2e/auth.spec.ts
// and this task's tests/e2e/change-password.spec.ts (a real browser against a real dev server).
//
// Uses freshly created, disposable fixture users (deleted in afterEach); no seed account is
// ever touched. See tests/integration/README.md for required environment variables.
import { afterEach, describe, expect, it } from "vitest";

import { ATTEMPT_WINDOW_MS, decidePasswordAttemptLimit } from "@/features/account/rate-limit";

import {
  adminClient,
  createFixtureUser,
  deleteFixtureUser,
  FIXTURE_PASSWORD,
  publicClient,
  sessionClient,
} from "./sh06-test-helpers.mjs";

let createdIds: string[] = [];

afterEach(async () => {
  await Promise.all(createdIds.map((id) => deleteFixtureUser(id)));
  createdIds = [];
});

async function fixture(role?: string) {
  const user = await createFixtureUser(role);
  createdIds.push(user.id);
  return user;
}

/** The exact verification step changeOwnPassword() performs: a throwaway, non-persisting sign-in. */
async function verifyCurrentPassword(email: string, password: string) {
  const verifier = publicClient();
  const { data, error } = await verifier.auth.signInWithPassword({ email, password });
  // "local" only -- the default "global" scope would revoke the caller's real session too.
  if (!error) await verifier.auth.signOut({ scope: "local" });
  return { ok: !error && !!data.session, error };
}

// --- SH-06-R7 claim-then-count against the real password_change_attempts table/RLS, using
// the real decision function (decidePasswordAttemptLimit) that src/features/account/server.ts
// is unit-tested against -- this exercises the live DB artifact and the real pure rule
// together, exactly as changeOwnPassword() wires them, without going through requireUser()'s
// Next.js cookies()-bound request context (already covered by the e2e test's real HTTP
// requests, as noted in this file's header).

async function claimAttempt(userId: string): Promise<number> {
  const { data, error } = await adminClient()
    .from("password_change_attempts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error || !data) throw new Error("SH-06 test: failed to claim an attempt row");
  return data.id as number;
}

async function countAttemptsInWindow(userId: string) {
  const windowStart = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString();
  const { data, error } = await adminClient()
    .from("password_change_attempts")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true });
  if (error || !data || data.length === 0)
    throw new Error("SH-06 test: failed to count the attempt window");
  return { count: data.length, oldestCreatedAt: new Date(data[0].created_at as string) };
}

async function clearAttempt(id: number): Promise<void> {
  await adminClient().from("password_change_attempts").delete().eq("id", id);
}

/** One full SH-06-R7 attempt: claim, count, decide, then verify only if allowed. */
async function attemptPasswordChange(user: { id: string; email: string }, password: string) {
  const claimId = await claimAttempt(user.id);
  const window = await countAttemptsInWindow(user.id);
  const decision = decidePasswordAttemptLimit(window.count, window.oldestCreatedAt);
  if (!decision.allowed) {
    await clearAttempt(claimId);
    return { outcome: "rate_limited" as const, retryAfterSeconds: decision.retryAfterSeconds };
  }
  const verification = await verifyCurrentPassword(user.email, password);
  if (!verification.ok) return { outcome: "wrong_password" as const };
  await clearAttempt(claimId);
  return { outcome: "verified" as const };
}

describe("SH-06 real local Supabase Auth integration", () => {
  it.each(["student", "lecturer", "admin"])(
    "[SH-06-AC1] a signed-in %s with the correct current password can change it and stays signed in",
    async (role) => {
      const user = await fixture(role);
      const newPassword = `Sh06-New-${crypto.randomUUID()}`;

      const session = sessionClient();
      const { data: signedIn, error: signInError } = await session.auth.signInWithPassword({
        email: user.email,
        password: FIXTURE_PASSWORD,
      });
      expect(signInError).toBeNull();
      expect(signedIn.session).not.toBeNull();

      const verification = await verifyCurrentPassword(user.email, FIXTURE_PASSWORD);
      expect(verification.ok).toBe(true);

      const { error: updateError } = await session.auth.updateUser({ password: newPassword });
      expect(updateError).toBeNull();

      // Stays signed in on the same session: the original access token still resolves a user.
      const { data: still, error: stillError } = await session.auth.getUser();
      expect(stillError).toBeNull();
      expect(still.user?.id).toBe(user.id);
    },
  );

  it("[SH-06-AC2] wrong current password fails verification and leaves the real password unchanged", async () => {
    const user = await fixture();

    const verification = await verifyCurrentPassword(user.email, "definitely-the-wrong-password");
    expect(verification.ok).toBe(false);
    expect(verification.error).toBeTruthy();

    // Mirrors the server: verification failure means updateUser is never called. Confirm the
    // original password still works, proving nothing changed.
    const recheck = publicClient();
    const { data, error } = await recheck.auth.signInWithPassword({
      email: user.email,
      password: FIXTURE_PASSWORD,
    });
    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
  });

  it("[SH-06-AC7] a live wrong-password error never echoes the submitted password", async () => {
    const user = await fixture();
    const submitted = "Sh06-Should-Never-Leak-7788!";
    const verification = await verifyCurrentPassword(user.email, submitted);
    expect(verification.ok).toBe(false);
    expect(JSON.stringify(verification.error)).not.toContain(submitted);
  });

  it("[SH-06-AC6] after a successful change, the next sign-in rejects the old password and accepts the new one", async () => {
    const user = await fixture();
    const newPassword = `Sh06-Rotated-${crypto.randomUUID()}`;

    const session = sessionClient();
    await session.auth.signInWithPassword({ email: user.email, password: FIXTURE_PASSWORD });
    const { error: updateError } = await session.auth.updateUser({ password: newPassword });
    expect(updateError).toBeNull();

    const oldAttempt = publicClient();
    const { error: oldError, data: oldData } = await oldAttempt.auth.signInWithPassword({
      email: user.email,
      password: FIXTURE_PASSWORD,
    });
    expect(oldError).toBeTruthy();
    expect(oldData.session).toBeNull();

    const newAttempt = publicClient();
    const { error: newError, data: newData } = await newAttempt.auth.signInWithPassword({
      email: user.email,
      password: newPassword,
    });
    expect(newError).toBeNull();
    expect(newData.session).not.toBeNull();
  });

  it("[SH-06-AC5] a deactivated profile is observably inactive in the real database, via the user's own token", async () => {
    const user = await fixture();
    const { error: deactivateError } = await adminClient()
      .from("profiles")
      .update({ is_active: false })
      .eq("id", user.id);
    expect(deactivateError).toBeNull();

    // GoTrue itself does not know about the app's own is_active flag, so sign-in still
    // succeeds at the Auth layer -- which is exactly why the app re-checks the real `profiles`
    // row (what getCurrentUser()/requireUser() rely on) rather than trusting the token alone.
    const session = sessionClient();
    const { data: signedIn, error: signInError } = await session.auth.signInWithPassword({
      email: user.email,
      password: FIXTURE_PASSWORD,
    });
    expect(signInError).toBeNull();
    expect(signedIn.session).not.toBeNull();

    const { data: profile, error: profileError } = await session
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .single();
    expect(profileError).toBeNull();
    expect(profile?.is_active).toBe(false);
  });

  it("[SH-06-AC5] the real Auth server refuses an unauthenticated updateUser call outright", async () => {
    const anonymous = publicClient();
    const { error } = await anonymous.auth.updateUser({ password: "irrelevant-no-session-123456" });
    expect(error).toBeTruthy();
  });

  it("[SH-06-AC8] after a password change via session 1, session 2's refresh token stops working while session 1 still works", async () => {
    const user = await fixture();
    const session1 = sessionClient();
    const session2 = sessionClient();

    const { error: signIn1Error } = await session1.auth.signInWithPassword({
      email: user.email,
      password: FIXTURE_PASSWORD,
    });
    expect(signIn1Error).toBeNull();
    const { error: signIn2Error, data: signIn2 } = await session2.auth.signInWithPassword({
      email: user.email,
      password: FIXTURE_PASSWORD,
    });
    expect(signIn2Error).toBeNull();
    const session2RefreshToken = signIn2.session?.refresh_token;
    expect(session2RefreshToken).toBeTruthy();

    // The real verify-then-update sequence, via session 1's own client.
    const verification = await verifyCurrentPassword(user.email, FIXTURE_PASSWORD);
    expect(verification.ok).toBe(true);
    const newPassword = `Sh06-R6-${crypto.randomUUID()}`;
    const { error: updateError } = await session1.auth.updateUser({ password: newPassword });
    expect(updateError).toBeNull();

    // SH-06-R6: end every OTHER session via the caller's (session 1's) own cookie-bound client.
    const { error: signOutOthersError } = await session1.auth.signOut({ scope: "others" });
    expect(signOutOthersError).toBeNull();

    // Session 2's refresh token no longer works.
    const refreshed2 = await session2.auth.refreshSession({
      refresh_token: session2RefreshToken!,
    });
    expect(refreshed2.error).toBeTruthy();

    // Session 1 still works: it stayed signed in through the whole sequence.
    const { data: still, error: stillError } = await session1.auth.getUser();
    expect(stillError).toBeNull();
    expect(still.user?.id).toBe(user.id);
  });

  it("[SH-06-AC10] 5 wrong current-password attempts, then a 6th attempt with the CORRECT password, all within 15 minutes, still refused as rate_limited", async () => {
    const user = await fixture();

    for (let i = 0; i < 5; i += 1) {
      const attempt = await attemptPasswordChange(user, "definitely-the-wrong-password");
      expect(attempt.outcome).toBe("wrong_password");
    }

    const sixth = await attemptPasswordChange(user, FIXTURE_PASSWORD);
    expect(sixth.outcome).toBe("rate_limited");
    if (sixth.outcome === "rate_limited") expect(sixth.retryAfterSeconds).toBeGreaterThan(0);

    // Proves this was the app-level rate limit, not an actually-wrong password: Supabase
    // Auth itself still accepts the correct password outside this limiter's accounting.
    const direct = await verifyCurrentPassword(user.email, FIXTURE_PASSWORD);
    expect(direct.ok).toBe(true);
  });

  it("[SH-06-AC11] a successful verification's cleared attempt row does not block a later legitimate change", async () => {
    const user = await fixture();

    // 3 wrong attempts recorded and kept (count toward the window).
    for (let i = 0; i < 3; i += 1) {
      const attempt = await attemptPasswordChange(user, "definitely-the-wrong-password");
      expect(attempt.outcome).toBe("wrong_password");
    }

    // A successful verification: allowed (count = 4, including its own claim), and its own
    // row is cleared afterward -- it must not add a 4th permanent entry to the window.
    const success = await attemptPasswordChange(user, FIXTURE_PASSWORD);
    expect(success.outcome).toBe("verified");

    // A later legitimate attempt is still allowed: only the 3 original failures remain
    // (count = 4, including this attempt's own claim), still at/under the limit.
    const later = await attemptPasswordChange(user, FIXTURE_PASSWORD);
    expect(later.outcome).toBe("verified");
  });
});
