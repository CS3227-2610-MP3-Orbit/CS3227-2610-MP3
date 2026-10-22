import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Polish pass on each role dashboard's quick-action `Link`s: the same navigation, same
 * destination, same accessible name (the icon is `aria-hidden`, so the link's name is still
 * exactly `label`, e.g. "Manage courses" -- `admin-courses.spec.ts` clicks it by that name),
 * now a small icon card instead of a plain filled button.
 */
export function QuickActionCard({
  href,
  icon: Icon,
  label,
  className,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-4 font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
      >
        <Icon className="size-4" />
      </span>
      {label}
    </Link>
  );
}
