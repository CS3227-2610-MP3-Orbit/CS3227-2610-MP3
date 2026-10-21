"use client";

import { useState, useTransition } from "react";

import { isAccountLocked } from "@/features/admin/accounts/presentation";
import type { Account } from "@/features/admin/accounts/validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { resetPasswordAction, setActiveAction, setRoleAction } from "./actions";
import OneTimePasswordPanel from "./one-time-password-panel";

const ROLE_LABEL = { student: "Student", lecturer: "Lecturer", admin: "Administrator" } as const;
const selectClass =
  "mt-1 h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function describeMutateFailure(kind: string): string {
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

function describeResetFailure(kind: string): string {
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

/** ADM-01-AC17/R5/R8: a protected or the caller's own row shows no role/deactivate/reset-password
 * controls (just a badge and explanation), enforced here only for presentation -- the server
 * actions refuse these the same way whether or not this component ever renders the controls. */
export default function AccountRow({
  account,
  currentUserId,
}: {
  account: Account;
  currentUserId: string;
}) {
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

  return (
    <li className="min-w-0 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-semibold">{account.email}</p>
          <p className="break-words text-sm text-muted-foreground">
            {account.fullName || "(no name)"}
          </p>
        </div>
        {account.isProtected && <Badge variant="outline">Protected</Badge>}
      </div>

      <dl className="mt-2 grid gap-1 text-sm">
        <div>
          <dt className="inline font-medium">Role: </dt>
          <dd className="inline">{ROLE_LABEL[role]}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Status: </dt>
          <dd className="inline">{isActive ? "Active" : "Deactivated"}</dd>
        </div>
      </dl>

      {locked ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {isSelf
            ? "This is your own account. Role, deactivation and password-reset controls are not available here."
            : "This is the protected recovery administrator. Its role, active status and password cannot be changed by any administrator."}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor={`role-${account.id}`} className="text-xs">
              Role
            </Label>
            <select
              id={`role-${account.id}`}
              value={role}
              disabled={pending}
              onChange={(event) => setRoleValue(event.target.value as Account["role"])}
              className={selectClass}
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || role === account.role}
            onClick={applyRole}
          >
            Change role
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={toggleActive}
          >
            {isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={reset}>
            Reset password
          </Button>
        </div>
      )}

      <div role="status" aria-live="polite" className="mt-2 text-sm">
        {message}
      </div>

      {credential && (
        <OneTimePasswordPanel
          credential={credential}
          label="New password"
          onDone={() => setCredential(null)}
        />
      )}
    </li>
  );
}
