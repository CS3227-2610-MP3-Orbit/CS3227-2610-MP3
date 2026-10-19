"use client";

import { useActionState } from "react";
import { createSlot } from "./actions";

const initial = { ok: false, message: "" };

export function SlotForm({ courses }: { courses: { id: string; code: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createSlot, initial);
  return <form action={action} className="mt-6 grid gap-3 rounded border p-4" aria-label="Create consultation slot">
    <h2 className="font-semibold">Create consultation slot</h2>
    <label>Course<select name="courseId" required className="ml-2 border p-1"><option value="">Select course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} — {course.name}</option>)}</select></label>
    <label>Date<input name="date" type="date" required className="ml-2 border p-1" /></label>
    <label>Start time<input name="startTime" type="time" required className="ml-2 border p-1" /></label>
    <label>End time<input name="endTime" type="time" required className="ml-2 border p-1" /></label>
    <button disabled={pending} className="w-fit rounded bg-black px-3 py-1 text-white disabled:opacity-50">{pending ? "Saving…" : "Create slot"}</button>
    {state.message && <p role="status" className={state.ok ? "text-green-700" : "text-red-700"}>{state.message}</p>}
  </form>;
}
