"use server";
import { requireRole } from "@/lib/auth/session";
import { cancelMyBooking, updateMyBooking } from "@/features/student/bookings/manage-server";
export async function submitBookingUpdate(input: unknown) {
  await requireRole("student");
  return updateMyBooking(input);
}
export async function submitBookingCancellation(input: unknown) {
  await requireRole("student");
  return cancelMyBooking(input);
}
