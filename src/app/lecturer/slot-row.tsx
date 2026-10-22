"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { deleteSlot, updateSlot, type ActionResult } from "./actions";

type Course = { id: string; code: string; name: string };
type Slot = {
  id: string;
  course_id: string;
  starts_at: string;
  ends_at: string;
  courses: { code: string; name: string } | { code: string; name: string }[] | null;
};

const initial: ActionResult = { ok: false, message: "" };
const inputClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function singaporeParts(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour").replace("24", "00")}:${get("minute")}`,
  };
}

function courseDetails(slot: Slot) {
  return Array.isArray(slot.courses) ? slot.courses[0] : slot.courses;
}

export function SlotRow({ slot, courses }: { slot: Slot; courses: Course[] }) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    (_previousState: ActionResult, formData: FormData) => updateSlot(formData),
    initial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    (_previousState: ActionResult, formData: FormData) => deleteSlot(formData),
    initial,
  );
  const start = singaporeParts(slot.starts_at);
  const end = singaporeParts(slot.ends_at);
  const course = courses.find((item) => item.id === slot.course_id) ?? courseDetails(slot);

  return (
    <li className="rounded-lg border bg-card p-3">
      {editing ? (
        <form action={updateAction} className="grid gap-3" aria-label={`Edit slot ${slot.id}`}>
          <input type="hidden" name="slotId" value={slot.id} />
          <Label className="font-normal">
            Course
            <select name="courseId" required defaultValue={slot.course_id} className={inputClass}>
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
          </Label>
          <Label className="font-normal">
            Date
            <input
              name="date"
              type="date"
              required
              defaultValue={start.date}
              className={inputClass}
            />
          </Label>
          <Label className="font-normal">
            Start time
            <input
              name="startTime"
              type="time"
              required
              defaultValue={start.time}
              className={inputClass}
            />
          </Label>
          <Label className="font-normal">
            End time
            <input
              name="endTime"
              type="time"
              required
              defaultValue={end.time}
              className={inputClass}
            />
          </Label>
          <div className="flex gap-2">
            <Button type="submit" disabled={updatePending}>
              {updatePending ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
          {updateState.message && (
            <p
              role={updateState.ok ? "status" : "alert"}
              className={updateState.ok ? "text-sm text-primary" : "text-sm text-destructive"}
            >
              {updateState.message}
            </p>
          )}
        </form>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">
              {course ? `${course.code} — ${course.name}` : "Course unavailable"}
            </p>
            <p>
              {new Date(slot.starts_at).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })} —{" "}
              {new Date(slot.ends_at).toLocaleTimeString("en-SG", {
                timeZone: "Asia/Singapore",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <form action={deleteAction}>
              <input type="hidden" name="slotId" value={slot.id} />
              <Button variant="destructive" type="submit" disabled={deletePending}>
                {deletePending ? "Deleting…" : "Delete"}
              </Button>
            </form>
          </div>
        </div>
      )}
      {!editing && deleteState.message && (
        <p
          role={deleteState.ok ? "status" : "alert"}
          className={deleteState.ok ? "mt-3 text-sm text-primary" : "mt-3 text-sm text-destructive"}
        >
          {deleteState.message}
        </p>
      )}
    </li>
  );
}
