import type { Announcement } from "./validation";

/** Badge text for an item's published/draft state (ADM-03-R3). */
export function announcementStatusLabel(
  item: Pick<Announcement, "isPublished">,
): "Published" | "Draft" {
  return item.isPublished ? "Published" : "Draft";
}

/** Human-readable label for the "kind" category (ADM-03-R1). */
export function announcementKindLabel(kind: Announcement["kind"]): "Guideline" | "Announcement" {
  return kind === "guideline" ? "Guideline" : "Announcement";
}

/**
 * A short, single-line preview of an item's body for the admin list (ADM-03-R8: this is a
 * preview only -- the full body, with line breaks preserved via `whitespace-pre-wrap`, is
 * always shown in the edit dialog and on every reader card; this helper never drops a line
 * break by rendering it as HTML, it only truncates plain text for the list row).
 */
export function truncatedAnnouncementBody(body: string, maxLength = 140): string {
  const collapsed = body.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, maxLength).trimEnd()}…`;
}
