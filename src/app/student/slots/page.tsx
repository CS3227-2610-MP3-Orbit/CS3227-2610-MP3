import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatSingaporeDateTime } from "@/features/student/slots/format";
import { browseAvailableSlots } from "@/features/student/slots/server";
import { filtersToQuery, type RawBrowseSearchParams } from "@/features/student/slots/validation";
import { requireRole } from "@/lib/auth/session";

const selectClass =
  "mt-1 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const inputClass =
  "mt-1 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
        <p className="mt-2 text-sm text-muted-foreground">
          Times are shown in Singapore Time (SGT). Availability is checked when this page loads and
          will be checked again when you request a slot.
        </p>
      </header>

      <form
        action="/student/slots"
        method="get"
        className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-3"
      >
        <div>
          <Label htmlFor="courseId">Course</Label>
          <select
            id="courseId"
            name="courseId"
            defaultValue={input?.courseId ?? ""}
            className={selectClass}
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
          <Label htmlFor="lecturerId">Lecturer</Label>
          <select
            id="lecturerId"
            name="lecturerId"
            defaultValue={input?.lecturerId ?? ""}
            className={selectClass}
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
          <Label htmlFor="date">Date in Singapore</Label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={input?.date ?? ""}
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-3">
          <button type="submit" className={buttonVariants({ variant: "default" })}>
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
          <div role="alert" className="mt-4 rounded-lg border border-destructive/50 p-4">
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
          <div role="alert" className="mt-4 rounded-lg border border-destructive p-4">
            <p>Slots are temporarily unavailable. Please try again.</p>
            <p className="mt-1 text-xs text-muted-foreground">Reference: {result.correlationId}</p>
            <Link
              href={restartHref}
              className="mt-2 inline-block underline focus-visible:outline-2"
            >
              Retry
            </Link>
          </div>
        )}

        {result.status === "forbidden_or_not_found" && (
          <p role="alert" className="mt-4 rounded-lg border border-destructive p-4">
            This information is not available to your account.
          </p>
        )}

        {result.status === "success" && result.slots.length === 0 && (
          <div className="mt-4 rounded-lg border bg-card p-4">
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
                <li key={slot.slotId} className="min-w-0 rounded-lg border bg-card p-4">
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
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    Slot reference: {slot.slotId}
                  </p>
                  <Link
                    href={`/student/slots/${slot.slotId}/request`}
                    className="mt-3 inline-block underline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Request consultation
                  </Link>
                </li>
              ))}
            </ul>

            {result.nextCursor && (
              <Link
                href={`/student/slots?${filtersToQuery({ ...result.input, cursor: result.nextCursor })}`}
                className={buttonVariants({ variant: "outline", className: "mt-6" })}
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
