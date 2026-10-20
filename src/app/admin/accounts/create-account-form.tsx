"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import type { CreateResult } from "@/features/admin/accounts/validation";

import { createAccountAction } from "./actions";
import OneTimePasswordPanel from "./one-time-password-panel";

const initial: CreateResult | { kind: "idle" } = { kind: "idle" };

const control =
  "mt-1 block w-full rounded-md border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

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
    <section className="rounded-lg border p-4" aria-label="Create account">
      <h2 className="font-semibold">Create account</h2>
      <form ref={formRef} action={action} className="mt-3 space-y-4" aria-busy={pending}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={pending}
            aria-invalid={field === "email"}
            aria-describedby="email-help"
            className={control}
          />
          <p id="email-help" className="mt-1 text-sm text-gray-600">
            {field === "email" ? "Enter a valid email address." : "A valid, unused email address."}
          </p>
        </div>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            disabled={pending}
            aria-invalid={field === "fullName"}
            aria-describedby="fullName-help"
            className={control}
          />
          <p id="fullName-help" className="mt-1 text-sm text-gray-600">
            {field === "fullName" ? "Enter a name of 1–200 characters." : "1–200 characters."}
          </p>
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue="student"
            disabled={pending}
            className={control}
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
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
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
    </section>
  );
}
