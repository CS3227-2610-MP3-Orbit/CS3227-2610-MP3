"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import type { CreateResult } from "@/features/admin/accounts/validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createAccountAction } from "./actions";
import OneTimePasswordPanel from "./one-time-password-panel";

const initial: CreateResult | { kind: "idle" } = { kind: "idle" };

const selectClass =
  "mt-1 block h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function describeFailure(result: CreateResult): string {
  switch (result.kind) {
    case "conflict":
      return "An account with that email already exists.";
    case "incomplete":
      return `The account was created but its role could not be confirmed. Reference: ${result.correlationId}. Check with another administrator before retrying.`;
    case "temporarily_unavailable":
      return `Account creation is temporarily unavailable. Please retry. Reference: ${result.correlationId}`;
    default:
      return "";
  }
}

export default function CreateAccountForm() {
  const [state, action, pending] = useActionState(
    (_previousState: typeof initial, formData: FormData) => createAccountAction(formData),
    initial,
  );
  // Tracks which successful result has already been dismissed, by reference. A fresh
  // submission always produces a new object, so the credential for THAT one still shows, while
  // a dismissed one never reappears even if this component re-renders.
  const [dismissed, setDismissed] = useState<typeof state | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const field = state.kind === "validation_error" ? state.field : null;

  useEffect(() => {
    if (state.kind === "success") formRef.current?.reset();
  }, [state]);

  const showCredential = state.kind === "success" && state !== dismissed;

  return (
    <section aria-label="Create account">
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Create account</h2>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={action} className="space-y-4" aria-busy={pending}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                disabled={pending}
                aria-invalid={field === "email"}
                aria-describedby="email-help"
                className="mt-1"
              />
              <p id="email-help" className="mt-1 text-sm text-muted-foreground">
                {field === "email"
                  ? "Enter a valid email address."
                  : "A valid, unused email address."}
              </p>
            </div>
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                disabled={pending}
                aria-invalid={field === "fullName"}
                aria-describedby="fullName-help"
                className="mt-1"
              />
              <p id="fullName-help" className="mt-1 text-sm text-muted-foreground">
                {field === "fullName" ? "Enter a name of 1–200 characters." : "1–200 characters."}
              </p>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                defaultValue="student"
                disabled={pending}
                className={selectClass}
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div role="status" aria-live="polite" className="text-sm">
              {pending && <p>Creating account…</p>}
              {state.kind === "validation_error" && (
                <p>
                  Please correct the {field === "request" ? "account fields" : field} and try again.
                </p>
              )}
              {(state.kind === "conflict" ||
                state.kind === "incomplete" ||
                state.kind === "temporarily_unavailable") && <p>{describeFailure(state)}</p>}
              {state.kind === "success" && !showCredential && (
                <p>Account created for {state.account.email}.</p>
              )}
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create account"}
            </Button>
          </form>
          {showCredential && state.kind === "success" && (
            <div className="mt-3">
              <p className="text-sm">
                Account created: {state.account.email} ({state.account.role}).
              </p>
              <OneTimePasswordPanel
                credential={state.initialCredential}
                onDone={() => setDismissed(state)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
