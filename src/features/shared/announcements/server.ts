import "server-only";

import { randomUUID } from "node:crypto";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import {
  readerAnnouncementSchema,
  type ListPublishedAnnouncementsResult,
  type ReaderAnnouncement,
} from "./validation";

// ADM-03-R9: unlimited guidelines, but at most this many of the newest published announcements.
const ANNOUNCEMENT_READER_CAP = 5;

// ADM-03-R7: this module never calls a model, builds a prompt, or writes ai_usage.

function temporarilyUnavailable(): { kind: "temporarily_unavailable"; correlationId: string } {
  return { kind: "temporarily_unavailable", correlationId: randomUUID() };
}

function parseRows(
  rows: { id: string; title: string; body: string; updated_at: string }[],
): ReaderAnnouncement[] | null {
  const items: ReaderAnnouncement[] = [];
  for (const row of rows) {
    const parsed = readerAnnouncementSchema.safeParse({
      id: row.id,
      title: row.title,
      body: row.body,
      updatedAt: row.updated_at,
    });
    if (!parsed.success) return null;
    items.push(parsed.data);
  }
  return items;
}

/**
 * ADM-03-R5/R9/R10: any active signed-in user (any role) reads every published guideline (no
 * cap), plus the 5 newest published announcements, both newest-first. Two direct,
 * RLS-protected table reads (the "announcements: active users read published" policy) -- no
 * RPC, matching the approved spec's technical proposal. Explicitly filters is_published = true
 * itself (not only via RLS): this function's own name/contract promises published-only content
 * regardless of the caller's role, and an admin caller's separate "admin reads all" policy
 * would otherwise also make a draft visible through this same query.
 */
export async function listPublishedAnnouncements(): Promise<ListPublishedAnnouncementsResult> {
  await requireUser();
  try {
    const db = await createClient();
    const [guidelinesResult, announcementsResult] = await Promise.all([
      db
        .from("announcements")
        .select("id, title, body, updated_at")
        .eq("kind", "guideline")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .abortSignal(AbortSignal.timeout(10000)),
      db
        .from("announcements")
        .select("id, title, body, updated_at")
        .eq("kind", "announcement")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(ANNOUNCEMENT_READER_CAP)
        .abortSignal(AbortSignal.timeout(10000)),
    ]);

    if (guidelinesResult.error || !guidelinesResult.data) return temporarilyUnavailable();
    if (announcementsResult.error || !announcementsResult.data) return temporarilyUnavailable();

    const guidelines = parseRows(guidelinesResult.data);
    const announcements = parseRows(announcementsResult.data);
    if (!guidelines || !announcements) return temporarilyUnavailable();

    return { kind: "success", guidelines, announcements };
  } catch {
    return temporarilyUnavailable();
  }
}
