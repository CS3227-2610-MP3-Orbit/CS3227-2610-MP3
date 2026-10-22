"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { submitChangePassword, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = { result: null };

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
      <section role="status" className="space-y-2 rounded-lg border bg-card px-4 py-3">
        <h2 className="text-lg font-semibold">Password changed</h2>
        <p className="text-sm text-muted-foreground">
          Your password has been updated. You remain signed in on this session.
        </p>
        <p className="text-sm text-muted-foreground">
          {result.otherSessionsEnded
            ? "Your other devices were signed out."
            : "We could not confirm your other devices were signed out; sign out there manually if you suspect they were compromised."}
        </p>
      </section>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={field === "currentPassword"}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={12}
          maxLength={72}
          autoComplete="new-password"
          aria-invalid={field === "newPassword"}
          aria-describedby="newPassword-help"
        />
        <span id="newPassword-help" className="text-sm text-muted-foreground">
          12–72 bytes, and different from your current password.
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={field === "confirmPassword"}
        />
      </div>
      <div role="status" aria-live="polite" className="text-sm">
        {pending && <p>Updating your password…</p>}
        {result?.kind === "validation_error" && <p>{fieldMessages[result.field]}</p>}
        {result?.kind === "conflict" && (
          <p className="text-destructive">Current password is incorrect.</p>
        )}
        {result?.kind === "rate_limited" && (
          <p className="text-destructive">
            Too many attempts. Try again in {Math.ceil(result.retryAfterSeconds / 60)} minutes.
          </p>
        )}
        {result?.kind === "temporarily_unavailable" && (
          <p className="text-destructive">
            The service is temporarily unavailable. Please try again. Reference:{" "}
            {result.correlationId}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}
