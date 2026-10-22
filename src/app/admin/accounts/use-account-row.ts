"use client";

import { useState, useTransition } from "react";

import { isAccountLocked } from "@/features/admin/accounts/presentation";
import type { Account } from "@/features/admin/accounts/validation";

import { resetPasswordAction, setActiveAction, setRoleAction } from "./actions";

export function describeMutateFailure(kind: string): string {
  switch (kind) {
    case "forbidden_self_change":
      return "You cannot change your own role or active status here.";
    case "forbidden_protected":
      return "The protected recovery administrator cannot be changed.";
    case "forbidden_zero_admins":
      return "That change would leave no active administrators and was refused.";
    case "forbidden_or_not_found":
      return "This account is no longer available.";
    case "validation_error":
      return "Please correct the highlighted value and try again.";
    default:
      return "This action is temporarily unavailable. Please retry.";
  }
}

export function describeResetFailure(kind: string): string {
  switch (kind) {
    case "forbidden_self_change":
      return "Use your own account's change-password page instead.";
    case "forbidden_protected":
      return "The protected recovery administrator's password cannot be reset here.";
    case "forbidden_or_not_found":
      return "This account is no longer available.";
    case "validation_error":
      return "Please correct the highlighted value and try again.";
    default:
      return "Password reset is temporarily unavailable. Please retry.";
  }
}

/**
 * ADM-01-AC17 (R5/R8) / SH-07-R14: the role/active/reset-password controller shared by the
 * table-row (>= md) and card (< md) presentations of one account, so both layouts drive the
 * exact same server actions and failure/success messages -- presentation-only duplication of
 * markup, not of behaviour.
 */
export function useAccountRowController(account: Account, currentUserId: string) {
  const isSelf = account.id === currentUserId;
  const locked = isAccountLocked(account, currentUserId);
  const [role, setRoleValue] = useState<Account["role"]>(account.role);
  const [isActive, setIsActive] = useState(account.isActive);
  const [message, setMessage] = useState("");
  const [credential, setCredential] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function applyRole() {
    setMessage("");
    startTransition(async () => {
      const result = await setRoleAction({ targetId: account.id, role });
      if (result.kind === "success") {
        setRoleValue(result.role);
        setMessage("Role updated.");
      } else {
        setRoleValue(account.role);
        setMessage(describeMutateFailure(result.kind));
      }
    });
  }

  function toggleActive() {
    setMessage("");
    startTransition(async () => {
      const result = await setActiveAction({ targetId: account.id, active: !isActive });
      if (result.kind === "success") {
        setIsActive(result.isActive);
        setMessage(result.isActive ? "Account activated." : "Account deactivated.");
      } else {
        setMessage(describeMutateFailure(result.kind));
      }
    });
  }

  function reset() {
    setMessage("");
    setCredential(null);
    startTransition(async () => {
      const result = await resetPasswordAction({ targetId: account.id });
      if (result.kind === "success") {
        setCredential(result.initialCredential);
      } else if (result.kind === "password_reset_sessions_not_revoked") {
        // ADM-01-R10: the password did change -- still show it -- but ending the target's
        // existing sessions could not be confirmed, so this is a distinct, honest message,
        // never the plain success copy.
        setCredential(result.initialCredential);
        setMessage(
          "Password changed, but the account's existing sessions could not be confirmed ended. " +
            "For a suspected compromise, deactivate the account as well.",
        );
      } else {
        setMessage(describeResetFailure(result.kind));
      }
    });
  }

  return {
    isSelf,
    locked,
    role,
    setRoleValue,
    isActive,
    message,
    credential,
    pending,
    applyRole,
    toggleActive,
    reset,
    setCredential,
  };
}
