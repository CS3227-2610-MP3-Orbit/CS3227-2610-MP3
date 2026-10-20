import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ConsultationList } from "@/components/consultation-list";
import { Button } from "@/components/ui/button";
import { listStaffConsultations } from "@/features/lecturer/consultations/server";
import { listLecturerRequests } from "@/features/lecturer/requests-server";
import { SlotForm } from "./slot-form";
import { deleteSlot } from "./actions";
import { RequestCard } from "./request-card";

export default async function LecturerDashboardPage() {
  const user = await requireRole("lecturer");
  const supabase = await createClient();
  const [{ data: courses }, { data: slots }, [result, history], requests] = await Promise.all([
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
    listLecturerRequests(),
  ]);

  return (
    <main className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Lecturer dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Consultation availability uses Singapore time. Slots must be created at least one hour
          before they start.
        </p>
        <SlotForm courses={(courses ?? []) as { id: string; code: string; name: string }[]} />
        <h2 className="mt-8 font-semibold">Your consultation slots</h2>
        {!slots?.length ? (
          <p className="mt-2 text-sm text-muted-foreground">No consultation slots yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
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
                  <Button variant="link" className="text-destructive" type="submit">
                    Delete
                  </Button>
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
    </main>
  );
}
