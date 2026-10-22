"use server";

import { requireRole } from "@/lib/auth/session";
import {
  getRequestSlot,
  requestConsultation,
  recoverConsultation,
} from "@/features/student/bookings/request-server";
import { improveRequestDraft } from "@/features/student/bookings/improve-request-server";

export async function submitRequest(input: unknown) {
  await requireRole("student");
  return requestConsultation(input);
}
export async function recoverRequest(input: unknown) {
  await requireRole("student");
  return recoverConsultation(input);
}
export async function refreshRequestSlot(input: unknown) {
  await requireRole("student");
  return getRequestSlot(input);
}
export async function improveRequest(input: unknown) {
  await requireRole("student");
  return improveRequestDraft(input);
}
