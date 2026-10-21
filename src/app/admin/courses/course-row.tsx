"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { assignedLecturerIds, courseStatusLabel } from "@/features/admin/courses/presentation";
import type { Course } from "@/features/admin/courses/validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  assignLecturerAction,
  removeAssignmentAction,
  setCourseActiveAction,
  updateCourseAction,
} from "./actions";

const selectClass =
  "mt-1 h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
    <li className="min-w-0 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          {editing ? (
            <div className="flex flex-wrap gap-2">
              <div>
                <Label htmlFor={`code-${course.id}`} className="text-xs">
                  Code
                </Label>
                <Input
                  id={`code-${course.id}`}
                  value={code}
                  disabled={pending}
                  onChange={(event) => setCode(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`name-${course.id}`} className="text-xs">
                  Name
                </Label>
                <Input
                  id={`name-${course.id}`}
                  value={name}
                  disabled={pending}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          ) : (
            <>
              <p className="break-words font-semibold">{course.code}</p>
              <p className="break-words text-sm text-muted-foreground">{course.name}</p>
            </>
          )}
        </div>
        <Badge variant={course.isActive ? "default" : "outline"}>{courseStatusLabel(course)}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        {editing ? (
          <>
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={saveEdit}>
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                setCode(course.code);
                setName(course.name);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={toggleActive}>
          {course.isActive ? "Deactivate" : "Reactivate"}
        </Button>
      </div>

      <div role="status" aria-live="polite" className="mt-2 text-sm">
        {pending && <p>Saving…</p>}
        {message}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold">Lecturers</h3>
        {course.lecturers.length === 0 ? (
          <p role="status" className="mt-1 text-sm text-muted-foreground">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => remove(lecturer.assignmentId)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor={`assign-${course.id}`} className="text-xs">
              Assign lecturer
            </Label>
            <select
              id={`assign-${course.id}`}
              value={selectedLecturer}
              disabled={pending || assignable.length === 0}
              onChange={(event) => setSelectedLecturer(event.target.value)}
              className={selectClass}
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !selectedLecturer}
            onClick={assign}
          >
            Assign
          </Button>
        </div>
      </div>
    </li>
  );
}
