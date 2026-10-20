import "server-only";

import { randomUUID } from "node:crypto";

import type { Role } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { generateInitialPassword } from "./password";
import {
  boundedInput,
  createAccountInputSchema,
  fieldSchema,
  listAccountsInputSchema,
  listResultSchema,
  resetPasswordInputSchema,
  setActiveInputSchema,
  setActiveResultSchema,
  setRoleInputSchema,
  setRoleResultSchema,
  type AccountField,
  type CreateResult,
  type ListResult,
  type ResetResult,
  type SetActiveResult,
  type SetRoleResult,
} from "./validation";

// Two distinct, narrowly-typed helpers rather than one boolean-flag function: each result
// schema only accepts whichever one or two of "temporarily_unavailable"/"outcome_unknown" it
// actually declares, and a shared union return type would not narrow at each call site.
function temporarilyUnavailable(): { kind: "temporarily_unavailable"; correlationId: string } {
  return { kind: "temporarily_unavailable", correlationId: randomUUID() };
}
function outcomeUnknown(): { kind: "outcome_unknown"; correlationId: string } {
  return { kind: "outcome_unknown", correlationId: randomUUID() };
}
function invalid(path?: PropertyKey): { kind: "validation_error"; field: AccountField } {
  const field = fieldSchema.safeParse(path);
  return { kind: "validation_error", field: field.success ? field.data : "request" };
}

/** ADM-01-R3/R4: delegates to the admin_set_role/admin_set_active RPCs under the caller's own
 * session, so every role/active change -- whether from setRole or from createAccount's own
 * role-set step -- is enforced the same way, by the same database rules (self, protected,
 * zero-admin), no matter which Server Action triggered it. */
async function callAdminSetRole(targetId: string, role: Role): Promise<SetRoleResult> {
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_set_role", { target_id: targetId, new_role: role })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && setRoleResultSchema.safeParse(data).success
      ? setRoleResultSchema.parse(data)
      : outcomeUnknown();
  } catch {
    return outcomeUnknown();
  }
}

/** ADM-01-R1: creates an account of any role. handle_new_user always inserts role 'student',
 * so a non-student request needs a second step (admin_set_role) under the caller's own admin
 * session before success can be reported. If that second step does not confirm success, the
 * just-created auth user is deleted (compensation) and the account is never reported as the
 * requested role -- see ADM-01's edge case for "auth.users insert succeeds but role-set fails". */
export async function createAccount(raw: unknown): Promise<CreateResult> {
  await requireRole("admin");
  const input = createAccountInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  const { email, fullName, role } = input.data;

  const admin = createAdminClient();
  const initialCredential = generateInitialPassword();
  let userId: string;
  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: initialCredential,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) {
      if (error.code === "email_exists") return { kind: "conflict", reason: "duplicate_email" };
      return temporarilyUnavailable();
    }
    if (!data.user?.id) return temporarilyUnavailable();
    userId = data.user.id;
  } catch {
    return temporarilyUnavailable();
  }

  if (role !== "student") {
    const roleResult = await callAdminSetRole(userId, role);
    if (roleResult.kind !== "success") {
      await admin.auth.admin.deleteUser(userId).catch(() => {});
      return { kind: "incomplete", correlationId: randomUUID() };
    }
  }

  return {
    kind: "success",
    account: { id: userId, email, fullName, role, isActive: true, isProtected: false },
    initialCredential,
  };
}

/** ADM-01-R2: list/search accounts via the admin_list_accounts RPC (see the migration for why
 * this is an RPC rather than the Auth Admin API's listUsers -- it has no search filter). */
export async function listAccounts(raw: unknown): Promise<ListResult> {
  await requireRole("admin");
  const input = listAccountsInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_list_accounts", {
        p_query: input.data.query ?? null,
        p_role: input.data.roleFilter ?? null,
        p_active: input.data.activeFilter ?? null,
      })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && listResultSchema.safeParse(data).success
      ? listResultSchema.parse(data)
      : temporarilyUnavailable();
  } catch {
    return temporarilyUnavailable();
  }
}

/** ADM-01-R3/R5/R7/R8: change another user's role. */
export async function setRole(raw: unknown): Promise<SetRoleResult> {
  await requireRole("admin");
  const input = setRoleInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  return callAdminSetRole(input.data.targetId, input.data.role);
}

/** ADM-01-R4/R5/R7/R8: activate or deactivate another user. */
export async function setActive(raw: unknown): Promise<SetActiveResult> {
  await requireRole("admin");
  const input = setActiveInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_set_active", { target_id: input.data.targetId, active: input.data.active })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && setActiveResultSchema.safeParse(data).success
      ? setActiveResultSchema.parse(data)
      : outcomeUnknown();
  } catch {
    return outcomeUnknown();
  }
}

/** ADM-01-R9: reset another user's password. Refuses the caller's own account (use SH-06's
 * own change-password page instead) and the protected recovery administrator, both checked
 * server-side from the target's own profile row before any write. */
export async function resetPassword(raw: unknown): Promise<ResetResult> {
  const actor = await requireRole("admin");
  const input = resetPasswordInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  const { targetId } = input.data;

  // Refused regardless of the target's actual state, before any lookup, exactly like
  // admin_set_role/admin_set_active's own self-check (ADM-01-R5).
  if (targetId === actor.id) return { kind: "forbidden_self_change" };

  try {
    const db = await createClient();
    const { data: target, error } = await db
      .from("profiles")
      .select("is_protected")
      .eq("id", targetId)
      .abortSignal(AbortSignal.timeout(10000))
      .maybeSingle();
    if (error) return temporarilyUnavailable();
    if (!target) return { kind: "forbidden_or_not_found" };
    if (target.is_protected) return { kind: "forbidden_protected" };
  } catch {
    return temporarilyUnavailable();
  }

  try {
    const password = generateInitialPassword();
    const { error } = await createAdminClient().auth.admin.updateUserById(targetId, { password });
    if (error) return outcomeUnknown();
    return { kind: "success", initialCredential: password };
  } catch {
    return outcomeUnknown();
  }
}
