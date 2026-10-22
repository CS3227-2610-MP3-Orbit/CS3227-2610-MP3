"use client";

import {
  announcementKindLabel,
  announcementStatusLabel,
  truncatedAnnouncementBody,
} from "@/features/admin/announcements/presentation";
import type { Announcement } from "@/features/admin/announcements/validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { statusBadgeVariant } from "@/lib/status-badge";

import EditAnnouncementDialog from "./edit-announcement-dialog";
import { useAnnouncementRowController } from "./use-announcement-row";

/**
 * SH-07-R14: the table-row presentation of one item, shown at `>= md`. Same row data, status
 * pill, and actions as `AnnouncementRow`'s card -- both drive `useAnnouncementRowController`.
 * `aria-label={item.title}` gives the `<tr>` a dependable accessible name a test locator can
 * match (SH-07-AC17's convention). ADM-03-R8: title/body render as plain text only, with the
 * full body (not shown here -- only a truncated preview) always available via "Edit".
 */
export default function AnnouncementTableRow({ item }: { item: Announcement }) {
  const { editOpen, setEditOpen, message, pending, togglePublished, onEditSuccess } =
    useAnnouncementRowController(item);

  return (
    <TableRow aria-label={item.title} className="align-top">
      <TableCell className="whitespace-normal">
        <p className="text-xs text-muted-foreground">{announcementKindLabel(item.kind)}</p>
        <p className="break-words font-semibold">{item.title}</p>
        <p className="break-words text-sm text-muted-foreground">
          {truncatedAnnouncementBody(item.body)}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant={statusBadgeVariant(item.isPublished ? "active" : "deactivated")}>
          {announcementStatusLabel(item)}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-normal">
        <div className="flex flex-wrap items-end gap-3">
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
      </TableCell>
    </TableRow>
  );
}
