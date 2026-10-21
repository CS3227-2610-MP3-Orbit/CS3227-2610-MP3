"use client";

import { useActionState, useEffect, useRef } from "react";

import type { CreateAnnouncementResult } from "@/features/admin/announcements/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createAnnouncementAction } from "./actions";

const initial: CreateAnnouncementResult | { kind: "idle" } = { kind: "idle" };

const selectClass =
  "mt-1 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function describeFailure(result: CreateAnnouncementResult): string {
  switch (result.kind) {
    case "forbidden_or_not_found":
      return "This action is not available to your account.";
    case "temporarily_unavailable":
      return `Creation is temporarily unavailable. Please retry. Reference: ${result.correlationId}`;
    default:
      return "";
  }
}

/**
 * ADM-03-R1: creates a guideline or announcement as a draft (isPublished starts false; a
 * separate "Publish" action, ADM-03-R3, is needed before any reader sees it). Mirrors
 * src/app/admin/courses/create-course-form.tsx's field-level validation display convention.
 */
export default function CreateAnnouncementForm() {
  const [state, action, pending] = useActionState(
    (_previousState: typeof initial, formData: FormData) => createAnnouncementAction(formData),
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const field = state.kind === "validation_error" ? state.field : null;

  useEffect(() => {
    if (state.kind === "success") formRef.current?.reset();
  }, [state]);

  return (
    <section aria-label="Create guideline or announcement">
      <form ref={formRef} action={action} className="space-y-4" aria-busy={pending}>
        <div>
          <Label htmlFor="kind">Kind</Label>
          <select
            id="kind"
            name="kind"
            defaultValue="guideline"
            disabled={pending}
            aria-invalid={field === "kind"}
            className={selectClass}
          >
            <option value="guideline">Guideline</option>
            <option value="announcement">Announcement</option>
          </select>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            type="text"
            required
            disabled={pending}
            aria-invalid={field === "title"}
            aria-describedby="title-help"
            className="mt-1"
          />
          <p id="title-help" className="mt-1 text-sm text-muted-foreground">
            {field === "title" ? "Enter 1-120 characters." : "1-120 characters."}
          </p>
        </div>
        <div>
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            name="body"
            required
            disabled={pending}
            aria-invalid={field === "body"}
            aria-describedby="body-help"
            className="mt-1 min-h-32"
          />
          <p id="body-help" className="mt-1 text-sm text-muted-foreground">
            {field === "body" ? "Enter 1-2000 characters." : "1-2000 characters."}
          </p>
        </div>
        <div role="status" aria-live="polite" className="text-sm">
          {pending && <p>Creating…</p>}
          {state.kind === "validation_error" && (
            <p>Please correct the {field === "request" ? "fields" : field} and try again.</p>
          )}
          {(state.kind === "forbidden_or_not_found" ||
            state.kind === "temporarily_unavailable") && <p>{describeFailure(state)}</p>}
          {state.kind === "success" && <p>Created as a draft. Publish it to make it visible.</p>}
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create"}
        </Button>
      </form>
    </section>
  );
}
