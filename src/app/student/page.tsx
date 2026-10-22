import { CalendarCheck, CalendarSearch } from "lucide-react";

import { QuickActionCard } from "@/components/quick-action-card";
import { StatTile, StatTileRow } from "@/components/stat-tile";
import { listMyBookings } from "@/features/student/bookings/manage-server";
import { greetingFor } from "@/lib/greeting";
import { requireRole } from "@/lib/auth/session";

const ACTIVE_BOOKING_STATUSES = new Set(["pending", "approved"]);

export default async function StudentDashboardPage() {
  const user = await requireRole("student");
  // SH-07-R12: "upcoming/active bookings" counts listMyBookings()'s own result -- no new query.
  // The student "available slots" tile the owner also asked for is omitted per SH-07-R12:
  // browseAvailableSlots is cursor-paginated and cannot cheaply return an unfiltered total.
  const bookingsResult = await listMyBookings();
  const activeBookingsCount =
    bookingsResult.kind === "success"
      ? bookingsResult.bookings.filter((booking) => ACTIVE_BOOKING_STATUSES.has(booking.status))
          .length
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{greetingFor(new Date(), user.fullName)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Find a suitable time before requesting a consultation.
        </p>
      </div>
      <StatTileRow>
        <StatTile
          label="Upcoming or active bookings"
          value={activeBookingsCount}
          icon={CalendarCheck}
          tone="primary"
        />
      </StatTileRow>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickActionCard
          href="/student/slots"
          icon={CalendarSearch}
          label="Browse consultation slots"
        />
        <QuickActionCard href="/student/bookings" icon={CalendarCheck} label="My bookings" />
      </div>
    </div>
  );
}
