import "server-only";
import { randomUUID } from "node:crypto";

import { createClient as createPublicClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { ATTEMPT_WINDOW_MS, decidePasswordAttemptLimit } from "./rate-limit";
import {
  boundedInput,
  changePasswordInputSchema,
  fieldSchema,
  type ChangePasswordField,
  type ChangePasswordResult,
} from "./validation";

function unavailable(): { kind: "temporarily_unavailable"; correlationId: string } {
  return { kind: "temporarily_unavailable", correlationId: randomUUID() };
}
function invalid(path?: PropertyKey): { kind: "validation_error"; field: ChangePasswordField } {
  const field = fieldSchema.safeParse(path);
  return { kind: "validation_error", field: field.success ? field.data : "request" };
}

/**
 * Records one verification attempt for `userId` (SH-06-R7's claim-then-count protocol: the
 * row is inserted BEFORE verification runs, so two concurrent attempts always see each
 * other). Returns the new row's id, or null if it could not even be recorded.
 */
async function claimPasswordAttempt(userId: string): Promise<number | null> {
  const { data: row, error } = await createAdminClient()
    .from("password_change_attempts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  return error || !row ? null : (row.id as number);
}

/**
 * Counts `userId`'s attempt rows (including the just-claimed one) within the trailing
 * ATTEMPT_WINDOW_MS, and the earliest of their timestamps. Returns null if the query itself
 * errors, so the caller can fail closed rather than guess at a count.
 */
async function countAttemptsInWindow(
  userId: string,
): Promise<{ count: number; oldestCreatedAt: Date } | null> {
  const windowStart = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString();
  const { data, error } = await createAdminClient()
    .from("password_change_attempts")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true });
  if (error || !data || data.length === 0) return null;
  return { count: data.length, oldestCreatedAt: new Date(data[0].created_at as string) };
}

/** Removes a cleared attempt row: only a successfully verified attempt calls this. */
async function clearPasswordAttempt(id: number): Promise<void> {
  await createAdminClient().from("password_change_attempts").delete().eq("id", id);
}

/**
 * Changes the signed-in caller's own password. SH-06-R5: requireUser() runs first so any
 * active user of any role, including the protected admin, may reach this — never a single
 * requireRole(role). Never accepts a target user id; the caller is always the session's own
 * user, taken from the verified session, never from form input (SH-06-R2).
 */
export async function changeOwnPassword(raw: unknown): Promise<ChangePasswordResult> {
  const user = await requireUser();

  const input = changePasswordInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);

  // SH-06-R7 claim-then-count: record this attempt BEFORE verifying, so two simultaneous
  // attempts always see each other (at worst both are refused), then count this user's rows
  // in the trailing window. Fail closed -- never verify -- if either step cannot be trusted.
  const claimId = await claimPasswordAttempt(user.id);
  if (claimId === null) return unavailable();

  const window = await countAttemptsInWindow(user.id);
  if (!window) return unavailable();

  const decision = decidePasswordAttemptLimit(window.count, window.oldestCreatedAt);
  if (!decision.allowed) {
    await clearPasswordAttempt(claimId);
    return { kind: "rate_limited", retryAfterSeconds: decision.retryAfterSeconds };
  }

  try {
    const supabase = await createClient();
    // The caller's email, from the verified session only -- never from the submitted form.
    const { data: claims } = await supabase.auth.getClaims();
    const email = claims?.claims?.email;
    if (typeof email !== "string" || email === "") return unavailable();

    // A throwaway client verifies the current password via a real sign-in attempt. It never
    // persists a session or touches the caller's cookies (SH-06-R2).
    const verifier = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({
      email,
      password: input.data.currentPassword,
    });
    // Wrong current password gets one generic refusal; no account enumeration, no raw error.
    // The claimed attempt row is kept -- only a successful verification clears it (SH-06-R7).
    if (verifyError || !verified.session)
      return { kind: "conflict", reason: "wrong_current_password" };
    // scope: "local" is required here. signOut()'s default scope is "global", which would
    // revoke every session for this user -- including the caller's real, cookie-scoped
    // session below -- not just this throwaway verification sign-in.
    await verifier.auth.signOut({ scope: "local" });
    // Verification succeeded: this attempt no longer counts toward the SH-06-R7 limit.
    await clearPasswordAttempt(claimId);

    const { error: updateError } = await supabase.auth.updateUser({
      password: input.data.newPassword,
    });
    if (updateError) return unavailable();

    // SH-06-R6: end every OTHER session of this user; the current (calling) session stays
    // signed in. Stay honest if the best-effort sign-out itself fails, rather than claim
    // other devices were signed out when that could not be confirmed.
    const { error: signOutOthersError } = await supabase.auth.signOut({ scope: "others" });
    return { kind: "success", otherSessionsEnded: !signOutOthersError };
  } catch {
    // Never surface a raw Supabase/network error (may embed request details); stay generic.
    return unavailable();
  }
}
