import type { Course } from "./validation";

/**
 * Lecturer ids already actively assigned to a course, for disabling them in the per-row
 * "assign lecturer" picker -- presentation-only: admin_assign_lecturer still refuses a
 * duplicate active pair server-side (ADM-02-R4) regardless of what this picker offers.
 */
export function assignedLecturerIds(course: Pick<Course, "lecturers">): Set<string> {
  return new Set(course.lecturers.map((lecturer) => lecturer.lecturerId));
}

/** Badge text for a course's active/inactive state (ADM-02-R3). */
export function courseStatusLabel(course: Pick<Course, "isActive">): "Active" | "Deactivated" {
  return course.isActive ? "Active" : "Deactivated";
}
