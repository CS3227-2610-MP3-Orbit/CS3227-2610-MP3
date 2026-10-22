"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking, BookingResult } from "@/features/student/bookings/manage-validation";
import { formatSingaporeDateTime } from "@/features/student/slots/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { statusBadgeVariant } from "@/lib/status-badge";
import { submitBookingCancellation, submitBookingUpdate } from "../actions";
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
    [confirmingCancel, setConfirmingCancel] = useState(false),
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
        setConfirmingCancel(false);
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
      <section className="rounded-lg border bg-card p-4 break-words">
        <p>
          <strong>
            {booking.courseCode} — {booking.courseName}
          </strong>
        </p>
        <p>Lecturer: {booking.lecturerName}</p>
        <p>Starts: {formatSingaporeDateTime(booking.startsAt)}</p>
        <p>Ends: {formatSingaporeDateTime(booking.endsAt)}</p>
        <p>
          Status: <Badge variant={statusBadgeVariant(booking.status)}>{booking.status}</Badge>
        </p>
        <p className="mt-3 whitespace-pre-wrap">Topic: {booking.topic}</p>
        <p className="whitespace-pre-wrap">Questions: {booking.questions}</p>
        {booking.rejectionReason && (
          <p className="whitespace-pre-wrap">Rejection reason: {booking.rejectionReason}</p>
        )}
      </section>
      <div role="status" aria-live="polite">
        {message}
      </div>
      {attempt && !pending && (
        <Button type="button" variant="outline" onClick={() => void run(attempt.kind)}>
          Retry {attempt.kind === "update" ? "update" : "cancellation"}
        </Button>
      )}
      {booking.status === "pending" && !editing && (
        <Button type="button" variant="outline" onClick={() => setEditing(true)} disabled={pending}>
          Edit booking
        </Button>
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              name="topic"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setAttempt(null);
              }}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="questions">Questions</Label>
            <Textarea
              id="questions"
              name="questions"
              value={questions}
              onChange={(e) => {
                setQuestions(e.target.value);
                setAttempt(null);
              }}
              disabled={pending}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              Save changes
            </Button>
            <Button
              type="button"
              variant="link"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Cancel edit
            </Button>
          </div>
        </form>
      )}
      {actionable && (
        <div className="space-y-2 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Cancellation cannot be undone and is available only before the scheduled start.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setConfirmingCancel(true)}
          >
            Cancel booking
          </Button>
          {confirmingCancel && (
            <div className="space-y-2 rounded-md border border-destructive/50 p-3" role="alert">
              <p>This cancellation cannot be undone. Do you want to continue?</p>
              <div className="flex items-center gap-3">
                <Button type="button" disabled={pending} onClick={() => void run("cancel")}>
                  Confirm cancellation
                </Button>
                <Button
                  type="button"
                  variant="link"
                  disabled={pending}
                  onClick={() => setConfirmingCancel(false)}
                >
                  Keep booking
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
