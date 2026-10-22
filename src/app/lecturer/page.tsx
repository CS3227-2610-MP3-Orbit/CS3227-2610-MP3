import { CalendarClock, Inbox } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementsCard } from "@/components/announcements-card";
import { ConsultationList } from "@/components/consultation-list";
import { EmptyState } from "@/components/empty-state";
import { StatTile, StatTileRow } from "@/components/stat-tile";
import { listStaffConsultations } from "@/features/lecturer/consultations/server";
import { listLecturerRequests } from "@/features/lecturer/requests-server";
import { listLecturerBriefings } from "@/features/lecturer/ai-briefing";
import { greetingFor } from "@/lib/greeting";
import { SlotForm } from "./slot-form";
import { SlotRow } from "./slot-row";
import { RequestCard } from "./request-card";

export default async function LecturerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ briefing?: string; message?: string }>;
}) {
  const user = await requireRole("lecturer");
  const supabase = await createClient();
  const params = await searchParams;
  const [{ data: courseResult }, { data: slots }, [result, history], requests, briefings] =
    await Promise.all([
      supabase.rpc("list_lecturer_courses"),
      supabase
        .from("consultation_slots")
        .select("id, course_id, starts_at, ends_at, courses(code, name)")
        .eq("lecturer_id", user.id)
        .eq("is_active", true)
        .order("starts_at"),
      Promise.all([
        listStaffConsultations("lecturer", false),
        listStaffConsultations("lecturer", true),
      ]),
      listLecturerRequests(),
      listLecturerBriefings(),
    ]);

  const courses =
    courseResult?.kind === "success" && Array.isArray(courseResult.courses)
      ? (courseResult.courses as { id: string; code: string; name: string }[])
      : [];

  const pendingRequestsCount = requests.kind === "success" ? requests.requests.length : null;

  return (
    <main className="space-y-8">
      <section className="space-y-5">
        <h1 className="text-2xl font-semibold">{greetingFor(new Date(), user.fullName)}</h1>
        {params.briefing === "success" && (
          <p role="status" className="rounded-lg border border-primary/50 p-3">
            AI briefing generated and saved successfully.
          </p>
        )}
        {params.briefing === "error" && (
          <p role="alert" className="rounded-lg border border-destructive/50 p-3">
            {params.message ?? "The AI briefing could not be generated."}
          </p>
        )}
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
        <SlotForm courses={(courses ?? []) as { id: string; code: string; name: string }[]} />
        <h2 className="mt-8 font-semibold">Your consultation slots</h2>
        {!slots?.length ? (
          <p className="mt-2 text-sm text-muted-foreground">No consultation slots yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {slots.map((slot) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                courses={(courses ?? []) as { id: string; code: string; name: string }[]}
              />
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
                <h3 className="font-semibold">
                  {briefing.courseCode} — {briefing.courseName}
                </h3>
                <p className="mt-1">
                  {briefing.topic} · {briefing.studentName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Consultation:{" "}
                  {new Date(briefing.startsAt).toLocaleString("en-SG", {
                    timeZone: "Asia/Singapore",
                  })}{" "}
                  —{" "}
                  {new Date(briefing.endsAt).toLocaleTimeString("en-SG", {
                    timeZone: "Asia/Singapore",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
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
