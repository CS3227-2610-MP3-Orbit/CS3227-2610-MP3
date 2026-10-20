"use client";

import { useState, useTransition } from "react";

import { isAccountLocked } from "@/features/admin/accounts/presentation";
import type { Account } from "@/features/admin/accounts/validation";

import { resetPasswordAction, setActiveAction, setRoleAction } from "./actions";
import OneTimePasswordPanel from "./one-time-password-panel";

const ROLE_LABEL = { student: "Student", lecturer: "Lecturer", admin: "Administrator" } as const;
const control =
  "mt-1 rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2";
const button =
  "rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";

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
      if (result.kind === "success") setCredential(result.initialCredential);
      else setMessage(describeResetFailure(result.kind));
    });
  }

  return (
    <li className="min-w-0 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-semibold">{account.email}</p>
          <p className="break-words text-sm text-gray-600">{account.fullName || "(no name)"}</p>
        </div>
        {account.isProtected && (
          <span className="rounded-full border border-amber-600 px-2 py-1 text-xs font-medium text-amber-700">
            Protected
          </span>
        )}
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
        <p className="mt-2 text-sm text-gray-600">
          {isSelf
            ? "This is your own account. Role, deactivation and password-reset controls are not available here."
            : "This is the protected recovery administrator. Its role, active status and password cannot be changed by any administrator."}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor={`role-${account.id}`} className="block text-xs font-medium">
              Role
            </label>
            <select
              id={`role-${account.id}`}
              value={role}
              disabled={pending}
              onChange={(event) => setRoleValue(event.target.value as Account["role"])}
              className={control}
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <button
            type="button"
            disabled={pending || role === account.role}
            onClick={applyRole}
            className={button}
          >
            Change role
          </button>
          <button type="button" disabled={pending} onClick={toggleActive} className={button}>
            {isActive ? "Deactivate" : "Activate"}
          </button>
          <button type="button" disabled={pending} onClick={reset} className={button}>
            Reset password
          </button>
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
