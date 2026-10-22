"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { assignedLecturerIds } from "@/features/admin/courses/presentation";
import type { Course } from "@/features/admin/courses/validation";

import {
  assignLecturerAction,
  removeAssignmentAction,
  setCourseActiveAction,
  updateCourseAction,
} from "./actions";

export function describeCourseMutateFailure(kind: string): string {
  switch (kind) {
    case "conflict_duplicate_code":
      return "A course with that code already exists (active or deactivated).";
    case "conflict_duplicate_assignment":
      return "That lecturer is already currently assigned to this course.";
    case "course_not_found":
      return "This course is no longer available.";
    case "course_inactive":
      return "Reactivate this course before assigning a lecturer.";
    case "lecturer_not_found":
      return "That account is no longer available.";
    case "lecturer_inactive":
      return "That lecturer account is deactivated.";
    case "lecturer_wrong_role":
      return "That account does not have the lecturer role.";
    case "forbidden_or_not_found":
      return "This item is no longer available.";
    case "validation_error":
      return "Please correct the highlighted value and try again.";
    default:
      return "This action is temporarily unavailable. Please retry.";
  }
}

/**
 * ADM-02 / SH-07-R14: the edit/activate/assign/remove controller shared by the table-row
 * (>= md) and card (< md) presentations of one course, so both layouts drive the exact same
 * server actions and failure/success messages.
 */
export function useCourseRowController(
  course: Course,
  eligibleLecturers: { id: string; label: string }[],
) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(course.code);
  const [name, setName] = useState(course.name);
  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const assigned = assignedLecturerIds(course);
  const assignable = eligibleLecturers.filter((lecturer) => !assigned.has(lecturer.id));

  function saveEdit() {
    setMessage("");
    startTransition(async () => {
      const result = await updateCourseAction({ courseId: course.id, code, name });
      if (result.kind === "success") {
        setMessage("Course updated.");
        setEditing(false);
        router.refresh();
      } else {
        setMessage(describeCourseMutateFailure(result.kind));
      }
    });
  }

  function cancelEdit() {
    setCode(course.code);
    setName(course.name);
    setEditing(false);
  }

  function toggleActive() {
    setMessage("");
    startTransition(async () => {
      const result = await setCourseActiveAction({
        courseId: course.id,
        isActive: !course.isActive,
      });
      if (result.kind === "success") {
        setMessage(result.isActive ? "Course activated." : "Course deactivated.");
        router.refresh();
      } else {
        setMessage(describeCourseMutateFailure(result.kind));
      }
    });
  }

  function assign() {
    if (!selectedLecturer) return;
    setMessage("");
    startTransition(async () => {
      const result = await assignLecturerAction({
        courseId: course.id,
        lecturerId: selectedLecturer,
      });
      if (result.kind === "success") {
        setMessage("Lecturer assigned.");
        setSelectedLecturer("");
        router.refresh();
      } else {
        setMessage(describeCourseMutateFailure(result.kind));
      }
    });
  }

  function remove(assignmentId: string) {
    setMessage("");
    startTransition(async () => {
      const result = await removeAssignmentAction({ assignmentId });
      if (result.kind === "success") {
        setMessage("Assignment removed.");
        router.refresh();
      } else {
        setMessage(describeCourseMutateFailure(result.kind));
      }
    });
  }

  return {
    editing,
    setEditing,
    code,
    setCode,
    name,
    setName,
    selectedLecturer,
    setSelectedLecturer,
    message,
    pending,
    assignable,
    saveEdit,
    cancelEdit,
    toggleActive,
    assign,
    remove,
  };
}
