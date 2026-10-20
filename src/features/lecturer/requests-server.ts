import "server-only";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  decisionInputSchema,
  decisionResultSchema,
  listResultSchema,
  type DecisionResult,
  type ListResult,
} from "./requests-validation";

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || !["lecturer", "admin"].includes(user.role)) throw new Error("forbidden");
  return user;
}
export async function listLecturerRequests(): Promise<ListResult> {
  await requireStaff();
  try {
    const { data, error } = await (
      await createClient()
    )
      .rpc("list_lecturer_requests")
      .abortSignal(AbortSignal.timeout(10000));
    const parsed = listResultSchema.safeParse(data);
    return !error && parsed.success
      ? parsed.data
      : { kind: "temporarily_unavailable", correlationId: randomUUID() };
  } catch {
    return { kind: "temporarily_unavailable", correlationId: randomUUID() };
  }
}
export async function decideLecturerRequest(raw: unknown): Promise<DecisionResult> {
  await requireStaff();
  const input = decisionInputSchema.safeParse(raw);
  if (!input.success) return { kind: "validation_error", field: "request" };
  try {
    const v = input.data;
    const { data, error } = await (
      await createClient()
    )
      .rpc("decide_lecturer_request", {
        p_booking_id: v.bookingId,
        p_decision: v.decision,
        p_reason: v.reason,
        p_expected_version: v.version,
        p_operation_key: v.operationKey,
      })
      .abortSignal(AbortSignal.timeout(10000));
    const parsed = decisionResultSchema.safeParse(data);
    return !error && parsed.success
      ? parsed.data
      : { kind: "temporarily_unavailable", correlationId: randomUUID() };
  } catch {
    return { kind: "temporarily_unavailable", correlationId: randomUUID() };
  }
}
