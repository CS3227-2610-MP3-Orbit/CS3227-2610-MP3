import { Megaphone } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { listPublishedAnnouncements } from "@/features/shared/announcements/server";

/**
 * ADM-03-R9/R10: one shared "Guidelines and announcements" reader card, used on both the
 * Student and the Lecturer dashboards (src/app/student/page.tsx, src/app/lecturer/page.tsx) --
 * same component, same data, same order: every published guideline, then up to 5 newest
 * published announcements, both newest-first (listPublishedAnnouncements already returns them
 * in that order; this component only concatenates the two arrays, guidelines first).
 *
 * ADM-03-R8: title and body are always rendered as plain text, with line breaks preserved via
 * `whitespace-pre-wrap` -- never through React's raw-HTML-injection prop, a Markdown renderer,
 * or any other HTML-interpreting path. An admin-entered script/HTML-bearing title or body
 * therefore always displays as inert literal text here.
 */
export async function AnnouncementsCard() {
  const result = await listPublishedAnnouncements();
  const items = result.kind === "success" ? [...result.guidelines, ...result.announcements] : [];

  return (
    <section
      aria-labelledby="guidelines-and-announcements"
      className="space-y-4 rounded-xl border bg-card p-4 sm:p-6"
    >
      <h2 id="guidelines-and-announcements" className="text-xl font-semibold">
        Guidelines and announcements
      </h2>
      {result.kind !== "success" ? (
        <p role="alert" className="text-sm text-muted-foreground">
          Guidelines and announcements are temporarily unavailable. Please retry.
        </p>
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} message="No guidelines or announcements yet." />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border bg-background p-3">
              <h3 className="font-semibold break-words">{item.title}</h3>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
