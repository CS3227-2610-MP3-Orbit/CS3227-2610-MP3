import Link from "next/link";

import { formatSingaporeDateTime } from "@/features/student/slots/format";
import { browseAvailableSlots } from "@/features/student/slots/server";
import { filtersToQuery, type RawBrowseSearchParams } from "@/features/student/slots/validation";
import { requireRole } from "@/lib/auth/session";

function selectedFallback(id: string | undefined, label: string) {
  return id ? <option value={id}>Selected {label}</option> : null;
}

export default async function StudentSlotsPage({
  searchParams,
}: {
  searchParams: Promise<RawBrowseSearchParams>;
}) {
  await requireRole("student");
  const result = await browseAvailableSlots(await searchParams);
  const input = "input" in result ? result.input : undefined;
  const restartQuery = input ? filtersToQuery(input, false) : "";
  const restartHref = restartQuery ? `/student/slots?${restartQuery}` : "/student/slots";

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/student"
          className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">Available consultation slots</h1>
        <p className="mt-2 text-sm text-gray-600">
          Times are shown in Singapore Time (SGT). Availability is checked when this page loads and
          will be checked again when you request a slot.
        </p>
      </header>

      <form
        action="/student/slots"
        method="get"
        className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3"
      >
        <div>
          <label htmlFor="courseId" className="block text-sm font-medium">
            Course
          </label>
          <select
            id="courseId"
            name="courseId"
            defaultValue={input?.courseId ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2"
          >
            <option value="">All courses</option>
            {result.status === "success" &&
              input?.courseId &&
              !result.courses.some((course) => course.id === input.courseId) &&
              selectedFallback(input.courseId, "course")}
            {result.status === "success" &&
              result.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} — {course.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label htmlFor="lecturerId" className="block text-sm font-medium">
            Lecturer
          </label>
          <select
            id="lecturerId"
            name="lecturerId"
            defaultValue={input?.lecturerId ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2"
          >
            <option value="">All lecturers</option>
            {result.status === "success" &&
              input?.lecturerId &&
              !result.lecturers.some((lecturer) => lecturer.id === input.lecturerId) &&
              selectedFallback(input.lecturerId, "lecturer")}
            {result.status === "success" &&
              result.lecturers.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium">
            Date in Singapore
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={input?.date ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-3">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Apply filters
          </button>
          <Link
            href="/student/slots"
            className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Clear filters
          </Link>
        </div>
      </form>

      <section aria-labelledby="slot-results-heading" aria-live="polite" aria-busy="false">
        <h2 id="slot-results-heading" className="text-lg font-semibold">
          Results
        </h2>

        {result.status === "validation_error" && (
          <div role="alert" className="mt-4 rounded-lg border border-amber-600 p-4">
            <p>{result.message}</p>
            <Link
              href={restartHref}
              className="mt-2 inline-block underline focus-visible:outline-2"
            >
              Restart from the first page
            </Link>
          </div>
        )}

        {result.status === "temporarily_unavailable" && (
          <div role="alert" className="mt-4 rounded-lg border border-red-700 p-4">
            <p>Slots are temporarily unavailable. Please try again.</p>
            <p className="mt-1 text-xs">Reference: {result.correlationId}</p>
            <Link
              href={restartHref}
              className="mt-2 inline-block underline focus-visible:outline-2"
            >
              Retry
            </Link>
          </div>
        )}

        {result.status === "forbidden_or_not_found" && (
          <p role="alert" className="mt-4 rounded-lg border border-red-700 p-4">
            This information is not available to your account.
          </p>
        )}

        {result.status === "success" && result.slots.length === 0 && (
          <div className="mt-4 rounded-lg border p-4">
            <p>No available slots match these filters.</p>
            <Link
              href="/student/slots"
              className="mt-2 inline-block underline focus-visible:outline-2"
            >
              Clear filters
            </Link>
          </div>
        )}

        {result.status === "success" && result.slots.length > 0 && (
          <>
            <ul className="mt-4 grid gap-4">
              {result.slots.map((slot) => (
                <li key={slot.slotId} className="min-w-0 rounded-lg border p-4">
                  <h3 className="break-words font-semibold">
                    {slot.courseCode} — {slot.courseName}
                  </h3>
                  <dl className="mt-2 grid gap-1 text-sm">
                    <div>
                      <dt className="inline font-medium">Lecturer: </dt>
                      <dd className="inline break-words">{slot.lecturerName}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">Starts: </dt>
                      <dd className="inline">{formatSingaporeDateTime(slot.startsAt)}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">Ends: </dt>
                      <dd className="inline">{formatSingaporeDateTime(slot.endsAt)}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 break-all text-xs text-gray-600">
                    Slot reference: {slot.slotId}
                  </p>
                </li>
              ))}
            </ul>

            {result.nextCursor && (
              <Link
                href={`/student/slots?${filtersToQuery({ ...result.input, cursor: result.nextCursor })}`}
                className="mt-6 inline-flex rounded-md border border-black px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Load more
              </Link>
            )}
          </>
        )}
      </section>
    </div>
  );
}
