import { CalendarClock, Inbox } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementsCard } from "@/components/announcements-card";
import { ConsultationList } from "@/components/consultation-list";
import { EmptyState } from "@/components/empty-state";
import { StatTile, StatTileRow } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { listStaffConsultations } from "@/features/lecturer/consultations/server";
import { listLecturerRequests } from "@/features/lecturer/requests-server";
import { listLecturerBriefings } from "@/features/lecturer/ai-briefing";
import { greetingFor } from "@/lib/greeting";
import { SlotForm } from "./slot-form";
import { deleteSlot } from "./actions";
import { RequestCard } from "./request-card";

export default async function LecturerDashboardPage() {
  const user = await requireRole("lecturer");
  const supabase = await createClient();
  const [{ data: courseRows }, { data: slotRows }, [result, history], requests, briefings] =
    await Promise.all([
      // LEC-01 "Data access path": direct table reads are revoked (STU-01-AC21).
      supabase.rpc("lecturer_list_my_courses"),
      supabase.rpc("lecturer_list_my_slots"),
      Promise.all([
        listStaffConsultations("lecturer", false),
        listStaffConsultations("lecturer", true),
      ]),
      listLecturerRequests(),
      listLecturerBriefings(),
    ]);
  const courses = (courseRows ?? []) as { id: string; code: string; name: string }[];
  const slots = (slotRows ?? []) as { id: string; starts_at: string; ends_at: string }[];

  const pendingRequestsCount = requests.kind === "success" ? requests.requests.length : null;

  return (
    <main className="space-y-8">
      <section className="space-y-5">
        <h1 className="text-2xl font-semibold">{greetingFor(new Date(), user.fullName)}</h1>
        <StatTileRow>
          <StatTile
            label="Your consultation slots"
            value={slots?.length ?? 0}
            icon={CalendarClock}
            tone="primary"
          />
          <StatTile
            label="Pending requests"
            value={pendingRequestsCount}
            icon={Inbox}
            tone="warning"
          />
        </StatTileRow>
        <p className="text-sm text-muted-foreground">
          Consultation availability uses Singapore time. Slots must be created at least one hour
          before they start.
        </p>
        <SlotForm courses={courses} />
        <h2 className="mt-8 font-semibold">Your consultation slots</h2>
        {!slots.length ? (
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
                    "use server";
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

      <AnnouncementsCard />

      <section aria-labelledby="saved-briefings">
        <h2 id="saved-briefings" className="text-xl font-semibold">
          Saved AI briefings
        </h2>
        {briefings.length === 0 ? (
          <p role="status" className="mt-2">
            No saved briefings yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {briefings.map((briefing) => (
              <li key={briefing.id} className="rounded border p-4">
                <p className="text-sm text-muted-foreground">
                  Saved{" "}
                  {new Date(briefing.createdAt).toLocaleString("en-SG", {
                    timeZone: "Asia/Singapore",
                  })}
                </p>
                <pre className="mt-2 whitespace-pre-wrap">{briefing.content}</pre>
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
            <EmptyState icon={Inbox} message="No pending consultation requests." className="mt-2" />
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
