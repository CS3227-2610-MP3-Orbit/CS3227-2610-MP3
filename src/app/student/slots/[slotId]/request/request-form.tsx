"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { unstable_rethrow } from "next/navigation";
import { formatSingaporeDateTime } from "@/features/student/slots/format";
import {
  type RequestInput,
  type RequestSlot,
  type ReceiptResult,
} from "@/features/student/bookings/request-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitRequest, recoverRequest, refreshRequestSlot } from "./actions";

const messages = {
  slot_unavailable:
    "This slot is no longer available. Your draft is preserved; choose another slot.",
  student_overlap: "This consultation overlaps one of your pending or approved bookings.",
  slot_changed: "The slot details have changed. Refresh and review them before submitting again.",
  idempotency_mismatch: "This request cannot be changed while its submission is being resolved.",
};
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function RequestForm({ initialSlot }: { initialSlot: RequestSlot }) {
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  const [slot, setSlot] = useState(initialSlot);
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [attempt, setAttempt] = useState<RequestInput | null>(null);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [needsReview, setNeedsReview] = useState(false);
  const [reviewReady, setReviewReady] = useState(false);
  const locked = !hydrated || pending || attempt !== null;
  const field = result?.kind === "validation_error" ? result.field : null;

  async function submit() {
    if (busy.current || needsReview) return;
    busy.current = true;
    setPending(true);
    const intent = attempt ?? {
      slotId: slot.slotId,
      slotVersion: slot.slotVersion,
      topic,
      questions,
      idempotencyKey: crypto.randomUUID(),
    };
    setAttempt(intent);
    try {
      // Missing recovery is not proof of rollback: replay exactly the same intent.
      let next: ReceiptResult;
      if (attempt) {
        const recovered = await recoverRequest({ idempotencyKey: intent.idempotencyKey });
        next = recovered.kind === "success" ? recovered : await submitRequest(intent);
      } else next = await submitRequest(intent);
      setResult(next);
      if (next.kind !== "outcome_unknown" && next.kind !== "temporarily_unavailable")
        setAttempt(null);
      if (next.kind === "conflict" && next.reason === "slot_changed") setNeedsReview(true);
    } catch (error) {
      unstable_rethrow(error);
      setResult({ kind: "outcome_unknown", correlationId: crypto.randomUUID() });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  async function refreshDetails() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      const refreshed = await refreshRequestSlot({ slotId: slot.slotId });
      if (refreshed.kind === "success") {
        setSlot(refreshed.slot);
        setReviewReady(true);
      } else setResult({ kind: "conflict", reason: "slot_unavailable" });
    } catch (error) {
      unstable_rethrow(error);
      setResult({ kind: "temporarily_unavailable", correlationId: crypto.randomUUID() });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  if (result?.kind === "success")
    return (
      <section role="status" className="space-y-3 rounded-lg border bg-card p-4 break-words">
        <h2 className="text-xl font-semibold">
          {result.receipt.status === "pending"
            ? "Request submitted — pending lecturer approval"
            : `Request recovered — ${result.receipt.status}`}
        </h2>
        <p>Status: {result.receipt.status}</p>
        <p className="break-all">Booking reference: {result.receipt.bookingId}</p>
        <a href="/student/slots" className="underline focus-visible:outline-2">
          Browse available slots
        </a>
      </section>
    );

  return (
    <div className="space-y-5">
      <section
        aria-label="Selected consultation slot"
        className="rounded-lg border bg-card p-4 break-words"
      >
        <p>
          <strong>Course: </strong>
          {slot.courseCode} — {slot.courseName}
        </p>
        <p>
          <strong>Lecturer: </strong>
          {slot.lecturerName}
        </p>
        <p>Starts: {formatSingaporeDateTime(slot.startsAt)} (SGT)</p>
        <p>Ends: {formatSingaporeDateTime(slot.endsAt)} (SGT)</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The slot is reserved only when your request is submitted successfully.
        </p>
      </section>
      <form
        method="post"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="space-y-4"
        aria-busy={pending}
      >
        <noscript>Enable JavaScript to review and submit a consultation request.</noscript>
        <div>
          <Label htmlFor="topic" className="font-medium">
            Consultation topic (required)
          </Label>
          <Input
            id="topic"
            name="topic"
            required
            value={topic}
            disabled={locked}
            onChange={(event) => setTopic(event.target.value)}
            aria-invalid={field === "topic"}
            aria-describedby="topic-help"
            className="mt-1"
          />
          <p id="topic-help" className="mt-1 text-sm text-muted-foreground">
            {field === "topic"
              ? "Enter a topic of 1–200 characters."
              : "1–200 characters after trimming."}
          </p>
        </div>
        <div>
          <Label htmlFor="questions" className="font-medium">
            Questions (required)
          </Label>
          <Textarea
            id="questions"
            name="questions"
            required
            rows={6}
            value={questions}
            disabled={locked}
            onChange={(event) => setQuestions(event.target.value)}
            aria-invalid={field === "questions"}
            aria-describedby="questions-help"
            className="mt-1"
          />
          <p id="questions-help" className="mt-1 text-sm text-muted-foreground">
            {field === "questions"
              ? "Enter questions of 1–2,000 characters."
              : "1–2,000 characters after trimming."}
          </p>
        </div>
        <div role="status" aria-live="polite" className="break-words text-sm">
          {pending && <p>Submitting or checking your request…</p>}
          {result?.kind === "validation_error" && (
            <p>
              Please correct the {field === "request" ? "request fields" : field} and submit again.
            </p>
          )}
          {result?.kind === "conflict" && <p>{messages[result.reason]}</p>}
          {result?.kind === "forbidden_or_not_found" && (
            <p>This request is not available to your account.</p>
          )}
          {result?.kind === "temporarily_unavailable" && (
            <p>
              The service is temporarily unavailable. Retry the same request. Reference:{" "}
              {result.correlationId}
            </p>
          )}
          {result?.kind === "outcome_unknown" && (
            <p>
              Unable to confirm the result. Your request may have been saved. Keep this page open
              and retry to recover the same request. Reference: {result.correlationId}
            </p>
          )}
        </div>
        {needsReview ? (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void refreshDetails()}
            >
              Refresh slot details
            </Button>
            {reviewReady && (
              <Button
                type="button"
                variant="outline"
                className="block"
                onClick={() => {
                  setNeedsReview(false);
                  setReviewReady(false);
                  setResult(null);
                }}
              >
                I have reviewed the updated details
              </Button>
            )}
          </div>
        ) : (
          <Button type="submit" disabled={!hydrated || pending}>
            {pending ? "Submitting…" : attempt ? "Retry same request" : "Submit request"}
          </Button>
        )}
      </form>
    </div>
  );
}
