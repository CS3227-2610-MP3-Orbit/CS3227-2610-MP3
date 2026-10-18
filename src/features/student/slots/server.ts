import "server-only";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import {
  parseBrowseInput,
  type BrowseAvailableSlotsInput,
  type RawBrowseSearchParams,
} from "./validation";

const uuid = z.string().uuid();
const slotSchema = z
  .object({
    slotId: uuid,
    courseId: uuid,
    courseCode: z.string(),
    courseName: z.string(),
    lecturerId: uuid,
    lecturerName: z.string(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
  })
  .strict();
const courseOptionSchema = z.object({ id: uuid, code: z.string(), name: z.string() }).strict();
const lecturerOptionSchema = z.object({ id: uuid, name: z.string() }).strict();
const databaseResponseSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("success"),
      slots: z.array(slotSchema).max(20),
      courses: z.array(courseOptionSchema),
      lecturers: z.array(lecturerOptionSchema),
      nextCursor: z.string().max(512).nullable(),
    })
    .strict(),
  z
    .object({
      status: z.literal("validation_error"),
      field: z.enum(["lecturerId", "courseId", "date", "cursor", "query"]),
    })
    .strict(),
  z.object({ status: z.literal("forbidden_or_not_found") }).strict(),
]);

export type AvailableSlot = z.infer<typeof slotSchema>;
export type CourseOption = z.infer<typeof courseOptionSchema>;
export type LecturerOption = z.infer<typeof lecturerOptionSchema>;

export type BrowseAvailableSlotsResult =
  | {
      status: "success";
      input: BrowseAvailableSlotsInput;
      slots: AvailableSlot[];
      courses: CourseOption[];
      lecturers: LecturerOption[];
      nextCursor: string | null;
    }
  | {
      status: "validation_error";
      field: string;
      message: string;
      input?: BrowseAvailableSlotsInput;
    }
  | { status: "temporarily_unavailable"; correlationId: string; input?: BrowseAvailableSlotsInput }
  | { status: "forbidden_or_not_found" };

const DATABASE_VALIDATION_MESSAGES: Record<string, string> = {
  lecturerId: "Select a valid lecturer.",
  courseId: "Select a valid course.",
  date: "Enter a real date in YYYY-MM-DD format.",
  cursor: "This page link is no longer valid. Restart from the first page.",
  query: "The filter request is invalid.",
};

function temporaryFailure(input?: BrowseAvailableSlotsInput): BrowseAvailableSlotsResult {
  const correlationId = randomUUID();
  console.error("student-slot-browse-failure", {
    category: "temporarily_unavailable",
    correlationId,
  });
  return { status: "temporarily_unavailable", correlationId, input };
}

/** Protected, typed server boundary for all Student slot-browse database access. */
export async function browseAvailableSlots(
  raw: RawBrowseSearchParams,
): Promise<BrowseAvailableSlotsResult> {
  await requireRole("student");

  const parsedInput = parseBrowseInput(raw);
  if (!parsedInput.ok) {
    return {
      status: "validation_error",
      field: parsedInput.field,
      message: parsedInput.message,
      input: parsedInput.input,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("browse_available_slots", {
      p_lecturer_id: parsedInput.input.lecturerId ?? null,
      p_course_id: parsedInput.input.courseId ?? null,
      p_date: parsedInput.input.date ?? null,
      p_cursor: parsedInput.input.cursor ?? null,
    });
    if (error) return temporaryFailure(parsedInput.input);

    const response = databaseResponseSchema.safeParse(data);
    if (!response.success) return temporaryFailure(parsedInput.input);
    if (response.data.status === "forbidden_or_not_found") return response.data;
    if (response.data.status === "validation_error") {
      return {
        status: "validation_error",
        field: response.data.field,
        message: DATABASE_VALIDATION_MESSAGES[response.data.field],
        input: parsedInput.input,
      };
    }
    return { ...response.data, input: parsedInput.input };
  } catch {
    return temporaryFailure(parsedInput.input);
  }
}
