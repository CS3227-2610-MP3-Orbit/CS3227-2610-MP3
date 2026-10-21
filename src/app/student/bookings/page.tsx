import { Inbox } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMyBookings } from "@/features/student/bookings/manage-server";
import { formatSingaporeDateTime } from "@/features/student/slots/format";
import { Badge } from "@/components/ui/badge";
import { statusBadgeVariant } from "@/lib/status-badge";
export default async function MyBookingsPage() {
  await requireRole("student");
  const result = await listMyBookings();
  return (
    <div className="space-y-5 min-w-0">
      <header>
        <h1 className="text-2xl font-semibold">My bookings</h1>
      </header>
      {result.kind === "success" ? (
        result.bookings.length === 0 ? (
          <p role="status" className="flex items-center gap-2 text-muted-foreground">
            <Inbox aria-hidden="true" className="size-4" />
            You have no consultation bookings yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {result.bookings.map((b) => (
              <li key={b.bookingId} className="rounded-lg border bg-card p-4 break-words">
                <p>
                  <strong>
                    {b.courseCode} — {b.courseName}
                  </strong>
                </p>
                <p>Lecturer: {b.lecturerName}</p>
                <p>{formatSingaporeDateTime(b.startsAt)} (SGT)</p>
                <p>
                  Status: <Badge variant={statusBadgeVariant(b.status)}>{b.status}</Badge>
                </p>
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
        <div role="alert" className="rounded-lg border border-destructive p-4">
          <p>Bookings are temporarily unavailable. Please retry.</p>
          <Link className="underline" href="/student/bookings">
            Retry
          </Link>
        </div>
      )}
    </div>
  );
}
