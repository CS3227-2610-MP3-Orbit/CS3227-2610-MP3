import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Account } from "@/features/admin/accounts/validation";

import AccountRow from "./account-row";
import AccountTableRow from "./account-table-row";

/**
 * SH-07-R14 / SH-07-AC17: the same accounts, in the same order, render as a `Table` at
 * `>= md` and as stacked `Card`s below it -- both halves always render (Tailwind's `hidden`/
 * `md:hidden` toggles which one is in the accessibility tree and on screen for the current
 * viewport), so there is never a client-side re-fetch or layout flash when the viewport
 * crosses the breakpoint.
 */
export default function AccountsList({
  accounts,
  currentUserId,
}: {
  accounts: Account[];
  currentUserId: string;
}) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15rem]">Account</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <AccountTableRow key={account.id} account={account} currentUserId={currentUserId} />
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-3 md:hidden">
        {accounts.map((account) => (
          <AccountRow key={account.id} account={account} currentUserId={currentUserId} />
        ))}
      </ul>
    </>
  );
}
