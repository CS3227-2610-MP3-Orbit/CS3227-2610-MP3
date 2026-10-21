import Link from "next/link";

import { requireRole } from "@/lib/auth/session";
import { getBookingReport } from "@/features/admin/reports/server";
import { isBoundedPeriod, isValidIsoDate, presetPeriod } from "@/features/admin/reports/period";
import { statusLabel } from "@/features/admin/reports/presentation";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import SummaryPanel from "./summary-panel";

type RawSearchParams = { [key: string]: string | string[] | undefined };
type Preset = "7" | "30" | "custom";

function pick(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

const selectClass =
  "mt-1 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ResolvedPeriod =
  | { ok: true; preset: Preset; startDate: string; endDate: string }
  | { ok: false; preset: Preset; start: string; end: string };

// ADM-04-R1/AC1: "Last 7/30 days" is resolved server-side from the trusted SGT calendar; a
// custom range is refused (not silently clamped) when it fails the same 92-day/end>=start bound
// the RPC itself enforces.
function resolvePeriod(params: RawSearchParams): ResolvedPeriod {
  const start = pick(params, "start") ?? "";
  const end = pick(params, "end") ?? "";
  const presetParam = pick(params, "preset");
  // An explicit preset always wins, even if the start/end fields still carry a previous
  // submission's values (the period bar always renders them, whichever preset is selected) --
  // only an entirely absent preset param (e.g. an old "?start=&end=" link) falls back to
  // inferring "custom" from their presence, defaulting to "7" otherwise.
  const preset: Preset =
    presetParam === "30"
      ? "30"
      : presetParam === "custom"
        ? "custom"
        : presetParam === "7"
          ? "7"
          : start || end
            ? "custom"
            : "7";

  if (preset === "custom") {
    if (
      isValidIsoDate(start) &&
      isValidIsoDate(end) &&
      isBoundedPeriod({ startDate: start, endDate: end })
    ) {
      return { ok: true, preset, startDate: start, endDate: end };
    }
    return { ok: false, preset, start, end };
  }
  return { ok: true, preset, ...presetPeriod(preset) };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const resolved = resolvePeriod(params);
  const result = resolved.ok
    ? await getBookingReport({ startDate: resolved.startDate, endDate: resolved.endDate })
    : null;

  return (
    <div className="min-w-0 space-y-8">
      <header>
        <Link
          href="/admin"
          className="text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">Reports</h1>
      </header>

      <form
        action="/admin/reports"
        method="get"
        className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-4"
        aria-label="Choose reporting period"
      >
        <div>
          <Label htmlFor="preset">Period</Label>
          <select id="preset" name="preset" defaultValue={resolved.preset} className={selectClass}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
        <div>
          <Label htmlFor="start">Start date</Label>
          <Input
            id="start"
            name="start"
            type="date"
            defaultValue={resolved.ok ? resolved.startDate : resolved.start}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="end">End date</Label>
          <Input
            id="end"
            name="end"
            type="date"
            defaultValue={resolved.ok ? resolved.endDate : resolved.end}
            className="mt-1"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className={buttonVariants({ variant: "default" })}>
            Apply
          </button>
        </div>
      </form>

      {!resolved.ok && (
        <p role="alert" className="rounded-lg border border-destructive/50 p-4">
          Please choose an end date on or after the start date, within a 92-day span.
        </p>
      )}

      {resolved.ok && result && (
        <section aria-live="polite" aria-busy="false" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Showing {resolved.startDate} to {resolved.endDate} (Asia/Singapore days).
          </p>

          {result.kind === "temporarily_unavailable" && (
            <div role="alert" className="rounded-lg border border-destructive p-4">
              <p>Reports are temporarily unavailable. Please retry.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reference: {result.correlationId}
              </p>
            </div>
          )}
          {result.kind === "forbidden_or_not_found" && (
            <p role="alert" className="rounded-lg border border-destructive p-4">
              This information is not available to your account.
            </p>
          )}
          {result.kind === "validation_error" && (
            <p role="alert" className="rounded-lg border border-destructive/50 p-4">
              Please correct the period and try again.
            </p>
          )}

          {result.kind === "success" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Total bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{result.totalBookings}</p>
                </CardContent>
              </Card>

              <div>
                <h2 className="text-lg font-semibold">By status</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.byStatus.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell>{statusLabel(row.status)}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h2 className="text-lg font-semibold">By course</h2>
                {result.byCourse.length === 0 ? (
                  <p role="status" className="mt-1 text-sm text-muted-foreground">
                    No courses have bookings in this period.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.byCourse.map((row) => (
                        <TableRow key={row.courseId}>
                          <TableCell>
                            {row.code} — {row.name}
                          </TableCell>
                          <TableCell className="text-right">{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold">By lecturer</h2>
                {result.byLecturer.length === 0 ? (
                  <p role="status" className="mt-1 text-sm text-muted-foreground">
                    No lecturers have bookings in this period.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lecturer</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.byLecturer.map((row) => (
                        <TableRow key={row.lecturerId}>
                          <TableCell>{row.lecturerName || "(no name)"}</TableCell>
                          <TableCell className="text-right">{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold">By day</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.byDay.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <SummaryPanel startDate={resolved.startDate} endDate={resolved.endDate} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
