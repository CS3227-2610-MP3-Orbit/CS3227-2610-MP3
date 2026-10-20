"use client";

import { useActionState } from "react";

import { submitChangePassword, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = { result: null };

const control = "mt-1 block w-full rounded-md border px-3 py-2";

const fieldMessages: Record<string, string> = {
  currentPassword: "Enter your current password.",
  newPassword: "New password must be 12–72 bytes long and different from your current password.",
  confirmPassword: "Confirmation must match the new password.",
  request: "Please correct the highlighted fields and submit again.",
};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(submitChangePassword, initialState);
  const result = state.result;
  const field = result?.kind === "validation_error" ? result.field : null;

  if (result?.kind === "success") {
    return (
      <section role="status" className="space-y-2 rounded-md border px-3 py-2">
        <h2 className="text-lg font-semibold">Password changed</h2>
        <p>Your password has been updated. You remain signed in on this session.</p>
      </section>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Current password
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={field === "currentPassword"}
          className={control}
        />
      </label>
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword">New password</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={12}
          maxLength={72}
          autoComplete="new-password"
          aria-invalid={field === "newPassword"}
          aria-describedby="newPassword-help"
          className={control}
        />
        <span id="newPassword-help" className="text-sm">
          12–72 bytes, and different from your current password.
        </span>
      </div>
      <label className="flex flex-col gap-1">
        Confirm new password
        <input
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={field === "confirmPassword"}
          className={control}
        />
      </label>
      <div role="status" aria-live="polite">
        {pending && <p>Updating your password…</p>}
        {result?.kind === "validation_error" && <p>{fieldMessages[result.field]}</p>}
        {result?.kind === "conflict" && <p>Current password is incorrect.</p>}
        {result?.kind === "temporarily_unavailable" && (
          <p>
            The service is temporarily unavailable. Please try again. Reference:{" "}
            {result.correlationId}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
