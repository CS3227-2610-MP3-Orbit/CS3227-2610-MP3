import Link from "next/link";

import { listLecturerRequests } from "@/features/lecturer/requests-server";
import { RequestCard } from "@/app/lecturer/request-card";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const result = await listLecturerRequests();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Administrator dashboard</h1>
      <Link href="/admin/accounts" className={buttonVariants({ variant: "default" })}>
        Manage accounts
      </Link>
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
