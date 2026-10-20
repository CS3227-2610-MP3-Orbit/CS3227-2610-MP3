import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AttemptClaim =
  | { kind: "admitted"; id: number }
  | { kind: "quota_exceeded"; retryAfterSeconds: number }
  | { kind: "in_flight" }
  | { kind: "unavailable" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Calls the server-only accounting RPC; browser clients receive no access to attempt rows. */
export async function claimAttempt(userId: string, feature: string): Promise<AttemptClaim> {
  try {
    const { data, error } = await createAdminClient().rpc("claim_ai_attempt", {
      p_user_id: userId,
      p_feature: feature,
    });
    if (error || !isRecord(data) || typeof data.kind !== "string") return { kind: "unavailable" };
    if (data.kind === "admitted" && typeof data.attemptId === "number")
      return { kind: "admitted", id: data.attemptId };
    if (data.kind === "quota_exceeded" && typeof data.retryAfterSeconds === "number")
      return { kind: "quota_exceeded", retryAfterSeconds: data.retryAfterSeconds };
    if (data.kind === "in_flight") return { kind: "in_flight" };
    return { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
}

async function resolveAttempt(id: number, outcome: "succeeded" | "failed" | "indeterminate") {
  try {
    const { data, error } = await createAdminClient().rpc("resolve_ai_attempt", {
      p_attempt_id: id,
      p_outcome: outcome,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}

export const finalizeAttempt = (id: number) => resolveAttempt(id, "succeeded");
export const releaseAttempt = (id: number) => resolveAttempt(id, "failed");
export const markAttemptIndeterminate = (id: number) => resolveAttempt(id, "indeterminate");
