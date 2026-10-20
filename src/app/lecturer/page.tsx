import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listLecturerRequests } from "@/features/lecturer/requests-server";
import { SlotForm } from "./slot-form";
import { deleteSlot } from "./actions";
import { RequestCard } from "./request-card";

export default async function LecturerDashboardPage() {
  const user = await requireRole("lecturer");
  const supabase = await createClient();
  const [{ data: courses }, { data: slots }, requests] = await Promise.all([
    supabase.from("courses").select("id, code, name").order("code"),
    supabase
      .from("consultation_slots")
      .select("id, course_id, starts_at, ends_at, courses(code, name)")
      .eq("lecturer_id", user.id)
      .order("starts_at"),
    listLecturerRequests(),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Lecturer dashboard</h1>
        <p className="mt-2 text-sm">
          Consultation availability uses Singapore time. Slots must be created at least one hour
          before they start.
        </p>
        <SlotForm courses={(courses ?? []) as { id: string; code: string; name: string }[]} />
        <h2 className="mt-8 font-semibold">Your consultation slots</h2>
        {!slots?.length ? (
          <p className="mt-2 text-sm">No consultation slots yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {slots.map((slot) => (
              <li key={slot.id} className="flex items-center justify-between rounded border p-3">
                <span>
                  {new Date(slot.starts_at).toLocaleString("en-SG", {
                    timeZone: "Asia/Singapore",
                  })}{" "}
                  –{" "}
                  {new Date(slot.ends_at).toLocaleTimeString("en-SG", {
                    timeZone: "Asia/Singapore",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <form
                  action={async (formData) => {
                    await deleteSlot(formData);
                  }}
                >
                  <input type="hidden" name="slotId" value={slot.id} />
                  <button className="text-red-700 underline" type="submit">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Consultation requests</h2>
        {requests.kind === "success" ? (
          requests.requests.length ? (
            <ul className="mt-3 space-y-3">
              {requests.requests.map((request) => (
                <RequestCard key={request.bookingId} request={request} />
              ))}
            </ul>
          ) : (
            <p role="status" className="mt-2">
              No pending consultation requests.
            </p>
          )
        ) : (
          <p role="alert" className="mt-2">
            Requests are temporarily unavailable. Please retry.
          </p>
        )}
      </section>
    </div>
  );
}
