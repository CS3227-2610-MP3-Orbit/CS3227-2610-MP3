"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { unstable_rethrow } from "next/navigation";
import { formatSingaporeDateTime } from "@/features/student/slots/format";
import {
  type RequestInput,
  type RequestSlot,
  type ReceiptResult,
} from "@/features/student/bookings/request-validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ImproveResult } from "@/features/student/bookings/improve-request-validation";
import { validateProposalForApply } from "@/features/student/bookings/improve-request-validation";
import { type Advice } from "@/lib/ai/output-validation";
import { statusBadgeVariant } from "@/lib/status-badge";
import { improveRequest, submitRequest, recoverRequest, refreshRequestSlot } from "./actions";

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
  const [aiPending, setAiPending] = useState(false);
  const aiBusy = useRef(false);
  const [aiResult, setAiResult] = useState<ImproveResult | null>(null);
  const [proposal, setProposal] = useState<Advice | null>(null);
  const [sourceSnapshot, setSourceSnapshot] = useState<{ topic: string; questions: string } | null>(
    null,
  );
  const [proposalError, setProposalError] = useState<"topic" | "questions" | null>(null);
  const [confirmApply, setConfirmApply] = useState(false);
  const [appliedProposal, setAppliedProposal] = useState(false);
  const locked = !hydrated || pending || attempt !== null;
  const field = result?.kind === "validation_error" ? result.field : null;

  async function improve() {
    if (aiBusy.current || aiPending) return;
    aiBusy.current = true;
    setAiPending(true);
    try {
      const next = await improveRequest({ topic, questions });
      setAiResult(next);
      if (next.kind === "success") {
        setProposal(next.proposal);
        setSourceSnapshot({ topic, questions });
        setConfirmApply(false);
        setAppliedProposal(false);
      }
    } catch (error) {
      unstable_rethrow(error);
      setAiResult({ kind: "ai_unavailable", reason: "unavailable" });
    } finally {
      aiBusy.current = false;
      setAiPending(false);
    }
  }

  function applyProposal() {
    if (!proposal) return;
    const parsed = validateProposalForApply(proposal);
    if (!parsed.success) {
      setProposalError(parsed.field);
      return;
    }
    if (
      sourceSnapshot &&
      (sourceSnapshot.topic !== topic || sourceSnapshot.questions !== questions) &&
      !confirmApply
    ) {
      setConfirmApply(true);
      return;
    }
    setProposalError(null);
    setTopic(parsed.data.topic);
    setQuestions(parsed.data.questions);
    setProposal(null);
    setSourceSnapshot(null);
    setConfirmApply(false);
    setAppliedProposal(true);
  }

  function dismissProposal() {
    setProposal(null);
    setSourceSnapshot(null);
    setConfirmApply(false);
  }

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
        <p>
          Status:{" "}
          <Badge variant={statusBadgeVariant(result.receipt.status)}>{result.receipt.status}</Badge>
        </p>
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
        <section
          className="space-y-4 rounded-lg border border-border bg-muted p-4 shadow-sm sm:p-5"
          aria-label="Improve your draft with AI"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Improve your draft with AI</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Get a suggested rewrite, then choose exactly what to use in your request.
            </p>
          </div>
          <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm leading-5 text-foreground">
            Generating uses one AI request. Apply and Dismiss use no AI request. Review and edit any
            generated proposal yourself before submitting your request.
          </p>
          <button
            type="button"
            disabled={!hydrated || aiPending}
            onClick={() => void improve()}
            className="min-h-11 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {aiPending
              ? "Improving draft…"
              : proposal
                ? "Generate again"
                : appliedProposal
                  ? "Generate another suggestion"
                  : "Improve my request"}
          </button>
          <div role="status" aria-live="polite" className="break-words">
            {aiPending && <p>Improving your draft…</p>}
            {aiResult?.kind === "validation_error" && (
              <p>
                Please correct the {aiResult.field === "request" ? "draft fields" : aiResult.field}
                before requesting AI advice.
              </p>
            )}
            {aiResult?.kind === "quota_exceeded" && (
              <p>
                AI request limit reached. You can still write and submit your consultation request
                manually.
              </p>
            )}
            {aiResult?.kind === "in_flight" && (
              <p>Your draft is already being improved. Please wait.</p>
            )}
            {aiResult?.kind === "unresolved_attempt" && (
              <p>
                We could not confirm the AI result. You can continue writing and submitting
                manually.
              </p>
            )}
            {aiResult?.kind === "ai_unavailable" && (
              <p>
                AI advice is temporarily unavailable. You can still write and submit your
                consultation request manually.
              </p>
            )}
          </div>
          <section aria-label="Generated advice" className="min-h-10 break-words">
            {appliedProposal && (
              <p
                role="status"
                className="mb-3 rounded-md border border-border bg-muted px-3 py-2 text-sm leading-5 text-foreground"
              >
                AI suggestion applied to your request. You can still edit the fields before
                submitting.
              </p>
            )}
            {proposal ? (
              <div
                className="space-y-5 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
                aria-busy={aiPending}
              >
                <div className="space-y-1 border-b border-border pb-4">
                  <h3 className="text-base font-semibold text-foreground">Suggested improvement</h3>
                  <p className="text-sm leading-5 text-muted-foreground">
                    Edit the suggestion if needed, then apply it to the request form below.
                  </p>
                </div>
                {sourceSnapshot &&
                  (sourceSnapshot.topic !== topic || sourceSnapshot.questions !== questions) && (
                    <p
                      role="status"
                      className="rounded-md border border-border bg-muted px-3 py-2 text-sm leading-5 text-foreground"
                    >
                      Applying this proposal will replace your current topic and questions with the
                      generated snapshot.
                    </p>
                  )}
                <div className="space-y-1">
                  <label htmlFor="proposed-topic" className="font-semibold text-foreground">
                    Generated topic
                  </label>
                  <Input
                    id="proposed-topic"
                    value={proposal.topic}
                    aria-invalid={proposalError === "topic"}
                    aria-describedby="proposed-topic-error"
                    onChange={(event) => {
                      setConfirmApply(false);
                      setProposal({ ...proposal, topic: event.target.value });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="proposed-questions" className="font-semibold text-foreground">
                    Generated questions
                  </label>
                  <Textarea
                    id="proposed-questions"
                    rows={5}
                    value={proposal.questions}
                    aria-invalid={proposalError === "questions"}
                    aria-describedby="proposed-questions-error"
                    onChange={(event) => {
                      setConfirmApply(false);
                      setProposal({ ...proposal, questions: event.target.value });
                    }}
                  />
                </div>
                {/* Retained proposal suggestions, initially sourced from aiResult.proposal.suggestions. */}
                {proposal.suggestions.length > 0 && (
                  <div className="rounded-md border border-border bg-muted p-4">
                    <p className="font-semibold text-foreground">Suggestions</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                      {proposal.suggestions.map((suggestion, index) => (
                        <li key={`${index}-${suggestion}`}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                  {/* >Apply to request< >Dismiss< */}
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmApply(false);
                      applyProposal();
                    }}
                    className="min-h-12 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Apply to request
                  </button>
                  <button
                    type="button"
                    onClick={dismissProposal}
                    className="min-h-12 rounded-md border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Dismiss
                  </button>
                </div>
                {confirmApply && (
                  <section
                    aria-labelledby="confirm-apply-title"
                    aria-describedby="confirm-apply-description"
                    className="space-y-3 rounded-md border-2 border-border bg-muted p-4"
                  >
                    <div className="space-y-1">
                      <h4 id="confirm-apply-title" className="font-semibold text-foreground">
                        Replace your current draft?
                      </h4>
                      <p
                        id="confirm-apply-description"
                        className="text-sm leading-5 text-foreground"
                      >
                        Your topic or questions changed after this suggestion was generated.
                        Confirming will replace both fields with the generated version.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setConfirmApply(false)}
                        className="min-h-11 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        Keep my current draft
                      </button>
                      <button
                        type="button"
                        onClick={applyProposal}
                        className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        Apply suggestion
                      </button>
                    </div>
                  </section>
                )}
                {proposalError && (
                  <p
                    id={`proposed-${proposalError}-error`}
                    role="alert"
                    className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    Generated {proposalError} must be within the allowed length.
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border bg-card px-3 py-4 text-sm text-muted-foreground">
                Generated advice will appear here.
              </p>
            )}
          </section>
        </section>
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
