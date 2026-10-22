"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { Announcement } from "@/features/admin/announcements/validation";

import { setAnnouncementPublishedAction } from "./actions";

export function describeAnnouncementMutateFailure(kind: string): string {
  switch (kind) {
    case "forbidden_or_not_found":
      return "This item is no longer available.";
    case "validation_error":
      return "Please correct the highlighted value and try again.";
    default:
      return "This action is temporarily unavailable. Please retry.";
  }
}

/**
 * ADM-03 / SH-07-R14: the edit-dialog-open and publish/unpublish controller shared by the
 * table-row (>= md) and card (< md) presentations of one item, so both layouts drive the exact
 * same server action and success/failure messages.
 */
export function useAnnouncementRowController(item: Announcement) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function togglePublished() {
    setMessage("");
    startTransition(async () => {
      const result = await setAnnouncementPublishedAction({
        id: item.id,
        isPublished: !item.isPublished,
      });
      if (result.kind === "success") {
        setMessage(result.isPublished ? "Published." : "Unpublished.");
        router.refresh();
      } else {
        setMessage(describeAnnouncementMutateFailure(result.kind));
      }
    });
  }

  function onEditSuccess() {
    setMessage("Updated.");
    setEditOpen(false);
    router.refresh();
  }

  return { editOpen, setEditOpen, message, pending, togglePublished, onEditSuccess };
}
