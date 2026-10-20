import Link from "next/link";

import { listLecturerRequests } from "@/features/lecturer/requests-server";
import { RequestCard } from "@/app/lecturer/request-card";

export default async function AdminDashboardPage() {
  const result = await listLecturerRequests();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Administrator dashboard</h1>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/accounts"
          className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Manage accounts
        </Link>
        <Link
          href="/admin/courses"
          className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Manage courses
        </Link>
      </div>
      <section className="space-y-5">
        <h2 className="text-xl font-semibold">Consultation requests</h2>
        {result.kind === "success" ? (
          result.requests.length ? (
            <ul className="space-y-3">
              {result.requests.map((request) => (
                <RequestCard key={request.bookingId} request={request} />
              ))}
            </ul>
          ) : (
            <p role="status">No pending consultation requests.</p>
          )
        ) : (
          <p role="alert">Requests are temporarily unavailable. Please retry.</p>
        )}
      </section>
    </div>
  );
}
