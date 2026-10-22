import { Megaphone } from "lucide-react";

import { listAnnouncementsForAdmin } from "@/features/admin/announcements/server";
import { requireRole } from "@/lib/auth/session";
import { EmptyState } from "@/components/empty-state";

import AnnouncementsList from "./announcements-list";
import CreateAnnouncementDialog from "./create-announcement-dialog";

/**
 * ADM-03: /admin/announcements, mirroring /admin/courses -- a "New announcement" dialog and
 * the full admin list (published and draft alike, ADM-03-R4), with no search/filter UI
 * (non-goal) and no pagination SLA, same as ADM-01/ADM-02's own catalogues.
 */
export default async function AdminAnnouncementsPage() {
  await requireRole("admin");
  const result = await listAnnouncementsForAdmin();

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <CreateAnnouncementDialog />
      </header>

      <section aria-live="polite" aria-busy="false">
        {result.kind === "temporarily_unavailable" && (
          <div role="alert" className="rounded-lg border border-destructive p-4">
            <p>Announcements are temporarily unavailable. Please retry.</p>
            <p className="mt-1 text-xs text-muted-foreground">Reference: {result.correlationId}</p>
          </div>
        )}
        {result.kind === "forbidden_or_not_found" && (
          <p role="alert" className="rounded-lg border border-destructive p-4">
            This information is not available to your account.
          </p>
        )}
        {result.kind === "success" && result.items.length === 0 && (
          <EmptyState
            icon={Megaphone}
            message="No guidelines or announcements yet."
            action={<CreateAnnouncementDialog label="Create one" variant="link" />}
          />
        )}
        {result.kind === "success" && result.items.length > 0 && (
          <AnnouncementsList items={result.items} />
        )}
      </section>
    </div>
  );
}
