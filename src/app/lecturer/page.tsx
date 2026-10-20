import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ConsultationList } from "@/components/consultation-list";
import { listStaffConsultations } from "@/features/lecturer/consultations/server";
import { SlotForm } from "./slot-form";
import { deleteSlot } from "./actions";

export default async function LecturerDashboardPage() {
  const user = await requireRole("lecturer");
  const supabase = await createClient();
  const [{ data: courses }, { data: slots }, [result, history]] = await Promise.all([
    supabase.from("courses").select("id, code, name").order("code"),
    supabase
      .from("consultation_slots")
      .select("id, course_id, starts_at, ends_at, courses(code, name)")
      .eq("lecturer_id", user.id)
      .order("starts_at"),
    Promise.all([
      listStaffConsultations("lecturer", false),
      listStaffConsultations("lecturer", true),
    ]),
  ]);

  return (
    <main className="space-y-8">
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

      <section className="grid gap-6">
        <h2 className="text-xl font-semibold">Lecturer consultations</h2>
        {result.kind === "success" ? (
          <>
            <section aria-labelledby="active-consultations">
              <h3 id="active-consultations" className="text-xl font-semibold">
                Active consultations
              </h3>
              <ConsultationList consultations={result.consultations} />
            </section>
            <section aria-labelledby="past-consultations">
              <h3 id="past-consultations" className="text-xl font-semibold">
                Past consultations
              </h3>
              {history.kind === "success" ? (
                <ConsultationList consultations={history.consultations} />
              ) : (
                <p role="alert">Past consultations are temporarily unavailable.</p>
              )}
            </section>
          </>
        ) : (
          <p role="alert">Consultations are temporarily unavailable. Please try again.</p>
        )}
      </section>
    </main>
  );
}
