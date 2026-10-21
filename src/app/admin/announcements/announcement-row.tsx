"use client";

import {
  announcementKindLabel,
  announcementStatusLabel,
  truncatedAnnouncementBody,
} from "@/features/admin/announcements/presentation";
import type { Announcement } from "@/features/admin/announcements/validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statusBadgeVariant } from "@/lib/status-badge";

import EditAnnouncementDialog from "./edit-announcement-dialog";
import { useAnnouncementRowController } from "./use-announcement-row";

/**
 * SH-07-R14: the card presentation of one item, shown below `md`. Same row data, status pill,
 * and actions as `AnnouncementTableRow` -- both drive `useAnnouncementRowController`.
 * `role="group"`/`aria-label={item.title}` lets a test locator match whichever layout is on
 * screen (SH-07-AC17's convention).
 */
export default function AnnouncementRow({ item }: { item: Announcement }) {
  const { editOpen, setEditOpen, message, pending, togglePublished, onEditSuccess } =
    useAnnouncementRowController(item);

  return (
    <li role="group" aria-label={item.title} className="min-w-0 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{announcementKindLabel(item.kind)}</p>
          <p className="break-words font-semibold">{item.title}</p>
          <p className="break-words text-sm text-muted-foreground">
            {truncatedAnnouncementBody(item.body)}
          </p>
        </div>
        <Badge variant={statusBadgeVariant(item.isPublished ? "active" : "deactivated")}>
          {announcementStatusLabel(item)}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={togglePublished}
        >
          {item.isPublished ? "Unpublish" : "Publish"}
        </Button>
      </div>

      <div role="status" aria-live="polite" className="mt-2 text-sm">
        {pending && <p>Saving…</p>}
        {message}
      </div>

      <EditAnnouncementDialog
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onEditSuccess}
      />
    </li>
  );
}
