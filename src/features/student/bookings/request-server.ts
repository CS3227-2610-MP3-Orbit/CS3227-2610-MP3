import "server-only";
import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  boundedInput,
  fieldSchema,
  lookupInputSchema,
  lookupResultSchema,
  recoverInputSchema,
  requestInputSchema,
  receiptResultSchema,
  type LookupResult,
  type ReceiptResult,
} from "./request-validation";

function unavailable(write: boolean): {
  kind: "outcome_unknown" | "temporarily_unavailable";
  correlationId: string;
} {
  return {
    kind: write ? "outcome_unknown" : "temporarily_unavailable",
    correlationId: randomUUID(),
  };
}
function invalid(path?: PropertyKey): {
  kind: "validation_error";
  field: "slotId" | "slotVersion" | "topic" | "questions" | "idempotencyKey" | "request";
} {
  const field = fieldSchema.safeParse(path);
  return { kind: "validation_error", field: field.success ? field.data : "request" };
}

export async function getRequestSlot(raw: unknown): Promise<LookupResult> {
  await requireRole("student");
  const input = lookupInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("get_request_slot", { p_slot_id: input.data.slotId })
      .abortSignal(AbortSignal.timeout(10000));
    if (error) return unavailable(false);
    const result = lookupResultSchema.safeParse(data);
    return result.success ? result.data : unavailable(false);
  } catch {
    return unavailable(false);
  }
}

export async function requestConsultation(raw: unknown): Promise<ReceiptResult> {
  await requireRole("student");
  const input = requestInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  let submitted = false;
  try {
    const db = await createClient();
    const value = input.data;
    submitted = true;
    const { data, error } = await db
      .rpc("request_consultation", {
        p_slot_id: value.slotId,
        p_slot_version: value.slotVersion,
        p_topic: value.topic,
        p_questions: value.questions,
        p_idempotency_key: value.idempotencyKey,
      })
      .abortSignal(AbortSignal.timeout(10000));
    if (error) return unavailable(true);
    const result = receiptResultSchema.safeParse(data);
    return result.success ? result.data : unavailable(true);
  } catch {
    return unavailable(submitted);
  }
}

export async function recoverConsultation(raw: unknown): Promise<ReceiptResult> {
  await requireRole("student");
  const input = recoverInputSchema.safeParse(boundedInput(raw));
  if (!input.success) return invalid(input.error.issues[0]?.path[0]);
  try {
    const db = await createClient();
    const { data, error } = await db
      .rpc("recover_consultation", { p_idempotency_key: input.data.idempotencyKey })
      .abortSignal(AbortSignal.timeout(10000));
    if (error) return unavailable(false);
    const result = receiptResultSchema.safeParse(data);
    return result.success ? result.data : unavailable(false);
  } catch {
    return unavailable(false);
  }
}
