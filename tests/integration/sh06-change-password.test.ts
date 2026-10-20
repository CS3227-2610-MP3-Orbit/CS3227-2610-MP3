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
});
