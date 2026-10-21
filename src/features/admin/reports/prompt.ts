// ADM-04-R5: the prompt builder is kept separate from I/O (server.ts), per the spec's technical
// constraints. It is pure: given the two already-fetched report summaries, it returns the exact
// string sent as `generateText`'s `input`. It never receives, and so can never leak, any field
// admin_get_booking_report does not return (no student id/name/topic/questions/rejection_reason).

import { UNTRUSTED_DATA_RULE, wrapUntrusted } from "@/lib/ai/untrusted";

import type { CourseCount, LecturerCount, ReportPeriod, StatusCount } from "./validation";

export interface ReportSummaryForPrompt {
  period: ReportPeriod;
  totalBookings: number;
  byStatus: StatusCount[];
  byCourse: CourseCount[];
  byLecturer: LecturerCount[];
}

export const ACTIVITY_SUMMARY_SYSTEM_PROMPT =
  "You summarise administrative booking-activity counts for a university consultation-booking " +
  "system. You are given only aggregate counts and catalogue labels (course codes/names, " +
  "lecturer names) for a shown period and the immediately preceding period of equal length. " +
  "Compare the two periods briefly and note any notable pattern in the counts. Use only the " +
  "numbers and labels given to you; never invent a count, a course, a lecturer, a student, or " +
  "any fact not present in the supplied data. Output plain prose only -- no Markdown, no lists, " +
  "no code fences, no HTML -- in at most a few short sentences. " +
  UNTRUSTED_DATA_RULE;

function renderStatusLines(byStatus: StatusCount[]): string {
  return byStatus.map((row) => `- ${row.status}: ${row.count}`).join("\n");
}

function renderCourseLines(byCourse: CourseCount[]): string {
  if (byCourse.length === 0) return "(no courses with bookings in this period)";
  return byCourse
    .map((row) => `- ${wrapUntrusted("admin.course-name", row.name)} (${row.code}): ${row.count}`)
    .join("\n");
}

function renderLecturerLines(byLecturer: LecturerCount[]): string {
  if (byLecturer.length === 0) return "(no lecturers with bookings in this period)";
  return byLecturer
    .map((row) => `- ${wrapUntrusted("admin.lecturer-name", row.lecturerName)}: ${row.count}`)
    .join("\n");
}

function renderPeriod(label: string, summary: ReportSummaryForPrompt): string {
  return [
    `${label} period: ${summary.period.startDate} to ${summary.period.endDate} (Asia/Singapore days)`,
    `Total bookings: ${summary.totalBookings}`,
    "By status:",
    renderStatusLines(summary.byStatus),
    "By course:",
    renderCourseLines(summary.byCourse),
    "By lecturer:",
    renderLecturerLines(summary.byLecturer),
  ].join("\n");
}

/** ADM-04-R5: the model input is built only from the two already-fetched report summaries. */
export function buildActivitySummaryPrompt(
  current: ReportSummaryForPrompt,
  preceding: ReportSummaryForPrompt,
): string {
  return [renderPeriod("Shown", current), "", renderPeriod("Preceding", preceding)].join("\n");
}
