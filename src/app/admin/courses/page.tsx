import Link from "next/link";

import { listAccounts } from "@/features/admin/accounts/server";
import { listCourses } from "@/features/admin/courses/server";
import { requireRole } from "@/lib/auth/session";

import CourseRow from "./course-row";
import CreateCourseForm from "./create-course-form";

type RawSearchParams = { [key: string]: string | string[] | undefined };

function pick(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

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
      <header>
        <Link
          href="/admin"
          className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">Courses</h1>
      </header>

      <CreateCourseForm />

      <form
        action="/admin/courses"
        method="get"
        className="grid gap-4 rounded-lg border p-4 sm:grid-cols-4"
        aria-label="Search courses"
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
            placeholder="Code or name"
            className="mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
          />
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
            href="/admin/courses"
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
            <p>Courses are temporarily unavailable. Please retry.</p>
            <p className="mt-1 text-xs">Reference: {result.correlationId}</p>
          </div>
        )}
        {result.kind === "forbidden_or_not_found" && (
          <p role="alert" className="rounded-md border border-red-700 p-4">
            This information is not available to your account.
          </p>
        )}
        {result.kind === "success" && result.courses.length === 0 && (
          <p role="status">No courses match these filters.</p>
        )}
        {result.kind === "success" && result.courses.length > 0 && (
          <ul className="space-y-3">
            {result.courses.map((course) => (
              <CourseRow key={course.id} course={course} eligibleLecturers={eligibleLecturers} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
