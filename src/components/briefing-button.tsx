"use client";

import { useActionState } from "react";
import { type BriefingResult } from "@/features/lecturer/ai-briefing";
import { submitLecturerBriefing } from "@/app/lecturer/briefing-actions";

const initial: BriefingResult = { kind: "idle" };

export function BriefingButton({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(submitLecturerBriefing, initial);
  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <button type="submit" disabled={pending} className="rounded border px-3 py-1">
        {pending ? "Generating briefing…" : "Generate AI briefing"}
      </button>
      {state.kind === "success" && (
        <pre className="whitespace-pre-wrap" role="status">
          {state.text}
        </pre>
      )}
      {state.kind === "error" && <p role="alert">{state.message}</p>}
    </form>
  );
}
