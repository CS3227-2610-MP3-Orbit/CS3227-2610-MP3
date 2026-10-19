import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMyBookings } from "@/features/student/bookings/manage-server";
import { formatSingaporeDateTime } from "@/features/student/slots/format";
export default async function MyBookingsPage() {
  await requireRole("student");
  const result = await listMyBookings();
  return (
    <div className="space-y-5 min-w-0">
      <header>
        <Link
          className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/student"
        >
          Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">My bookings</h1>
      </header>
      {result.kind === "success" ? (
        result.bookings.length === 0 ? (
          <p role="status">You have no consultation bookings yet.</p>
        ) : (
          <ul className="space-y-3">
            {result.bookings.map((b) => (
              <li key={b.bookingId} className="rounded border p-4 break-words">
                <p>
                  <strong>
                    {b.courseCode} — {b.courseName}
                  </strong>
                </p>
                <p>Lecturer: {b.lecturerName}</p>
                <p>{formatSingaporeDateTime(b.startsAt)} (SGT)</p>
                <p>Status: {b.status}</p>
                <p>Topic: {b.topic}</p>
                <Link
                  className="underline focus-visible:outline-2"
                  href={`/student/bookings/${b.bookingId}`}
                >
                  View booking
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div role="alert">
          <p>Bookings are temporarily unavailable. Please retry.</p>
          <Link className="underline" href="/student/bookings">
            Retry
          </Link>
        </div>
      )}
    </div>
  );
}
