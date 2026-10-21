"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { slotInputSchema, validateSlotInput } from "@/features/lecturer/availability";

export type ActionResult = { ok: boolean; message: string };
const idSchema = z.string().uuid();

// LEC-01 "Data access path": every slot write goes through a role-checked database function,
// because direct table access is revoked (STU-01-AC21). The function re-checks the role, the
// lead time, the course assignment, overlap and confirmation, and writes the audit row and
// student notifications in the same transaction.
const REFUSALS: Record<string, string> = {
  validation_error: "Enter a valid course, date, and time.",
  too_soon: "Slots must be created at least one hour before they start.",
  not_assigned: "You can only use courses assigned to you.",
  overlap: "This slot overlaps one of your existing slots.",
  not_found: "The selected slot was not found.",
};

function formInput(formData: FormData) {
  return {
    courseId: String(formData.get("courseId") ?? ""),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
  };
}

function resultKind(data: unknown): string {
  return typeof data === "object" && data !== null && "kind" in data
    ? String((data as { kind: unknown }).kind)
    : "error";
}

export async function createSlot(formData: FormData): Promise<ActionResult> {
  await requireRole("lecturer");
  const input = formInput(formData);
  const validation = validateSlotInput(input);
  if (!validation.ok) return validation;
  const course = slotInputSchema.shape.courseId.safeParse(input.courseId);
  if (!course.success) return { ok: false, message: "Select a course you teach." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lecturer_create_slot", {
    p_course_id: input.courseId,
    p_starts_at: validation.start.toISOString(),
    p_ends_at: validation.end.toISOString(),
  });
  const kind = error ? "error" : resultKind(data);
  if (kind !== "ok")
    return {
      ok: false,
      message: REFUSALS[kind] ?? "The slot could not be saved. Please try again.",
    };
  revalidatePath("/lecturer");
  return { ok: true, message: "Consultation slot created." };
}

export async function updateSlot(formData: FormData): Promise<ActionResult> {
  await requireRole("lecturer");
  const slotId = idSchema.safeParse(String(formData.get("slotId") ?? ""));
  const input = formInput(formData);
  if (!slotId.success) return { ok: false, message: "The selected slot was not found." };
  const validation = validateSlotInput(input);
  if (!validation.ok) return validation;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lecturer_update_slot", {
    p_slot_id: slotId.data,
    p_course_id: input.courseId,
    p_starts_at: validation.start.toISOString(),
    p_ends_at: validation.end.toISOString(),
    p_confirm: true,
  });
  const kind = error ? "error" : resultKind(data);
  if (kind === "confirmation_required")
    return {
      ok: false,
      message: "This slot has active bookings. Confirm the change to notify students.",
    };
  if (kind === "reserved")
    return {
      ok: false,
      message: "This slot has active bookings, so its course and time cannot change.",
    };
  if (kind !== "ok")
    return {
      ok: false,
      message: REFUSALS[kind] ?? "The slot could not be updated. Please try again.",
    };
  revalidatePath("/lecturer");
  return { ok: true, message: "Consultation slot updated." };
}

export async function deleteSlot(formData: FormData): Promise<ActionResult> {
  await requireRole("lecturer");
  const slotId = idSchema.safeParse(String(formData.get("slotId") ?? ""));
  if (!slotId.success) return { ok: false, message: "The selected slot was not found." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lecturer_delete_slot", {
    p_slot_id: slotId.data,
    p_confirm: true,
  });
  const kind = error ? "error" : resultKind(data);
  if (kind === "confirmation_required")
    return {
      ok: false,
      message: "This slot has active bookings. Confirm deletion to notify students.",
    };
  if (kind === "not_found") return { ok: false, message: REFUSALS.not_found };
  if (kind !== "ok")
    return { ok: false, message: "The slot could not be deleted. Please try again." };
  revalidatePath("/lecturer");
  return { ok: true, message: "Consultation slot deleted." };
}
