import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";

export default async function StudentDashboardPage() {
  await requireRole("student");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Student dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Find a suitable time before requesting a consultation.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/student/slots" className={buttonVariants({ variant: "default" })}>
          Browse consultation slots
        </Link>
        <Link href="/student/bookings" className={buttonVariants({ variant: "outline" })}>
          My bookings
        </Link>
      </div>
    </div>
  );
}
