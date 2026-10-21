"use server";

import { requireUser } from "@/lib/auth/session";
import { changeOwnPassword } from "@/features/account/server";
import type { ChangePasswordResult } from "@/features/account/validation";

export interface ChangePasswordState {
  result: ChangePasswordResult | null;
}

export async function submitChangePassword(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  await requireUser();
  const result = await changeOwnPassword(formData);
  return { result };
}
