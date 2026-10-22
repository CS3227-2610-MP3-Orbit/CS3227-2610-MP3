"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useFormStatus } from "react-dom";

import { submitLecturerBriefing } from "@/app/lecturer/briefing-actions";
import { Button } from "@/components/ui/button";

// LEC-04-AC8: a briefing can take up to the 20-second SoC LLM timeout, so the button shows that
// it is working and cannot be clicked again while its request is in flight.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <Sparkles aria-hidden="true" />
        )}
        {pending ? "Generating briefing…" : "Generate AI briefing"}
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {pending ? "Generating the briefing. This can take up to 20 seconds." : ""}
      </p>
    </>
  );
}

export function BriefingButton({ bookingId }: { bookingId: string }) {
  return (
    <form action={submitLecturerBriefing} className="mt-3 space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <SubmitButton />
    </form>
  );
}
