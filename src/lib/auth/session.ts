import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { homePathFor, isRole, type Role } from "./roles";

export interface CurrentUser {
  id: string;
  fullName: string;
  role: Role;
}

/** The signed-in, active user with their role, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", userId)
    .single();

  if (!profile || !profile.is_active || !isRole(profile.role)) return null;
  return { id: userId, fullName: profile.full_name, role: profile.role };
}

/**
 * Ends the request unless the signed-in user has the given role.
 * Call this in every role layout AND every Server Action / Route Handler:
 * layouts do not protect actions.
 */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(homePathFor(user.role));
  return user;
}

/**
 * Ends the request unless the caller is a signed-in, active user of ANY role.
 * For actions that are legitimately role-agnostic (e.g. changing one's own password).
 * Call this in every such layout AND every Server Action / Route Handler:
 * layouts do not protect actions.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
