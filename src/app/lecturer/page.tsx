import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SlotForm } from "./slot-form";
import { deleteSlot } from "./actions";

export default async function LecturerDashboardPage() {
  const user = await requireRole("lecturer");
  const supabase = await createClient();
  const [{ data: courses }, { data: slots }] = await Promise.all([
    supabase.from("courses").select("id, code, name").order("code"),
    supabase.from("consultation_slots").select("id, course_id, starts_at, ends_at, courses(code, name)").eq("lecturer_id", user.id).order("starts_at"),
  ]);
  return <div><h1 className="text-2xl font-semibold">Lecturer dashboard</h1><p className="mt-2 text-sm">Consultation availability uses Singapore time. Slots must be created at least one hour before they start.</p>
    <SlotForm courses={(courses ?? []) as { id: string; code: string; name: string }[]} />
    <section className="mt-8"><h2 className="font-semibold">Your consultation slots</h2>{!slots?.length ? <p className="mt-2 text-sm">No consultation slots yet.</p> : <ul className="mt-3 grid gap-2">{slots.map((slot) => <li key={slot.id} className="flex items-center justify-between rounded border p-3"><span>{new Date(slot.starts_at).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })} – {new Date(slot.ends_at).toLocaleTimeString("en-SG", { timeZone: "Asia/Singapore", hour: "2-digit", minute: "2-digit" })}</span><form action={deleteSlot}><input type="hidden" name="slotId" value={slot.id} /><button className="text-red-700 underline" type="submit">Delete</button></form></li>)}</ul>}</section>
  </div>;
}
