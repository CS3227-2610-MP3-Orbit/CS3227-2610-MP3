"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking, BookingResult } from "@/features/student/bookings/manage-validation";
import { formatSingaporeDateTime } from "@/features/student/slots/format";
import { submitBookingCancellation, submitBookingUpdate } from "../actions";
const control =
  "mt-1 block w-full rounded border p-2 focus-visible:outline-2 focus-visible:outline-offset-2";
type Attempt =
  | {
      kind: "update";
      input: {
        bookingId: string;
        version: string;
        topic: string;
        questions: string;
        idempotencyKey: string;
      };
    }
  | {
      kind: "cancel";
      input: { bookingId: string; version: string; idempotencyKey: string };
    };
export default function BookingManager({ booking: initial }: { booking: Booking }) {
  const router = useRouter();
  const [booking, setBooking] = useState(initial),
    [editing, setEditing] = useState(false),
    [topic, setTopic] = useState(initial.topic),
    [questions, setQuestions] = useState(initial.questions),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(false),
    [attempt, setAttempt] = useState<Attempt | null>(null);
  const busy = useRef(false);
  const actionable = booking.status === "pending" || booking.status === "approved";
  async function run(kind: "update" | "cancel") {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setMessage("");
    try {
      const nextAttempt =
        attempt && attempt.kind === kind
          ? attempt
          : kind === "update"
            ? {
                kind,
                input: {
                  bookingId: booking.bookingId,
                  version: booking.version,
                  topic,
                  questions,
                  idempotencyKey: crypto.randomUUID(),
                },
              }
            : {
                kind,
                input: {
                  bookingId: booking.bookingId,
                  version: booking.version,
                  idempotencyKey: crypto.randomUUID(),
                },
              };
      setAttempt(nextAttempt);
      const result: BookingResult =
        nextAttempt.kind === "update"
          ? await submitBookingUpdate(nextAttempt.input)
          : await submitBookingCancellation(nextAttempt.input);
      if (result.kind === "success") {
        setBooking(result.booking);
        setTopic(result.booking.topic);
        setQuestions(result.booking.questions);
        setEditing(false);
        setAttempt(null);
        setMessage(kind === "update" ? "Booking updated." : "Booking cancelled.");
        router.refresh();
      } else if (result.kind === "conflict") {
        setAttempt(null);
        setMessage("This booking changed. Refresh to see its current status.");
      } else if (result.kind === "validation_error") {
        setAttempt(null);
        setMessage("Please correct the highlighted booking details.");
      } else {
        setMessage("Booking action outcome is unknown. Retry the same action to recover it.");
      }
    } catch {
      setMessage("Booking action outcome is unknown. Retry the same action to recover it.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <section className="space-y-4" aria-busy={pending}>
      <section className="rounded border p-4 break-words">
        <p>
          <strong>
            {booking.courseCode} — {booking.courseName}
          </strong>
        </p>
        <p>Lecturer: {booking.lecturerName}</p>
        <p>Starts: {formatSingaporeDateTime(booking.startsAt)} (SGT)</p>
        <p>Ends: {formatSingaporeDateTime(booking.endsAt)} (SGT)</p>
        <p>Status: {booking.status}</p>
        <p className="mt-3 whitespace-pre-wrap">Topic: {booking.topic}</p>
        <p className="whitespace-pre-wrap">Questions: {booking.questions}</p>
      </section>
      <div role="status" aria-live="polite">
        {message}
      </div>
      {attempt && !pending && (
        <button
          type="button"
          className="rounded border px-3 py-2 focus-visible:outline-2"
          onClick={() => void run(attempt.kind)}
        >
          Retry {attempt.kind === "update" ? "update" : "cancellation"}
        </button>
      )}
      {booking.status === "pending" && !editing && (
        <button
          type="button"
          className="rounded border px-3 py-2 focus-visible:outline-2"
          onClick={() => setEditing(true)}
          disabled={pending}
        >
          Edit booking
        </button>
      )}
      {editing && (
        <form
          method="post"
          onSubmit={(e) => {
            e.preventDefault();
            void run("update");
          }}
          className="space-y-3"
        >
          <div>
            <label htmlFor="topic">Topic</label>
            <input
              id="topic"
              name="topic"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setAttempt(null);
              }}
              disabled={pending}
              className={control}
            />
          </div>
          <div>
            <label htmlFor="questions">Questions</label>
            <textarea
              id="questions"
              name="questions"
              value={questions}
              onChange={(e) => {
                setQuestions(e.target.value);
                setAttempt(null);
              }}
              disabled={pending}
              className={control}
            />
          </div>
          <button
            className="rounded bg-black px-3 py-2 text-white focus-visible:outline-2"
            disabled={pending}
          >
            Save changes
          </button>
          <button
            type="button"
            className="ml-2 underline"
            disabled={pending}
            onClick={() => setEditing(false)}
          >
            Cancel edit
          </button>
        </form>
      )}
      {actionable && (
        <div className="space-y-2 border-t pt-4">
          <p>Cancellation cannot be undone and is available only before the scheduled start.</p>
          <button
            type="button"
            className="rounded border px-3 py-2 focus-visible:outline-2"
            disabled={pending}
            onClick={() => void run("cancel")}
          >
            Cancel booking
          </button>
        </div>
      )}
    </section>
  );
}
