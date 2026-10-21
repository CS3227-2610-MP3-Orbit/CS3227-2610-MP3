import type { ReactNode } from "react";

import { EYEBROW_CLASS, STAT_VALUE_CLASS } from "@/lib/eyebrow";
import { cn } from "@/lib/utils";

/**
 * SH-07-R12: one tile in a role dashboard's stat-tile row. `value` is a plain count the page
 * already fetched from an existing server function -- `null` renders a dash rather than a
 * wrong number when that function's own result wasn't a success (SH-07-R12 adds no new query
 * and no new way for a tile to show data the page couldn't already show).
 */
export function StatTile({
  label,
  value,
  className,
}: {
  label: string;
  value: number | null;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <p className={cn(EYEBROW_CLASS, "text-muted-foreground")}>{label}</p>
      <p className={cn(STAT_VALUE_CLASS, "mt-1")}>{value === null ? "—" : value}</p>
    </div>
  );
}

export function StatTileRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
