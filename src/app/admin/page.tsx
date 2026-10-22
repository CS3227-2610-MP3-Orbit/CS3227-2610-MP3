import { BookOpen, ChartColumn, Inbox, Users } from "lucide-react";

import { RequestCard } from "@/app/lecturer/request-card";
import { EmptyState } from "@/components/empty-state";
import { QuickActionCard } from "@/components/quick-action-card";
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
          icon={Users}
          tone="primary"
        />
        <StatTile
          label="Active courses"
          value={coursesResult.kind === "success" ? coursesResult.courses.length : null}
          icon={BookOpen}
          tone="secondary"
        />
        <StatTile
          label="Pending consultation requests"
          value={pendingRequestsCount}
          icon={Inbox}
          tone="warning"
        />
      </StatTileRow>
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickActionCard href="/admin/accounts" icon={Users} label="Manage accounts" />
        <QuickActionCard href="/admin/courses" icon={BookOpen} label="Manage courses" />
        <QuickActionCard href="/admin/reports" icon={ChartColumn} label="View reports" />
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
            <EmptyState icon={Inbox} message="No pending consultation requests." />
          )
        ) : (
          <p role="alert">Requests are temporarily unavailable. Please retry.</p>
        )}
      </section>
    </div>
  );
}
