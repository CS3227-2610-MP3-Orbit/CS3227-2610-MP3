"use client";
import { useActionState } from "react";
import { decideRequestAction, type DecisionActionState } from "./request-actions";
import type { Request } from "@/features/lecturer/requests-validation";
const initial: DecisionActionState = { kind: "idle" };
export function RequestCard({ request }: { request: Request }) {
  const [state, action, pending] = useActionState(decideRequestAction, initial);
  return (
    <li className="rounded border p-4 space-y-2 break-words">
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
        <label className="block">
          Rejection reason
          <select name="reason" defaultValue="Lecturer unavailable" className="block border p-1">
            <option>Lecturer unavailable</option>
            <option>Family or medical reasons</option>
            <option>Other scheduling reason</option>
          </select>
        </label>
        <button
          disabled={pending}
          name="decision"
          value="approved"
          className="mr-2 rounded border px-3 py-1"
        >
          Approve
        </button>
        <button
          disabled={pending}
          name="decision"
          value="rejected"
          className="rounded border px-3 py-1"
        >
          Reject
        </button>
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
