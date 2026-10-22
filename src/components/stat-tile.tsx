import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EYEBROW_CLASS, STAT_VALUE_CLASS } from "@/lib/eyebrow";
import { cn } from "@/lib/utils";

/**
 * Polish pass on SH-07-R12's stat tile: a small coloured icon chip and a subtle tinted card
 * accent, built only from existing token-based classes (no raw colour, so `check:colors` stays
 * clean). `tone` just picks which semantic token tints the chip -- it carries no meaning beyond
 * "a colour to look at", unlike `src/lib/status-badge.ts`'s status->variant mapping.
 */
const TONE_CLASSES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  secondary: "bg-secondary text-secondary-foreground",
} as const;

export type StatTileTone = keyof typeof TONE_CLASSES;

/**
 * SH-07-R12: one tile in a role dashboard's stat-tile row. `value` is a plain count the page
 * already fetched from an existing server function -- `null` renders a dash rather than a
 * wrong number when that function's own result wasn't a success (SH-07-R12 adds no new query
 * and no new way for a tile to show data the page couldn't already show).
 *
 * The label and value stay exactly two sibling `<p>` elements inside one inner wrapper (same
 * shape as before this pass) -- `admin-courses.spec.ts`'s
 * `getByText("Active courses").locator("..").locator("p").nth(1)` reads the value this way, so
 * the icon chip is a separate flex sibling rather than a wrapper around the text block.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "primary",
  className,
}: {
  label: string;
  value: number | null;
  icon: LucideIcon;
  tone?: StatTileTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-4",
        tone === "primary" && "bg-primary/5",
        tone === "success" && "bg-success/5",
        tone === "warning" && "bg-warning/5",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          TONE_CLASSES[tone],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className={cn(EYEBROW_CLASS, "text-muted-foreground")}>{label}</p>
        <p className={cn(STAT_VALUE_CLASS, "mt-1")}>{value === null ? "—" : value}</p>
      </div>
    </div>
  );
}

export function StatTileRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
