"use client";

import type { Announcement } from "@/features/admin/announcements/validation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import EditAnnouncementForm from "./edit-announcement-form";

/**
 * ADM-03 UI description: "Edit" opens a Dialog pre-filled with the item's current values
 * (controlled by the row's own shared controller, use-announcement-row.ts, so the "Edit"
 * button lives in the row component itself rather than inside this dialog).
 */
export default function EditAnnouncementDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: {
  item: Announcement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit guideline or announcement</DialogTitle>
        </DialogHeader>
        <EditAnnouncementForm item={item} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
