import "server-only";
import { randomUUID } from "node:crypto";

import { createClient as createPublicClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

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
 * Changes the signed-in caller's own password. SH-06-R5: requireUser() runs first so any
 * active user of any role, including the protected admin, may reach this — never a single
 * requireRole(role). Never accepts a target user id; the caller is always the session's own
 * user, taken from the verified session, never from form input (SH-06-R2).
 */
export async function changeOwnPassword(raw: unknown): Promise<ChangePasswordResult> {
  await requireUser();

  const input = changePasswordInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);

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
    if (verifyError || !verified.session)
      return { kind: "conflict", reason: "wrong_current_password" };
    // scope: "local" is required here. signOut()'s default scope is "global", which would
    // revoke every session for this user -- including the caller's real, cookie-scoped
    // session below -- not just this throwaway verification sign-in.
    await verifier.auth.signOut({ scope: "local" });

    const { error: updateError } = await supabase.auth.updateUser({
      password: input.data.newPassword,
    });
    if (updateError) return unavailable();
    return { kind: "success" };
  } catch {
    // Never surface a raw Supabase/network error (may embed request details); stay generic.
    return unavailable();
  }
}
