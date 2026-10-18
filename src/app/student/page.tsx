import Link from "next/link";

import { requireRole } from "@/lib/auth/session";

export default async function StudentDashboardPage() {
  await requireRole("student");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Student dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Find a suitable time before requesting a consultation.
        </p>
      </div>
      <Link
        href="/student/slots"
        className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Browse consultation slots
      </Link>
    </div>
  );
}
