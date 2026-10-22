"use client";

import { ROLE_LABEL } from "@/components/app-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Account } from "@/features/admin/accounts/validation";
import { statusBadgeVariant } from "@/lib/status-badge";

import OneTimePasswordPanel from "./one-time-password-panel";
import { useAccountRowController } from "./use-account-row";

const selectClass =
  "mt-1 h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * SH-07-R14: the card presentation of one account row, shown below `md`. Same row data,
 * status/role pills, and actions as `AccountTableRow` -- both drive `useAccountRowController`.
 * `role="group"`/`aria-label={account.email}` gives this card the same accessible identity a
 * table row's `aria-label` does, so a test locator can match whichever layout is on screen
 * (SH-07-AC17).
 */
export default function AccountRow({
  account,
  currentUserId,
}: {
  account: Account;
  currentUserId: string;
}) {
  const {
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
  } = useAccountRowController(account, currentUserId);

  return (
    <li role="group" aria-label={account.email} className="min-w-0 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-semibold" title={account.email}>
            {account.email}
          </p>
          <p className="break-words text-sm text-muted-foreground">
            {account.fullName || "(no name)"}
          </p>
        </div>
        {account.isProtected && <Badge variant="outline">Protected</Badge>}
      </div>

      <dl className="mt-2 grid gap-1 text-sm">
        <div>
          <dt className="inline font-medium">Role: </dt>
          <dd className="inline">
            <Badge variant={statusBadgeVariant(role)}>{ROLE_LABEL[role]}</Badge>
          </dd>
        </div>
        <div>
          <dt className="inline font-medium">Status: </dt>
          <dd className="inline">
            <Badge variant={statusBadgeVariant(isActive ? "active" : "deactivated")}>
              {isActive ? "Active" : "Deactivated"}
            </Badge>
          </dd>
        </div>
      </dl>

      {locked ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {isSelf
            ? "This is your own account. Role, deactivation and password-reset controls are not available here."
            : "This is the protected recovery administrator. Its role, active status and password cannot be changed by any administrator."}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-end gap-2">
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
          </div>
          <div className="flex flex-wrap gap-2">
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
