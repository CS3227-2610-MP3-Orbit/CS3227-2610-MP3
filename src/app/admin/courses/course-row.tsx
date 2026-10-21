"use client";

import { courseStatusLabel } from "@/features/admin/courses/presentation";
import type { Course } from "@/features/admin/courses/validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { statusBadgeVariant } from "@/lib/status-badge";

import { useCourseRowController } from "./use-course-row";

const selectClass =
  "mt-1 h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * SH-07-R14: the card presentation of one course, shown below `md`. Same row data, status
 * pill, lecturer list, and actions as `CourseTableRow` -- both drive
 * `useCourseRowController`. `role="group"`/`aria-label={course.code}` lets a test locator
 * match whichever layout is on screen (SH-07-AC17).
 */
export default function CourseRow({
  course,
  eligibleLecturers,
}: {
  course: Course;
  eligibleLecturers: { id: string; label: string }[];
}) {
  const {
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
  } = useCourseRowController(course, eligibleLecturers);

  return (
    <li role="group" aria-label={course.code} className="min-w-0 rounded-xl border bg-card p-4">
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
        <Badge variant={statusBadgeVariant(course.isActive ? "active" : "deactivated")}>
          {courseStatusLabel(course)}
        </Badge>
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
              onClick={cancelEdit}
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
