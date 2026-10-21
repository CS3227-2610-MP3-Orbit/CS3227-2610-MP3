import { Inbox } from "lucide-react";
import Link from "next/link";

import { RequestCard } from "@/app/lecturer/request-card";
import { buttonVariants } from "@/components/ui/button";
import { StatTile, StatTileRow } from "@/components/stat-tile";
import { listAccounts } from "@/features/admin/accounts/server";
import { listCourses } from "@/features/admin/courses/server";
import { listLecturerRequests } from "@/features/lecturer/requests-server";
import { greetingFor } from "@/lib/greeting";
import { requireRole } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");
  // SH-07-R12: a greeting + stat-tile row built only from data each tile's own existing server
  // function already returns -- no new query, RPC, or filter shape.
  const [result, accountsResult, coursesResult] = await Promise.all([
    listLecturerRequests(),
    listAccounts({ activeFilter: "true" }),
    listCourses({ activeFilter: "true" }),
  ]);
  const pendingRequestsCount = result.kind === "success" ? result.requests.length : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{greetingFor(new Date(), user.fullName)}</h1>
      <StatTileRow>
        <StatTile
          label="Active accounts"
          value={accountsResult.kind === "success" ? accountsResult.accounts.length : null}
        />
        <StatTile
          label="Active courses"
          value={coursesResult.kind === "success" ? coursesResult.courses.length : null}
        />
        <StatTile label="Pending consultation requests" value={pendingRequestsCount} />
      </StatTileRow>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/accounts" className={buttonVariants({ variant: "default" })}>
          Manage accounts
        </Link>
        <Link href="/admin/courses" className={buttonVariants({ variant: "default" })}>
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
            <p role="status" className="flex items-center gap-2 text-muted-foreground">
              <Inbox aria-hidden="true" className="size-4" />
              No pending consultation requests.
            </p>
          )
        ) : (
          <p role="alert">Requests are temporarily unavailable. Please retry.</p>
        )}
      </section>
    </div>
  );
}
