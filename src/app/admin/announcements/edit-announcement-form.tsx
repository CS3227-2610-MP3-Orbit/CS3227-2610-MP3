"use client";

import { useActionState } from "react";

import type {
  Announcement,
  UpdateAnnouncementResult,
} from "@/features/admin/announcements/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { updateAnnouncementAction } from "./actions";

const initial: UpdateAnnouncementResult | { kind: "idle" } = { kind: "idle" };

const selectClass =
  "mt-1 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function describeFailure(result: UpdateAnnouncementResult): string {
  switch (result.kind) {
    case "forbidden_or_not_found":
      return "This item is no longer available.";
    case "temporarily_unavailable":
      return `Update is temporarily unavailable. Please retry. Reference: ${result.correlationId}`;
    default:
      return "";
  }
}

/**
 * ADM-03-R2: edits an existing item's kind/title/body, pre-filled with its current values.
 * Never changes isPublished (ADM-03-R3's separate publish/unpublish toggle does that). Mirrors
 * create-announcement-form.tsx's field-level validation display convention.
 */
export default function EditAnnouncementForm({
  item,
  onSuccess,
}: {
  item: Announcement;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState(
    async (_previousState: typeof initial, formData: FormData) => {
      const result = await updateAnnouncementAction(formData);
      if (result.kind === "success") onSuccess();
      return result;
    },
    initial,
  );
  const field = state.kind === "validation_error" ? state.field : null;

  return (
    <section aria-label={`Edit ${item.title}`}>
      <form action={action} className="space-y-4" aria-busy={pending}>
        <input type="hidden" name="id" value={item.id} />
        <div>
          <Label htmlFor={`edit-kind-${item.id}`}>Kind</Label>
          <select
            id={`edit-kind-${item.id}`}
            name="kind"
            defaultValue={item.kind}
            disabled={pending}
            aria-invalid={field === "kind"}
            className={selectClass}
          >
            <option value="guideline">Guideline</option>
            <option value="announcement">Announcement</option>
          </select>
        </div>
        <div>
          <Label htmlFor={`edit-title-${item.id}`}>Title</Label>
          <Input
            id={`edit-title-${item.id}`}
            name="title"
            type="text"
            required
            defaultValue={item.title}
            disabled={pending}
            aria-invalid={field === "title"}
            aria-describedby={`edit-title-help-${item.id}`}
            className="mt-1"
          />
          <p id={`edit-title-help-${item.id}`} className="mt-1 text-sm text-muted-foreground">
            {field === "title" ? "Enter 1-120 characters." : "1-120 characters."}
          </p>
        </div>
        <div>
          <Label htmlFor={`edit-body-${item.id}`}>Body</Label>
          <Textarea
            id={`edit-body-${item.id}`}
            name="body"
            required
            defaultValue={item.body}
            disabled={pending}
            aria-invalid={field === "body"}
            aria-describedby={`edit-body-help-${item.id}`}
            className="mt-1 min-h-32"
          />
          <p id={`edit-body-help-${item.id}`} className="mt-1 text-sm text-muted-foreground">
            {field === "body" ? "Enter 1-2000 characters." : "1-2000 characters."}
          </p>
        </div>
        <div role="status" aria-live="polite" className="text-sm">
          {pending && <p>Saving…</p>}
          {state.kind === "validation_error" && (
            <p>Please correct the {field === "request" ? "fields" : field} and try again.</p>
          )}
          {(state.kind === "forbidden_or_not_found" ||
            state.kind === "temporarily_unavailable") && <p>{describeFailure(state)}</p>}
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
    </section>
  );
}
