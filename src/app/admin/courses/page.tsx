import { SearchX } from "lucide-react";
import Link from "next/link";

import { listAccounts } from "@/features/admin/accounts/server";
import { listCourses } from "@/features/admin/courses/server";
import { requireRole } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import CoursesList from "./courses-list";
import CreateCourseDialog from "./create-course-dialog";

type RawSearchParams = { [key: string]: string | string[] | undefined };

function pick(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

const selectClass =
  "mt-1 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const query = pick(params, "query");
  const activeFilter = pick(params, "active");

  const filters: Record<string, string> = {};
  if (query !== undefined) filters.query = query;
  if (activeFilter !== undefined) filters.activeFilter = activeFilter;
  const result = await listCourses(filters);

  // ADM-02-R7: the lecturer picker reuses ADM-01's existing admin_list_accounts read --
  // no new read RPC for it. A failure here degrades the picker to "no eligible lecturers"
  // rather than failing the whole page: the course list itself does not depend on it.
  // activeFilter is the URL form "true", which listAccounts validates; a boolean is rejected.
  const lecturersResult = await listAccounts({ roleFilter: "lecturer", activeFilter: "true" });
  const eligibleLecturers =
    lecturersResult.kind === "success"
      ? lecturersResult.accounts.map((account) => ({
          id: account.id,
          label: `${account.fullName || "(no name)"} (${account.email})`,
        }))
      : [];

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <CreateCourseDialog />
      </header>

      <form
        action="/admin/courses"
        method="get"
        className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-3"
        aria-label="Search courses"
      >
        <div className="sm:col-span-2">
          <Label htmlFor="query">Search</Label>
          <Input
            id="query"
            name="query"
            type="search"
            defaultValue={query ?? ""}
            placeholder="Code or name"
            className="mt-1"
          />
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
        <div className="flex items-center gap-4 sm:col-span-3">
          <button type="submit" className={buttonVariants({ variant: "default" })}>
            Search
          </button>
          <Link
            href="/admin/courses"
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
            <p>Courses are temporarily unavailable. Please retry.</p>
            <p className="mt-1 text-xs text-muted-foreground">Reference: {result.correlationId}</p>
          </div>
        )}
        {result.kind === "forbidden_or_not_found" && (
          <p role="alert" className="rounded-lg border border-destructive p-4">
            This information is not available to your account.
          </p>
        )}
        {result.kind === "success" && result.courses.length === 0 && (
          <EmptyState
            icon={SearchX}
            message="No courses match these filters."
            action={
              <Link href="/admin/courses" className="text-sm underline focus-visible:outline-2">
                Clear filters
              </Link>
            }
          />
        )}
        {result.kind === "success" && result.courses.length > 0 && (
          <CoursesList courses={result.courses} eligibleLecturers={eligibleLecturers} />
        )}
      </section>
    </div>
  );
}
