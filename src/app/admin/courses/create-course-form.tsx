"use client";

import { useActionState, useEffect, useRef } from "react";

import type { CreateCourseResult } from "@/features/admin/courses/validation";

import { createCourseAction } from "./actions";

const initial: CreateCourseResult | { kind: "idle" } = { kind: "idle" };

const control =
  "mt-1 block w-full rounded-md border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

function describeFailure(result: CreateCourseResult): string {
  switch (result.kind) {
    case "conflict_duplicate_code":
      return "A course with that code already exists (active or deactivated).";
    case "temporarily_unavailable":
      return `Course creation is temporarily unavailable. Please retry. Reference: ${result.correlationId}`;
    default:
      return "";
  }
}

export default function CreateCourseForm() {
  const [state, action, pending] = useActionState(
    (_previousState: typeof initial, formData: FormData) => createCourseAction(formData),
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const field = state.kind === "validation_error" ? state.field : null;

  useEffect(() => {
    if (state.kind === "success") formRef.current?.reset();
  }, [state]);

  return (
    <section className="rounded-lg border p-4" aria-label="Create course">
      <h2 className="font-semibold">Create course</h2>
      <form ref={formRef} action={action} className="mt-3 space-y-4" aria-busy={pending}>
        <div>
          <label htmlFor="code" className="block text-sm font-medium">
            Code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            disabled={pending}
            aria-invalid={field === "code"}
            aria-describedby="code-help"
            className={control}
          />
          <p id="code-help" className="mt-1 text-sm text-gray-600">
            {field === "code"
              ? "Enter 2-20 characters: letters, numbers, / - or _."
              : "2-20 characters: letters, numbers, / - or _. Unique across all courses."}
          </p>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            disabled={pending}
            aria-invalid={field === "name"}
            aria-describedby="name-help"
            className={control}
          />
          <p id="name-help" className="mt-1 text-sm text-gray-600">
            {field === "name" ? "Enter a name of 1-200 characters." : "1-200 characters."}
          </p>
        </div>
        <div role="status" aria-live="polite" className="text-sm">
          {pending && <p>Creating course…</p>}
          {state.kind === "validation_error" && (
            <p>Please correct the {field === "request" ? "course fields" : field} and try again.</p>
          )}
          {(state.kind === "conflict_duplicate_code" ||
            state.kind === "temporarily_unavailable") && <p>{describeFailure(state)}</p>}
          {state.kind === "success" && (
            <p>
              Course created: {state.code} ({state.name}).
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create course"}
        </button>
      </form>
    </section>
  );
}
