import "server-only";

import { randomUUID } from "node:crypto";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import {
  announcementSchema,
  boundedInput,
  createAnnouncementInputSchema,
  createAnnouncementResultSchema,
  fieldSchema,
  setAnnouncementPublishedInputSchema,
  setAnnouncementPublishedResultSchema,
  updateAnnouncementInputSchema,
  updateAnnouncementResultSchema,
  type Announcement,
  type AnnouncementField,
  type CreateAnnouncementResult,
  type ListAnnouncementsForAdminResult,
  type SetAnnouncementPublishedResult,
  type UpdateAnnouncementResult,
} from "./validation";

// ADM-03-R7: no function in this module calls a model, builds a prompt, or writes ai_usage --
// every path below only ever calls one of the three admin_* announcement RPCs, or (for the
// admin list) a direct RLS-protected table read, over the caller's own session.

function temporarilyUnavailable(): { kind: "temporarily_unavailable"; correlationId: string } {
  return { kind: "temporarily_unavailable", correlationId: randomUUID() };
}
function invalid(path?: PropertyKey): { kind: "validation_error"; field: AnnouncementField } {
  const field = fieldSchema.safeParse(path);
  return { kind: "validation_error", field: field.success ? field.data : "request" };
}

/** ADM-03-R1/R6: create a guideline or announcement. Always starts as a draft. */
export async function createAnnouncement(raw: unknown): Promise<CreateAnnouncementResult> {
  await requireRole("admin");
  const input = createAnnouncementInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_create_announcement", {
        p_kind: input.data.kind,
        p_title: input.data.title,
        p_body: input.data.body,
      })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && createAnnouncementResultSchema.safeParse(data).success
      ? createAnnouncementResultSchema.parse(data)
      : temporarilyUnavailable();
  } catch {
    return temporarilyUnavailable();
  }
}

/** ADM-03-R2/R6: edit an existing item's kind/title/body. Never changes isPublished. */
export async function updateAnnouncement(raw: unknown): Promise<UpdateAnnouncementResult> {
  await requireRole("admin");
  const input = updateAnnouncementInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_update_announcement", {
        p_id: input.data.id,
        p_kind: input.data.kind,
        p_title: input.data.title,
        p_body: input.data.body,
      })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && updateAnnouncementResultSchema.safeParse(data).success
      ? updateAnnouncementResultSchema.parse(data)
      : temporarilyUnavailable();
  } catch {
    return temporarilyUnavailable();
  }
}

/** ADM-03-R3/R6: publish or unpublish. Never deletes the row; the full history is preserved. */
export async function setAnnouncementPublished(
  raw: unknown,
): Promise<SetAnnouncementPublishedResult> {
  await requireRole("admin");
  const input = setAnnouncementPublishedInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_set_announcement_published", {
        p_id: input.data.id,
        p_published: input.data.isPublished,
      })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && setAnnouncementPublishedResultSchema.safeParse(data).success
      ? setAnnouncementPublishedResultSchema.parse(data)
      : temporarilyUnavailable();
  } catch {
    return temporarilyUnavailable();
  }
}

/**
 * ADM-03-R4: list every item, published and draft alike, newest-first. A direct, RLS-protected
 * table read behind requireRole("admin") (the "announcements: admin reads all" policy) -- no
 * RPC, matching the approved spec's technical proposal.
 */
export async function listAnnouncementsForAdmin(): Promise<ListAnnouncementsForAdminResult> {
  await requireRole("admin");
  try {
    const db = await createClient();
    const { data, error } = await db
      .from("announcements")
      .select("id, kind, title, body, is_published, created_at, updated_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .abortSignal(AbortSignal.timeout(10000));
    if (error || !data) return temporarilyUnavailable();

    const items: Announcement[] = [];
    for (const row of data) {
      const parsed = announcementSchema.safeParse({
        id: row.id,
        kind: row.kind,
        title: row.title,
        body: row.body,
        isPublished: row.is_published,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
      if (!parsed.success) return temporarilyUnavailable();
      items.push(parsed.data);
    }
    return { kind: "success", items };
  } catch {
    return temporarilyUnavailable();
  }
}
