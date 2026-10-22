import "server-only";

import { randomUUID } from "node:crypto";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import {
  assignLecturerInputSchema,
  assignLecturerResultSchema,
  boundedInput,
  createCourseInputSchema,
  createCourseResultSchema,
  fieldSchema,
  listCoursesInputSchema,
  listCoursesResultSchema,
  removeAssignmentInputSchema,
  removeAssignmentResultSchema,
  setCourseActiveInputSchema,
  setCourseActiveResultSchema,
  updateCourseInputSchema,
  updateCourseResultSchema,
  type AssignLecturerResult,
  type CourseField,
  type CreateCourseResult,
  type ListCoursesResult,
  type RemoveAssignmentResult,
  type SetCourseActiveResult,
  type UpdateCourseResult,
} from "./validation";

// ADM-02-R9: no function in this module calls a model, builds a prompt, or writes ai_usage --
// every path below only ever calls one of the six admin_* course/assignment RPCs over the
// caller's own session.

function temporarilyUnavailable(): { kind: "temporarily_unavailable"; correlationId: string } {
  return { kind: "temporarily_unavailable", correlationId: randomUUID() };
}
function invalid(path?: PropertyKey): { kind: "validation_error"; field: CourseField } {
  const field = fieldSchema.safeParse(path);
  return { kind: "validation_error", field: field.success ? field.data : "request" };
}

/** ADM-02-R1/R8: create a course. */
export async function createCourse(raw: unknown): Promise<CreateCourseResult> {
  await requireRole("admin");
  const input = createCourseInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_create_course", { p_code: input.data.code, p_name: input.data.name })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && createCourseResultSchema.safeParse(data).success
      ? createCourseResultSchema.parse(data)
      : temporarilyUnavailable();
  } catch {
    return temporarilyUnavailable();
  }
}

/** ADM-02-R2/R8: edit an existing course's code/name. */
export async function updateCourse(raw: unknown): Promise<UpdateCourseResult> {
  await requireRole("admin");
  const input = updateCourseInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_update_course", {
        p_course_id: input.data.courseId,
        p_code: input.data.code,
        p_name: input.data.name,
      })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && updateCourseResultSchema.safeParse(data).success
      ? updateCourseResultSchema.parse(data)
      : temporarilyUnavailable();
  } catch {
    return temporarilyUnavailable();
  }
}

/** ADM-02-R3/R8: deactivate or reactivate a course. Preserves the row and every dependent
 * assignment, slot, and booking; browse_available_slots' own "c.is_active" join is the only
 * read-side effect (no new read logic is added here). */
export async function setCourseActive(raw: unknown): Promise<SetCourseActiveResult> {
  await requireRole("admin");
  const input = setCourseActiveInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_set_course_active", {
        p_course_id: input.data.courseId,
        p_active: input.data.isActive,
      })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && setCourseActiveResultSchema.safeParse(data).success
      ? setCourseActiveResultSchema.parse(data)
      : temporarilyUnavailable();
  } catch {
    return temporarilyUnavailable();
  }
}

/** ADM-02-R7/R8: list/search/filter courses with their current (active) lecturer(s). */
export async function listCourses(raw: unknown): Promise<ListCoursesResult> {
  await requireRole("admin");
  const input = listCoursesInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_list_courses", {
        p_query: input.data.query ?? null,
        p_active: input.data.activeFilter ?? null,
      })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && listCoursesResultSchema.safeParse(data).success
      ? listCoursesResultSchema.parse(data)
      : temporarilyUnavailable();
  } catch {
    return temporarilyUnavailable();
  }
}

/** ADM-02-R4/R8: assign an active lecturer-role account to an active course. */
export async function assignLecturer(raw: unknown): Promise<AssignLecturerResult> {
  await requireRole("admin");
  const input = assignLecturerInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_assign_lecturer", {
        p_course_id: input.data.courseId,
        p_lecturer_id: input.data.lecturerId,
      })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && assignLecturerResultSchema.safeParse(data).success
      ? assignLecturerResultSchema.parse(data)
      : temporarilyUnavailable();
  } catch {
    return temporarilyUnavailable();
  }
}

/** ADM-02-R5/R8: remove (end) an assignment. Never deletes: sets is_active/ended_at, which is
 * exactly the transition the existing course_assignment_deactivation_notice trigger listens
 * for, so affected approved bookings' student and lecturer continue to be notified. */
export async function removeAssignment(raw: unknown): Promise<RemoveAssignmentResult> {
  await requireRole("admin");
  const input = removeAssignmentInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("admin_remove_assignment", { p_assignment_id: input.data.assignmentId })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && removeAssignmentResultSchema.safeParse(data).success
      ? removeAssignmentResultSchema.parse(data)
      : temporarilyUnavailable();
  } catch {
    return temporarilyUnavailable();
  }
}
