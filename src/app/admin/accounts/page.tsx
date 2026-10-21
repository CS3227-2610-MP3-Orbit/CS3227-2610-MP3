import { SearchX } from "lucide-react";
import Link from "next/link";

import { listAccounts } from "@/features/admin/accounts/server";
import { requireRole } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import AccountsList from "./accounts-list";
import CreateAccountDialog from "./create-account-dialog";

type RawSearchParams = { [key: string]: string | string[] | undefined };

function pick(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

const selectClass =
  "mt-1 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const me = await requireRole("admin");
  const params = await searchParams;
  const query = pick(params, "query");
  const roleFilter = pick(params, "role");
  const activeFilter = pick(params, "active");

  // Keys are omitted (not set to undefined) when absent: listAccountsInputSchema treats an
  // omitted optional field as "no filter", not the same thing as an explicit empty value.
  const filters: Record<string, string> = {};
  if (query !== undefined) filters.query = query;
  if (roleFilter !== undefined) filters.roleFilter = roleFilter;
  if (activeFilter !== undefined) filters.activeFilter = activeFilter;
  const result = await listAccounts(filters);

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <CreateAccountDialog />
      </header>

      <form
        action="/admin/accounts"
        method="get"
        className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-4"
        aria-label="Search accounts"
      >
        <div className="sm:col-span-2">
          <Label htmlFor="query">Search</Label>
          <Input
            id="query"
            name="query"
            type="search"
            defaultValue={query ?? ""}
            placeholder="Email or name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <select id="role" name="role" defaultValue={roleFilter ?? ""} className={selectClass}>
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        <div>
          <Label htmlFor="active">Status</Label>
          <select
            id="active"
            name="active"
            defaultValue={activeFilter ?? ""}
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </select>
        </div>
        <div className="flex items-center gap-4 sm:col-span-4">
          <button type="submit" className={buttonVariants({ variant: "default" })}>
            Search
          </button>
          <Link
            href="/admin/accounts"
            className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Clear filters
          </Link>
        </div>
      </form>

      <section aria-live="polite" aria-busy="false">
        {result.kind === "validation_error" && (
          <p role="alert" className="rounded-lg border border-destructive/50 p-4">
            Please correct the search filters and try again.
          </p>
        )}
        {result.kind === "temporarily_unavailable" && (
          <div role="alert" className="rounded-lg border border-destructive p-4">
            <p>Accounts are temporarily unavailable. Please retry.</p>
            <p className="mt-1 text-xs text-muted-foreground">Reference: {result.correlationId}</p>
          </div>
        )}
        {result.kind === "forbidden_or_not_found" && (
          <p role="alert" className="rounded-lg border border-destructive p-4">
            This information is not available to your account.
          </p>
        )}
        {result.kind === "success" && result.accounts.length === 0 && (
          <EmptyState
            icon={SearchX}
            message="No accounts match these filters."
            action={
              <Link href="/admin/accounts" className="text-sm underline focus-visible:outline-2">
                Clear filters
              </Link>
            }
          />
        )}
        {result.kind === "success" && result.accounts.length > 0 && (
          <AccountsList accounts={result.accounts} currentUserId={me.id} />
        )}
      </section>
    </div>
  );
}
