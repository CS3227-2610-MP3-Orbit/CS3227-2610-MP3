"use server";
import { decideLecturerRequest } from "@/features/lecturer/requests-server";
import type { DecisionResult } from "@/features/lecturer/requests-validation";

export type DecisionActionState = DecisionResult | { kind: "idle" };
export async function decideRequestAction(
  _previous: DecisionActionState,
  formData: FormData,
): Promise<DecisionResult> {
  const result = await decideLecturerRequest({
    bookingId: formData.get("bookingId"),
    decision: formData.get("decision"),
    reason: formData.get("reason") ?? "",
    version: formData.get("version"),
    operationKey: formData.get("operationKey"),
  });
  return result;
}
