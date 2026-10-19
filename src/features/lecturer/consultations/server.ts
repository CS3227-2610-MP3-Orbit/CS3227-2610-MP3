import "server-only";
import { randomUUID } from "node:crypto";
import { requireRole, type CurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { consultationResultSchema, type ConsultationResult } from "./validation";

export async function listStaffConsultations(
  role: CurrentUser["role"],
  history = false,
): Promise<ConsultationResult | { kind: "temporarily_unavailable"; correlationId: string }> {
  await requireRole(role);
  try {
    const { data, error } = await (
      await createClient()
    )
      .rpc("list_staff_consultations", { p_history: history })
      .abortSignal(AbortSignal.timeout(10000));
    const parsed = consultationResultSchema.safeParse(data);
    return !error && parsed.success
      ? parsed.data
      : { kind: "temporarily_unavailable", correlationId: randomUUID() };
  } catch {
    return { kind: "temporarily_unavailable", correlationId: randomUUID() };
  }
}
