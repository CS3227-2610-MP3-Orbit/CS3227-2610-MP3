"use client";

import { useActionState } from "react";
import { createSlot } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initial = { ok: false, message: "" };
const selectClass =
  "ml-2 h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const timeClass =
  "ml-2 h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SlotForm({ courses }: { courses: { id: string; code: string; name: string }[] }) {
  const [state, action, pending] = useActionState(
    (_previousState: typeof initial, formData: FormData) => createSlot(formData),
    initial,
  );
  return (
    <form
      action={action}
      className="mt-6 grid gap-3 rounded-lg border bg-card p-4"
      aria-label="Create consultation slot"
    >
      <h2 className="font-semibold">Create consultation slot</h2>
      <Label className="font-normal">
        Course
        <select name="courseId" required className={selectClass}>
          <option value="">Select course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} — {course.name}
            </option>
          ))}
        </select>
      </Label>
      <Label className="font-normal">
        Date
        <input name="date" type="date" required className={timeClass} />
      </Label>
      <Label className="font-normal">
        Start time
        <input name="startTime" type="time" required className={timeClass} />
      </Label>
      <Label className="font-normal">
        End time
        <input name="endTime" type="time" required className={timeClass} />
      </Label>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Create slot"}
      </Button>
      {state.message && (
        <p role="status" className={state.ok ? "text-primary" : "text-destructive"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
