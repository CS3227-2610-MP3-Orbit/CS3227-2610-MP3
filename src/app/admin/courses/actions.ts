"use server";

import { requireRole } from "@/lib/auth/session";
import {
  assignLecturer,
  createCourse,
  removeAssignment,
  setCourseActive,
  updateCourse,
} from "@/features/admin/courses/server";

// Every action re-checks requireRole("admin") here, even though each delegated server.ts
// function checks it again internally -- the same defense-in-depth pattern already used by
// src/app/admin/accounts/actions.ts, so a direct call to either layer is refused on its own.

export async function createCourseAction(formData: FormData) {
  await requireRole("admin");
  return createCourse(formData);
}

export async function updateCourseAction(input: unknown) {
  await requireRole("admin");
  return updateCourse(input);
}

export async function setCourseActiveAction(input: unknown) {
  await requireRole("admin");
  return setCourseActive(input);
}

export async function assignLecturerAction(input: unknown) {
  await requireRole("admin");
  return assignLecturer(input);
}

export async function removeAssignmentAction(input: unknown) {
  await requireRole("admin");
  return removeAssignment(input);
}
