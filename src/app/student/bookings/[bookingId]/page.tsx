import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getMyBooking } from "@/features/student/bookings/manage-server";
import BookingManager from "./booking-manager";
export default async function BookingPage({ params }: { params: Promise<{ bookingId: string }> }) {
  await requireRole("student");
  const { bookingId } = await params;
  const result = await getMyBooking({ bookingId });
  if (result.kind !== "success")
    return (
      <div className="space-y-4">
        <nav aria-label="Booking navigation" className="flex flex-wrap gap-4">
          <Link
            className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/student"
          >
            Back to dashboard
          </Link>
          <Link
            className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/student/bookings"
          >
            Back to My Bookings
          </Link>
        </nav>
        <div role="alert" className="rounded-lg border border-destructive p-4">
          {result.kind === "temporarily_unavailable"
            ? "Booking details are temporarily unavailable. Please retry."
            : "This booking is unavailable."}
        </div>
      </div>
    );
  const b = result.booking;
  return (
    <div className="space-y-5 min-w-0">
      <nav aria-label="Booking navigation" className="flex flex-wrap gap-4">
        <Link
          className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/student"
        >
          Back to dashboard
        </Link>
        <Link
          className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/student/bookings"
        >
          Back to My Bookings
        </Link>
      </nav>
      <h1 className="text-2xl font-semibold">Booking details</h1>
      <BookingManager booking={b} />
    </div>
  );
}
