"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { assignedLecturerIds, courseStatusLabel } from "@/features/admin/courses/presentation";
import type { Course } from "@/features/admin/courses/validation";

import {
  assignLecturerAction,
  removeAssignmentAction,
  setCourseActiveAction,
  updateCourseAction,
} from "./actions";

const control =
  "mt-1 rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2";
const button =
  "rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";

function describeMutateFailure(kind: string): string {
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

export default function CourseRow({
  course,
  eligibleLecturers,
}: {
  course: Course;
  eligibleLecturers: { id: string; label: string }[];
}) {
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
        setMessage(describeMutateFailure(result.kind));
      }
    });
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
        setMessage(describeMutateFailure(result.kind));
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
        setMessage(describeMutateFailure(result.kind));
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
        setMessage(describeMutateFailure(result.kind));
      }
    });
  }

  return (
    <li className="min-w-0 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          {editing ? (
            <div className="flex flex-wrap gap-2">
              <div>
                <label htmlFor={`code-${course.id}`} className="block text-xs font-medium">
                  Code
                </label>
                <input
                  id={`code-${course.id}`}
                  value={code}
                  disabled={pending}
                  onChange={(event) => setCode(event.target.value)}
                  className={control}
                />
              </div>
              <div>
                <label htmlFor={`name-${course.id}`} className="block text-xs font-medium">
                  Name
                </label>
                <input
                  id={`name-${course.id}`}
                  value={name}
                  disabled={pending}
                  onChange={(event) => setName(event.target.value)}
                  className={control}
                />
              </div>
            </div>
          ) : (
            <>
              <p className="break-words font-semibold">{course.code}</p>
              <p className="break-words text-sm text-gray-600">{course.name}</p>
            </>
          )}
        </div>
        <span
          className={
            course.isActive
              ? "rounded-full border border-green-700 px-2 py-1 text-xs font-medium text-green-700"
              : "rounded-full border border-gray-500 px-2 py-1 text-xs font-medium text-gray-600"
          }
        >
          {courseStatusLabel(course)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        {editing ? (
          <>
            <button type="button" disabled={pending} onClick={saveEdit} className={button}>
              Save
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setCode(course.code);
                setName(course.name);
                setEditing(false);
              }}
              className={button}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditing(true)}
            className={button}
          >
            Edit
          </button>
        )}
        <button type="button" disabled={pending} onClick={toggleActive} className={button}>
          {course.isActive ? "Deactivate" : "Reactivate"}
        </button>
      </div>

      <div role="status" aria-live="polite" className="mt-2 text-sm">
        {pending && <p>Saving…</p>}
        {message}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold">Lecturers</h3>
        {course.lecturers.length === 0 ? (
          <p role="status" className="mt-1 text-sm text-gray-600">
            No lecturer currently assigned.
          </p>
        ) : (
          <ul className="mt-1 space-y-1">
            {course.lecturers.map((lecturer) => (
              <li
                key={lecturer.assignmentId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="break-words">{lecturer.lecturerName || "(no name)"}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(lecturer.assignmentId)}
                  className={button}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor={`assign-${course.id}`} className="block text-xs font-medium">
              Assign lecturer
            </label>
            <select
              id={`assign-${course.id}`}
              value={selectedLecturer}
              disabled={pending || assignable.length === 0}
              onChange={(event) => setSelectedLecturer(event.target.value)}
              className={control}
            >
              <option value="">
                {assignable.length === 0 ? "No eligible lecturers" : "Select a lecturer"}
              </option>
              {assignable.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={pending || !selectedLecturer}
            onClick={assign}
            className={button}
          >
            Assign
          </button>
        </div>
      </div>
    </li>
  );
}
