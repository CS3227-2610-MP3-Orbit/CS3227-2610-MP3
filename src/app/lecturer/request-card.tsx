"use client";
import { useActionState } from "react";
import { decideRequestAction, type DecisionActionState } from "./request-actions";
import type { Request } from "@/features/lecturer/requests-validation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initial: DecisionActionState = { kind: "idle" };
const selectClass =
  "block h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function RequestCard({ request }: { request: Request }) {
  const [state, action, pending] = useActionState(decideRequestAction, initial);
  return (
    <li className="rounded-lg border bg-card p-4 space-y-2 break-words">
      <p>
        <strong>
          {request.courseCode} — {request.courseName}
        </strong>
      </p>
      <p>{new Date(request.startsAt).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}</p>
      <p>Topic: {request.topic}</p>
      <p>Questions: {request.questions}</p>
      <form action={action} className="space-y-2">
        <input type="hidden" name="bookingId" value={request.bookingId} />
        <input type="hidden" name="version" value={request.version} />
        <input type="hidden" name="operationKey" value={crypto.randomUUID()} />
        <Label className="font-normal">
          Rejection reason
          <select name="reason" defaultValue="Lecturer unavailable" className={selectClass}>
            <option>Lecturer unavailable</option>
            <option>Family or medical reasons</option>
            <option>Other scheduling reason</option>
          </select>
        </Label>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={pending}
            variant="outline"
            name="decision"
            value="approved"
          >
            Approve
          </Button>
          <Button
            type="submit"
            disabled={pending}
            variant="outline"
            name="decision"
            value="rejected"
          >
            Reject
          </Button>
        </div>
      </form>
      {state.kind === "success" && (
        <p role="status">
          Request {state.status}.{" "}
          {state.notificationPending
            ? "The student notification will be retried."
            : "The student was notified."}
        </p>
      )}
      {state.kind === "conflict" && (
        <p role="alert">
          This request was already decided or is no longer available. Refresh and try again.
        </p>
      )}
    </li>
  );
}
