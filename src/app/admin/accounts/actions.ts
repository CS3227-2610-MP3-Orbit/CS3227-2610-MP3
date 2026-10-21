"use server";

import { requireRole } from "@/lib/auth/session";
import { createAccount, resetPassword, setActive, setRole } from "@/features/admin/accounts/server";

// Every action re-checks requireRole("admin") here, even though each delegated server.ts
// function checks it again internally -- the same defense-in-depth pattern already used by
// src/app/student/bookings/actions.ts, so a direct call to either layer is refused on its own.

export async function createAccountAction(formData: FormData) {
  await requireRole("admin");
  return createAccount(formData);
}

export async function setRoleAction(input: unknown) {
  await requireRole("admin");
  return setRole(input);
}

export async function setActiveAction(input: unknown) {
  await requireRole("admin");
  return setActive(input);
}

export async function resetPasswordAction(input: unknown) {
  await requireRole("admin");
  return resetPassword(input);
}
