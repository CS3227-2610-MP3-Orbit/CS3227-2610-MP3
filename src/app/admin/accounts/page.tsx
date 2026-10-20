import Link from "next/link";

import { listAccounts } from "@/features/admin/accounts/server";
import { requireRole } from "@/lib/auth/session";

import AccountRow from "./account-row";
import CreateAccountForm from "./create-account-form";

type RawSearchParams = { [key: string]: string | string[] | undefined };

function pick(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

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
      <header>
        <Link
          href="/admin"
          className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">Accounts</h1>
      </header>

      <CreateAccountForm />

      <form
        action="/admin/accounts"
        method="get"
        className="grid gap-4 rounded-lg border p-4 sm:grid-cols-4"
        aria-label="Search accounts"
      >
        <div className="sm:col-span-2">
          <label htmlFor="query" className="block text-sm font-medium">
            Search
          </label>
          <input
            id="query"
            name="query"
            type="search"
            defaultValue={query ?? ""}
            placeholder="Email or name"
            className="mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue={roleFilter ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        <div>
          <label htmlFor="active" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="active"
            name="active"
            defaultValue={activeFilter ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </select>
        </div>
        <div className="flex items-center gap-4 sm:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          >
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
          <p role="alert" className="rounded-md border border-amber-600 p-4">
            Please correct the search filters and try again.
          </p>
        )}
        {result.kind === "temporarily_unavailable" && (
          <div role="alert" className="rounded-md border border-red-700 p-4">
            <p>Accounts are temporarily unavailable. Please retry.</p>
            <p className="mt-1 text-xs">Reference: {result.correlationId}</p>
          </div>
        )}
        {result.kind === "forbidden_or_not_found" && (
          <p role="alert" className="rounded-md border border-red-700 p-4">
            This information is not available to your account.
          </p>
        )}
        {result.kind === "success" && result.accounts.length === 0 && (
          <p role="status">No accounts match these filters.</p>
        )}
        {result.kind === "success" && result.accounts.length > 0 && (
          <ul className="space-y-3">
            {result.accounts.map((account) => (
              <AccountRow key={account.id} account={account} currentUserId={me.id} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
