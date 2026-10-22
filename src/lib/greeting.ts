export type GreetingPeriod = "morning" | "afternoon" | "evening";

const MINUTES_PER_DAY = 24 * 60;
const SGT_OFFSET_MINUTES = 8 * 60; // Asia/Singapore is UTC+8 year-round (no DST).

/**
 * SH-07-R12 / SH-07-AC14: the Singapore-time (SGT) time-of-day bucket for a given instant.
 * Pure and unit-testable -- callers pass the current time explicitly rather than this function
 * reading the clock itself. Boundaries (owner-confirmed 2026-10-21): 05:00-11:59 morning,
 * 12:00-17:59 afternoon, 18:00-04:59 evening.
 */
export function timeOfDayInSingapore(date: Date): GreetingPeriod {
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const sgtMinutes =
    (((utcMinutes + SGT_OFFSET_MINUTES) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const sgtHour = Math.floor(sgtMinutes / 60);
  if (sgtHour >= 5 && sgtHour < 12) return "morning";
  if (sgtHour >= 12 && sgtHour < 18) return "afternoon";
  return "evening";
}

const GREETING_BY_PERIOD: Record<GreetingPeriod, string> = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
};

/** SH-07-R12: "Good morning/afternoon/evening, {fullName}" for a role dashboard's header. */
export function greetingFor(date: Date, fullName: string): string {
  return `${GREETING_BY_PERIOD[timeOfDayInSingapore(date)]}, ${fullName}`;
}
