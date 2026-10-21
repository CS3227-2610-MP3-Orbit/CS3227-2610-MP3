import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Polish pass on SH-07-R15's empty states: a bigger icon in a tinted circle and, where the
 * page already has a relevant action, a visible link/button under the message. `message` is
 * always the exact pre-existing empty-state text, rendered as the one `role="status"` node in
 * its pre-existing place -- this component only changes presentation around it, never the text
 * or the role/placement an existing test may query by (SH-07-R5/AC8).
 */
export function EmptyState({
  icon: Icon,
  message,
  action,
  className,
}: {
  icon: LucideIcon;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-xl border bg-card p-6", className)}>
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Icon className="size-5" />
      </span>
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
      {action}
    </div>
  );
}
