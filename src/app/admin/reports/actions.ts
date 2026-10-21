"use server";

import { requireRole } from "@/lib/auth/session";
import { generateActivitySummary, getBookingReport } from "@/features/admin/reports/server";

// Every action re-checks requireRole("admin") here, even though server.ts checks it again
// internally -- the same defense-in-depth pattern already used by
// src/app/admin/courses/actions.ts, so a direct call to either layer is refused on its own.

export async function getBookingReportAction(input: unknown) {
  await requireRole("admin");
  return getBookingReport(input);
}

export async function generateActivitySummaryAction(input: unknown) {
  await requireRole("admin");
  return generateActivitySummary(input);
}
