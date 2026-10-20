import { requireUser } from "@/lib/auth/session";

import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Change password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your current password and a new password to update your account.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
