"use client";

import { useActionState, useEffect, useRef } from "react";

import type { CreateCourseResult } from "@/features/admin/courses/validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createCourseAction } from "./actions";

const initial: CreateCourseResult | { kind: "idle" } = { kind: "idle" };

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
    <section aria-label="Create course">
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Create course</h2>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={action} className="space-y-4" aria-busy={pending}>
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                type="text"
                required
                disabled={pending}
                aria-invalid={field === "code"}
                aria-describedby="code-help"
                className="mt-1"
              />
              <p id="code-help" className="mt-1 text-sm text-muted-foreground">
                {field === "code"
                  ? "Enter 2-20 characters: letters, numbers, / - or _."
                  : "2-20 characters: letters, numbers, / - or _. Unique across all courses."}
              </p>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                disabled={pending}
                aria-invalid={field === "name"}
                aria-describedby="name-help"
                className="mt-1"
              />
              <p id="name-help" className="mt-1 text-sm text-muted-foreground">
                {field === "name" ? "Enter a name of 1-200 characters." : "1-200 characters."}
              </p>
            </div>
            <div role="status" aria-live="polite" className="text-sm">
              {pending && <p>Creating course…</p>}
              {state.kind === "validation_error" && (
                <p>
                  Please correct the {field === "request" ? "course fields" : field} and try again.
                </p>
              )}
              {(state.kind === "conflict_duplicate_code" ||
                state.kind === "temporarily_unavailable") && <p>{describeFailure(state)}</p>}
              {state.kind === "success" && (
                <p>
                  Course created: {state.code} ({state.name}).
                </p>
              )}
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create course"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
