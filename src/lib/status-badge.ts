import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge";

export type StatusBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const SUCCESS_STATUSES = new Set(["active", "approved", "completed"]);
const WARNING_STATUSES = new Set(["pending"]);
const DESTRUCTIVE_STATUSES = new Set(["rejected", "cancelled", "deactivated", "error"]);

/**
 * SH-07-R13: the single place that maps an account/course active-state word, a booking or
 * consultation status, or a role to a `Badge` `variant`. Every place that previously rendered
 * one of these as plain text calls this instead of choosing a colour itself: active/approved/
 * completed -> success, pending -> warning, rejected/cancelled/deactivated/error -> destructive,
 * anything else (e.g. a role, or a display-only status like "upcoming"/"ongoing") ->
 * secondary (the existing default/secondary blue-teal).
 */
export function statusBadgeVariant(status: string): StatusBadgeVariant {
  const normalized = status.trim().toLowerCase();
  if (SUCCESS_STATUSES.has(normalized)) return "success";
  if (WARNING_STATUSES.has(normalized)) return "warning";
  if (DESTRUCTIVE_STATUSES.has(normalized)) return "destructive";
  return "secondary";
}
