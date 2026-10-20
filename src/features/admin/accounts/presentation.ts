import type { Account } from "./validation";

/**
 * ADM-01-AC17 (R5/R8): whether the accounts list should hide/disable the role, deactivate and
 * reset-password controls for this row -- true for the caller's own row and for the protected
 * recovery administrator's row. Presentation-only: every server action refuses these changes
 * the same way whether or not the UI ever renders the controls (see server.ts/the RPCs).
 */
export function isAccountLocked(
  account: Pick<Account, "id" | "isProtected">,
  currentUserId: string,
): boolean {
  return account.id === currentUserId || account.isProtected;
}
