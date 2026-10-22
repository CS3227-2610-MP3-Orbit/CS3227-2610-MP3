import { submitLecturerBriefing } from "@/app/lecturer/briefing-actions";

export function BriefingButton({ bookingId }: { bookingId: string }) {
  return (
    <form action={submitLecturerBriefing} className="mt-3 space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <button type="submit" className="rounded border px-3 py-1">
        Generate AI briefing
      </button>
    </form>
  );
}
