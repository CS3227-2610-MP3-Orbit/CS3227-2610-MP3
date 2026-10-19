import { z } from "zod";

export const slotInputSchema = z.object({
  courseId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export type SlotInput = z.infer<typeof slotInputSchema>;

/** Converts a Singapore wall-clock value to an instant without using server locale. */
export function singaporeDateTime(date: string, time: string): Date | null {
  const parsed = slotInputSchema.shape.date.safeParse(date);
  const timeParsed = slotInputSchema.shape.startTime.safeParse(time);
  if (!parsed.success || !timeParsed.success) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const singaporeParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(candidate);
  const values = Object.fromEntries(singaporeParts.map((part) => [part.type, part.value]));
  const displayed = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute));
  return new Date(candidate.getTime() - (displayed - candidate.getTime()));
}

export function validateSlotInput(input: SlotInput, now = new Date()) {
  const parsed = slotInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Enter a valid course, date, and time." };
  const start = singaporeDateTime(input.date, input.startTime);
  const end = singaporeDateTime(input.date, input.endTime);
  if (!start || !end || start >= end) return { ok: false as const, message: "The end time must be after the start time." };
  if (start.getTime() - now.getTime() < 60 * 60 * 1000) return { ok: false as const, message: "Slots must be created at least one hour before they start." };
  return { ok: true as const, start, end };
}

export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}
