"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { unstable_rethrow } from "next/navigation";
import { formatSingaporeDateTime } from "@/features/student/slots/format";
import {
  type RequestInput,
  type RequestSlot,
  type ReceiptResult,
} from "@/features/student/bookings/request-validation";
import { type ImproveResult } from "@/features/student/bookings/improve-request-validation";
import { validateProposalForApply } from "@/features/student/bookings/improve-request-validation";
import { type Advice } from "@/lib/ai/output-validation";
import { improveRequest, submitRequest, recoverRequest, refreshRequestSlot } from "./actions";

const messages = {
  slot_unavailable:
    "This slot is no longer available. Your draft is preserved; choose another slot.",
  student_overlap: "This consultation overlaps one of your pending or approved bookings.",
  slot_changed: "The slot details have changed. Refresh and review them before submitting again.",
  idempotency_mismatch: "This request cannot be changed while its submission is being resolved.",
};
const control =
  "mt-1 block w-full min-w-0 rounded border p-2 focus-visible:outline-2 focus-visible:outline-offset-2";
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
      <section role="status" className="space-y-3 rounded border p-4 break-words">
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
      <section aria-label="Selected consultation slot" className="rounded border p-4 break-words">
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
        <p className="mt-2 text-sm">
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
          <label htmlFor="topic" className="font-medium">
            Consultation topic (required)
          </label>
          <input
            id="topic"
            name="topic"
            required
            value={topic}
            disabled={locked}
            onChange={(event) => setTopic(event.target.value)}
            aria-invalid={field === "topic"}
            aria-describedby="topic-help"
            className={control}
          />
          <p id="topic-help" className="text-sm">
            {field === "topic"
              ? "Enter a topic of 1–200 characters."
              : "1–200 characters after trimming."}
          </p>
        </div>
        <div>
          <label htmlFor="questions" className="font-medium">
            Questions (required)
          </label>
          <textarea
            id="questions"
            name="questions"
            required
            rows={6}
            value={questions}
            disabled={locked}
            onChange={(event) => setQuestions(event.target.value)}
            aria-invalid={field === "questions"}
            aria-describedby="questions-help"
            className={control}
          />
          <p id="questions-help" className="text-sm">
            {field === "questions"
              ? "Enter questions of 1–2,000 characters."
              : "1–2,000 characters after trimming."}
          </p>
        </div>
        <div role="status" aria-live="polite" className="break-words">
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
          className="space-y-4 rounded-lg border border-slate-300 bg-slate-50 p-4 shadow-sm sm:p-5"
          aria-label="Improve your draft with AI"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-950">Improve your draft with AI</h2>
            <p className="text-sm leading-6 text-slate-700">
              Get a suggested rewrite, then choose exactly what to use in your request.
            </p>
          </div>
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950">
            Generating uses one AI request. Apply and Dismiss use no AI request. Review and edit any
            generated proposal yourself before submitting your request.
          </p>
          <button
            type="button"
            disabled={!hydrated || aiPending}
            onClick={() => void improve()}
            className="min-h-11 rounded-md border border-slate-700 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
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
                className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-5 text-emerald-950"
              >
                AI suggestion applied to your request. You can still edit the fields before
                submitting.
              </p>
            )}
            {proposal ? (
              <div
                className="space-y-5 rounded-lg border border-blue-200 bg-white p-4 shadow-sm sm:p-5"
                aria-busy={aiPending}
              >
                <div className="space-y-1 border-b border-slate-200 pb-4">
                  <h3 className="text-base font-semibold text-slate-950">Suggested improvement</h3>
                  <p className="text-sm leading-5 text-slate-600">
                    Edit the suggestion if needed, then apply it to the request form below.
                  </p>
                </div>
                {sourceSnapshot &&
                  (sourceSnapshot.topic !== topic || sourceSnapshot.questions !== questions) && (
                    <p
                      role="status"
                      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950"
                    >
                      Applying this proposal will replace your current topic and questions with the
                      generated snapshot.
                    </p>
                  )}
                <div className="space-y-1">
                  <label htmlFor="proposed-topic" className="font-semibold text-slate-900">
                    Generated topic
                  </label>
                  <input
                    id="proposed-topic"
                    value={proposal.topic}
                    aria-invalid={proposalError === "topic"}
                    aria-describedby="proposed-topic-error"
                    onChange={(event) => {
                      setConfirmApply(false);
                      setProposal({ ...proposal, topic: event.target.value });
                    }}
                    className={control}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="proposed-questions" className="font-semibold text-slate-900">
                    Generated questions
                  </label>
                  <textarea
                    id="proposed-questions"
                    rows={5}
                    value={proposal.questions}
                    aria-invalid={proposalError === "questions"}
                    aria-describedby="proposed-questions-error"
                    onChange={(event) => {
                      setConfirmApply(false);
                      setProposal({ ...proposal, questions: event.target.value });
                    }}
                    className={control}
                  />
                </div>
                {/* Retained proposal suggestions, initially sourced from aiResult.proposal.suggestions. */}
                {proposal.suggestions.length > 0 && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Suggestions</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                      {proposal.suggestions.map((suggestion, index) => (
                        <li key={`${index}-${suggestion}`}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                  {/* >Apply to request< >Dismiss< */}
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmApply(false);
                      applyProposal();
                    }}
                    className="min-h-12 rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  >
                    Apply to request
                  </button>
                  <button
                    type="button"
                    onClick={dismissProposal}
                    className="min-h-12 rounded-md border border-slate-400 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  >
                    Dismiss
                  </button>
                </div>
                {confirmApply && (
                  <section
                    aria-labelledby="confirm-apply-title"
                    aria-describedby="confirm-apply-description"
                    className="space-y-3 rounded-md border-2 border-amber-300 bg-amber-50 p-4"
                  >
                    <div className="space-y-1">
                      <h4 id="confirm-apply-title" className="font-semibold text-amber-950">
                        Replace your current draft?
                      </h4>
                      <p
                        id="confirm-apply-description"
                        className="text-sm leading-5 text-amber-950"
                      >
                        Your topic or questions changed after this suggestion was generated.
                        Confirming will replace both fields with the generated version.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setConfirmApply(false)}
                        className="min-h-11 rounded-md border border-amber-900 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
                      >
                        Keep my current draft
                      </button>
                      <button
                        type="button"
                        onClick={applyProposal}
                        className="min-h-11 rounded-md bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
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
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  >
                    Generated {proposalError} must be within the allowed length.
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-600">
                Generated advice will appear here.
              </p>
            )}
          </section>
        </section>
        {needsReview ? (
          <div className="space-y-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => void refreshDetails()}
              className="rounded border p-2 focus-visible:outline-2"
            >
              Refresh slot details
            </button>
            {reviewReady && (
              <button
                type="button"
                onClick={() => {
                  setNeedsReview(false);
                  setReviewReady(false);
                  setResult(null);
                }}
                className="block rounded border p-2 focus-visible:outline-2"
              >
                I have reviewed the updated details
              </button>
            )}
          </div>
        ) : (
          <button
            type="submit"
            disabled={!hydrated || pending}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {pending ? "Submitting…" : attempt ? "Retry same request" : "Submit request"}
          </button>
        )}
      </form>
    </div>
  );
}
