"use client";

import { ROLE_LABEL } from "@/components/app-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Account } from "@/features/admin/accounts/validation";
import { statusBadgeVariant } from "@/lib/status-badge";

import OneTimePasswordPanel from "./one-time-password-panel";
import { useAccountRowController } from "./use-account-row";

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * SH-07-R14: the table-row presentation of one account, shown at `>= md`. Same row data,
 * status/role pills, and actions as `AccountRow`'s card -- both drive
 * `useAccountRowController`. `aria-label={account.email}` gives the `<tr>` a dependable
 * accessible name a test locator can match (SH-07-AC17), since `<tr>` has no "name from
 * content" rule of its own to rely on.
 */
export default function AccountTableRow({
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
    <TableRow aria-label={account.email} className="align-top">
      <TableCell className="whitespace-normal">
        <p className="max-w-[14rem] truncate font-semibold" title={account.email}>
          {account.email}
        </p>
        <p
          className="max-w-[14rem] truncate text-sm text-muted-foreground"
          title={account.fullName || undefined}
        >
          {account.fullName || "(no name)"}
        </p>
        {account.isProtected && (
          <Badge variant="outline" className="mt-1">
            Protected
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={statusBadgeVariant(role)}>{ROLE_LABEL[role]}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={statusBadgeVariant(isActive ? "active" : "deactivated")}>
          {isActive ? "Active" : "Deactivated"}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-normal">
        {locked ? (
          <p className="text-sm text-muted-foreground">
            {isSelf
              ? "This is your own account. Role, deactivation and password-reset controls are not available here."
              : "This is the protected recovery administrator. Its role, active status and password cannot be changed by any administrator."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label htmlFor={`role-table-${account.id}`} className="text-xs">
                  Role
                </Label>
                <select
                  id={`role-table-${account.id}`}
                  value={role}
                  disabled={pending}
                  onChange={(event) => setRoleValue(event.target.value as Account["role"])}
                  className={`mt-1 ${selectClass}`}
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
      </TableCell>
    </TableRow>
  );
}
