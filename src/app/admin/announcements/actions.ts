"use server";

import { refresh } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import {
  createAnnouncement,
  setAnnouncementPublished,
  updateAnnouncement,
} from "@/features/admin/announcements/server";

// Every action re-checks requireRole("admin") here, even though each delegated server.ts
// function checks it again internally -- the same defense-in-depth pattern already used by
// src/app/admin/courses/actions.ts, so a direct call to either layer is refused on its own.

// SH-07-R19: refresh after a successful create so the list behind the dialog shows the new row.
export async function createAnnouncementAction(formData: FormData) {
  await requireRole("admin");
  const result = await createAnnouncement(formData);
  if (result.kind === "success") refresh();
  return result;
}

export async function updateAnnouncementAction(formData: FormData) {
  await requireRole("admin");
  return updateAnnouncement(formData);
}

export async function setAnnouncementPublishedAction(input: unknown) {
  await requireRole("admin");
  return setAnnouncementPublished(input);
}
