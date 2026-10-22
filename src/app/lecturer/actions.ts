"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { slotInputSchema, validateSlotInput } from "@/features/lecturer/availability";

type ActionResult = { ok: boolean; message: string };
const idSchema = z.string().uuid();

function formInput(formData: FormData) {
  return {
    courseId: String(formData.get("courseId") ?? ""),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
  };
}

export async function createSlot(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("lecturer");
  const input = formInput(formData);
  const validation = validateSlotInput(input);
  if (!validation.ok) return validation;
  const supabase = await createClient();
  const course = slotInputSchema.shape.courseId.safeParse(input.courseId);
  if (!course.success) return { ok: false, message: "Select a course you teach." };
  const { data: membership } = await supabase
    .from("course_lecturers")
    .select("course_id")
    .eq("course_id", input.courseId)
    .eq("lecturer_id", user.id)
    .maybeSingle();
  if (!membership) return { ok: false, message: "You can only use courses assigned to you." };
  const { data: overlap } = await supabase
    .from("consultation_slots")
    .select("id")
    .eq("lecturer_id", user.id)
    .lt("starts_at", validation.end.toISOString())
    .gt("ends_at", validation.start.toISOString())
    .limit(1)
    .maybeSingle();
  if (overlap) return { ok: false, message: "This slot overlaps one of your existing slots." };
  const { error } = await supabase.from("consultation_slots").insert({
    lecturer_id: user.id,
    course_id: input.courseId,
    starts_at: validation.start.toISOString(),
    ends_at: validation.end.toISOString(),
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "An identical slot already exists."
          : "The slot could not be saved. Please try again.",
    };
  await supabase
    .from("consultation_audit_log")
    .insert({ actor_id: user.id, action: "created", outcome: "success" });
  revalidatePath("/lecturer");
  return { ok: true, message: "Consultation slot created." };
}

export async function updateSlot(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("lecturer");
  const slotId = idSchema.safeParse(String(formData.get("slotId") ?? ""));
  const input = formInput(formData);
  if (!slotId.success) return { ok: false, message: "The selected slot was not found." };
  const validation = validateSlotInput(input);
  if (!validation.ok) return validation;
  const supabase = await createClient();
  const { data: slot } = await supabase
    .from("consultation_slots")
    .select("id")
    .eq("id", slotId.data)
    .eq("lecturer_id", user.id)
    .maybeSingle();
  if (!slot) return { ok: false, message: "The selected slot was not found." };
  const { data: membership } = await supabase
    .from("course_lecturers")
    .select("course_id")
    .eq("course_id", input.courseId)
    .eq("lecturer_id", user.id)
    .maybeSingle();
  if (!membership) return { ok: false, message: "You can only use courses assigned to you." };
  const { data: overlap } = await supabase
    .from("consultation_slots")
    .select("id")
    .eq("lecturer_id", user.id)
    .neq("id", slotId.data)
    .lt("starts_at", validation.end.toISOString())
    .gt("ends_at", validation.start.toISOString())
    .limit(1)
    .maybeSingle();
  if (overlap) return { ok: false, message: "This slot overlaps one of your existing slots." };
  const { data: bookings } = await supabase
    .from("bookings")
    .select("student_id")
    .eq("slot_id", slotId.data)
    .in("status", ["pending", "approved"]);
  if (bookings?.length && formData.get("confirm") !== "on")
    return {
      ok: false,
      message: "This slot has active bookings. Confirm the change to notify students.",
    };
  const { error } = await supabase
    .from("consultation_slots")
    .update({
      course_id: input.courseId,
      starts_at: validation.start.toISOString(),
      ends_at: validation.end.toISOString(),
    })
    .eq("id", slotId.data)
    .eq("lecturer_id", user.id);
  if (error) return { ok: false, message: "The slot could not be updated. Please try again." };
  await supabase
    .from("consultation_audit_log")
    .insert({ actor_id: user.id, slot_id: slotId.data, action: "updated", outcome: "success" });
  if (bookings?.length)
    await supabase.from("consultation_notifications").insert(
      bookings.map((booking) => ({
        recipient_id: booking.student_id,
        slot_id: slotId.data,
        kind: "slot_updated",
        message: "A consultation slot you booked has been updated.",
      })),
    );
  revalidatePath("/lecturer");
  return { ok: true, message: "Consultation slot updated." };
}

export async function deleteSlot(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("lecturer");
  const slotId = idSchema.safeParse(String(formData.get("slotId") ?? ""));
  if (!slotId.success) return { ok: false, message: "The selected slot was not found." };
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("student_id")
    .eq("slot_id", slotId.data)
    .in("status", ["pending", "approved"]);
  if (bookings?.length && formData.get("confirm") !== "on")
    return {
      ok: false,
      message: "This slot has active bookings. Confirm deletion to notify students.",
    };
  const { data: deleted, error } = await supabase
    .from("consultation_slots")
    .delete()
    .eq("id", slotId.data)
    .eq("lecturer_id", user.id)
    .select("id");
  if (error) return { ok: false, message: "The slot could not be deleted. Please try again." };
  if (!deleted?.length) return { ok: false, message: "The selected slot was not found." };
  await supabase
    .from("consultation_audit_log")
    .insert({ actor_id: user.id, slot_id: slotId.data, action: "deleted", outcome: "success" });
  if (bookings?.length)
    await supabase.from("consultation_notifications").insert(
      bookings.map((booking) => ({
        recipient_id: booking.student_id,
        slot_id: slotId.data,
        kind: "slot_deleted",
        message: "A consultation slot you booked has been deleted.",
      })),
    );
  revalidatePath("/lecturer");
  return { ok: true, message: "Consultation slot deleted." };
}

// Form actions must return void; the page refreshes through revalidatePath after deletion.
export async function deleteSlotForForm(formData: FormData): Promise<void> {
  await deleteSlot(formData);
}
