import "server-only";
import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  bookingResultSchema,
  boundedInput,
  cancelInputSchema,
  fieldSchema,
  getInputSchema,
  listResultSchema,
  updateInputSchema,
  type BookingResult,
  type ListResult,
} from "./manage-validation";

const unavailable = (write: boolean) => ({
  kind: write ? ("outcome_unknown" as const) : ("temporarily_unavailable" as const),
  correlationId: randomUUID(),
});
const invalid = (path?: PropertyKey) => ({
  kind: "validation_error" as const,
  field: fieldSchema.safeParse(path).success ? fieldSchema.parse(path) : ("request" as const),
});

export async function listMyBookings(): Promise<ListResult> {
  await requireRole("student");
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("list_my_bookings")
      .abortSignal(AbortSignal.timeout(10000));
    return !error && listResultSchema.safeParse(data).success
      ? listResultSchema.parse(data)
      : unavailable(false);
  } catch {
    return unavailable(false);
  }
}
export async function getMyBooking(raw: unknown): Promise<BookingResult> {
  await requireRole("student");
  const input = getInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("get_my_booking", { p_booking_id: input.data.bookingId })
      .abortSignal(AbortSignal.timeout(10000));
    return !error && bookingResultSchema.safeParse(data).success
      ? bookingResultSchema.parse(data)
      : unavailable(false);
  } catch {
    return unavailable(false);
  }
}
async function mutate(raw: unknown, operation: "update" | "cancel"): Promise<BookingResult> {
  await requireRole("student");
  const schema = operation === "update" ? updateInputSchema : cancelInputSchema;
  const input = schema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } =
      operation === "update"
        ? await db
            .rpc(
              "update_my_booking",
              (() => {
                const value = updateInputSchema.parse(input.data);
                return {
                  p_booking_id: value.bookingId,
                  p_expected_version: value.version,
                  p_topic: value.topic,
                  p_questions: value.questions,
                  p_idempotency_key: value.idempotencyKey,
                };
              })(),
            )
            .abortSignal(AbortSignal.timeout(10000))
        : await db
            .rpc("cancel_my_booking", {
              p_booking_id: input.data.bookingId,
              p_expected_version: input.data.version,
              p_idempotency_key: input.data.idempotencyKey,
            })
            .abortSignal(AbortSignal.timeout(10000));
    return !error && bookingResultSchema.safeParse(data).success
      ? bookingResultSchema.parse(data)
      : unavailable(true);
  } catch {
    return unavailable(true);
  }
}
export const updateMyBooking = (raw: unknown) => mutate(raw, "update");
export const cancelMyBooking = (raw: unknown) => mutate(raw, "cancel");
