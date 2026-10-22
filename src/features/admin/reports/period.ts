// ADM-04-R1: pure SGT period arithmetic, shared by the reports page (preset resolution) and
// the AI summary action (the preceding equal-length period). No database/network access here --
// kept pure and framework-free so it is trivially unit-testable without mocking "server-only".

export interface PeriodRange {
  startDate: string;
  endDate: string;
}

/** The report's own 92-day bound (ADM-04-R1/R2), mirrored client-side for early refusal. */
export const MAX_REPORT_SPAN_DAYS = 92;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toUtcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** True only for a real calendar date in exactly YYYY-MM-DD form (rejects e.g. 2026-02-30). */
export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = toUtcDate(value);
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Inclusive-day difference: daysBetween("2026-01-01", "2026-01-01") === 0. */
export function daysBetween(startDate: string, endDate: string): number {
  return Math.round((toUtcDate(endDate).getTime() - toUtcDate(startDate).getTime()) / 86_400_000);
}

export function addDaysIso(date: string, days: number): string {
  const utc = toUtcDate(date);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

const SGT_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Singapore",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's calendar date in Asia/Singapore, as YYYY-MM-DD -- never the server host's own zone. */
export function todaySgtIso(now: Date = new Date()): string {
  return SGT_DATE_FORMATTER.format(now);
}

/** ADM-04-R1/AC1: "Last 7/30 days" is today plus the preceding 6/29 SGT days, server-resolved. */
export function presetPeriod(preset: "7" | "30", now: Date = new Date()): PeriodRange {
  const today = todaySgtIso(now);
  const lookbackDays = preset === "30" ? 29 : 6;
  return { startDate: addDaysIso(today, -lookbackDays), endDate: today };
}

/** ADM-04-R1/R2: end >= start and a span of at most 92 SGT days (inclusive of both ends). */
export function isBoundedPeriod(period: PeriodRange): boolean {
  if (!isValidIsoDate(period.startDate) || !isValidIsoDate(period.endDate)) return false;
  return (
    period.endDate >= period.startDate &&
    daysBetween(period.startDate, period.endDate) + 1 <= MAX_REPORT_SPAN_DAYS
  );
}

/** ADM-04-R5: the equal-length period immediately preceding the shown one, for comparison. */
export function precedingPeriod(period: PeriodRange): PeriodRange {
  const spanDays = daysBetween(period.startDate, period.endDate) + 1;
  const precedingEnd = addDaysIso(period.startDate, -1);
  return { startDate: addDaysIso(precedingEnd, -(spanDays - 1)), endDate: precedingEnd };
}
