---
id: STU-04
title: Manage my bookings
owner: joseph
status: approved
---

# STU-04: Manage my bookings

## Document control

- Task: `STU-04-SPEC`; authored by the assigned `requirements_architect` on 2026-10-18.
- Reviewed repository commit: `378e421`; current branch: `student-manage-bookings`.
- Approval: Joseph reported whole-team approval of this revised specification for implementation on
  2026-10-18. Individual reviewers and remote PR approval are not independently verified. This records
  product approval only; it does not approve a merge, deployment, or sensitive change. The resulting
  exact file digest is recorded in the STU-04 handoff and Joseph log to avoid modifying the hashed file.
- Sources: Joseph's requested Student behaviours; implemented `STU-02` digest
  `fa2e3f2e68810ad6ab5e1603a753b21bd8c4c384`; shared `SH-01`, `SH-02`, `SH-03`, and `SH-05`.
- Related plan: `workflow/plans/stu-04-manage-my-bookings.md`; latest predecessor handoff:
  `workflow/handoffs/stu-02/latest.md`.
- Confirmed: list course, Lecturer, date/time, literal status and topic summary; show full topic/questions
  and actions only on owned detail; edit both fields while pending, including after start; no pagination
  in this cycle; cancel own pending/approved strictly before start.
- Confirmed: edit/cancel use idempotency key plus expected version; first valid Student-cancel/Lecturer-
  decision transition wins as specified in R5.
- Proposed: ordering, summary truncation, key/version encoding, text bounds, and UI wording.
- Unresolved: no product decision blocks approval; exact proposed API/UI details need review.

## Product and feature description

An active Student can inspect their consultation-request history and manage a still-actionable request.
They can see whether each request is pending, approved, rejected, cancelled, or completed; update the
consultation content while it is pending; and cancel an owned pending or approved booking before its
scheduled start. The result remains durable workflow history, rather than deleting the booking.

## Scope, non-goals, and dependencies

### In scope

- Authenticated Student list/detail read of owned bookings and their status.
- Pending-only content update and pre-start pending/approved cancellation.
- Server/database ownership, state, time, integrity, concurrency, safe failure, accessibility, and no-AI
  behaviour for these actions.

### Non-goals

- Creating a request (STU-02), Lecturer approval/rejection/completion, notifications, rescheduling,
  deleting history, booking a newly released slot, staff/admin booking reads, and AI request improvement.
- Resolving bookings affected by course, Lecturer, or assignment lifecycle changes (`SH-05-R7`).

### Dependencies

- `SH-01` trusted active session/role and own-profile boundary.
- `SH-03` status-based available-slot visibility; `SH-05-R2` through `R5`, `R8`, and `R9` for durable
  booking history, transition semantics, reservation release, conflict prevention, and no AI.
- STU-02's existing booking schema and request RPCs are current-state evidence only, not an API contract
  for this feature.

## Users, roles, and permissions

| Actor                                 | Allowed actions/data                                                                                  | Refused actions/data                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Active Student                        | Their own booking projection; edit own pending content; cancel own pending/approved pre-start booking | Another Student's booking, Lecturer decision/completion, supplied owner/status/time |
| Signed-out/inactive/wrong-role caller | Login/role routing only                                                                               | List, detail, edit, cancel, or existence information                                |
| Lecturer/Administrator                | Nothing through this Student boundary                                                                 | Student list/detail/action endpoints                                                |

Identity, role, active state, database time, booking ownership, status, and slot start come from trusted
server/database state. A hidden button or client identifier is never authorization.

## Functional requirements

### STU-04-R1 — Owned booking visibility

- Classification: `confirmed`.
- Source: Joseph's “View my bookings” request; `SH-05-R2` durable ownership/history.

An active Student can retrieve only bookings where the trusted authenticated identity is `student_id`.
Each returned booking exposes its opaque booking/slot identifiers, status, course code/name, Lecturer
display name, slot start/end as canonical UTC instants, and the Student's own submitted content. It must
not disclose another student's data, staff contact/audit/active-state fields, rejection reason, or any
unallowlisted field. All five stored statuses (`pending`, `approved`, `rejected`, `cancelled`,
`completed`) are displayed as literal text.

### STU-04-R2 — List states and history

- Classification: `confirmed` for visibility and no pagination; `proposed` for ordering/truncation.
- Source: Joseph's request; `SH-05-R2/R4` history preservation.

The list includes owned terminal history as well as active requests; an empty owned history is distinct
from an unavailable dependency. It has no pagination in this cycle and shows only course, Lecturer,
date/time, literal status, and topic summary. Full topic/questions/actions are only in owned detail.
Exact ordering/truncation are proposed. A list/detail response never reports inaccessible-ID existence.

### STU-04-R3 — Pending request content update

- Classification: `confirmed`.
- Source: Joseph's “Edit the consultation description while the request is pending”; `SH-05-R3` state
  protocol.

Only the owner of a `pending` booking may update both `topic` and `questions`, including after its
scheduled start while it remains pending. Edits use bounded server/database validation and do not mutate
slot, owner, status, rejection reason, or audit history.

### STU-04-R4 — Safe pending edit concurrency

- Classification: `confirmed` for idempotency/version and atomic outcome; `proposed` for encoding.
- Source: team decision supplied by Joseph; shared specs require atomic conditional writes.

Each edit/cancel intent carries an idempotency key and expected version from owned detail. Conditional
database updates verify trusted owner, allowed state, expected version, and time. Same-intent replay
safely returns its original outcome; stale/changing state or key/payload mismatch returns safe
changed/refresh conflict without overwriting a winner or revealing the competing actor/action.

### STU-04-R5 — Student cancellation

- Classification: `confirmed`.
- Source: Joseph's request; `SH-05-R3/R4`.

Only the owner may atomically transition an owned `pending` or `approved` booking to `cancelled`, and
only when database time is strictly earlier than the slot start. Cancellation at or after start, from
rejected/cancelled/completed, or by another actor fails without a mutation. Competing transitions are
atomic: first valid transition wins; approval-first remains cancellable pre-start, cancellation-first
blocks Lecturer decision, and the loser receives changed/refresh conflict. A successful cancellation
preserves booking/content/history and releases the slot under the shared available-slot predicate; it
does not delete, approve, or create a booking.

### STU-04-R6 — Read/update/cancel authorization and safe failures

- Classification: `confirmed`.
- Source: `SH-01`, `SH-05-R2/R3/R8`; project `AGENTS.md`.

Every protected page, Server Action, Route Handler, and database function checks an active Student before
accessing protected data. Database functions independently derive `auth.uid()` and refuse direct table
access. Signed-out, inactive, wrong-role, missing, and foreign-booking calls return the same safe
`forbidden_or_not_found` outcome. Validation, conflict, and temporary dependency failures are typed,
contain no raw error/SQL/private content, and leave no partial mutation.

### STU-04-R7 — Input and resource bounds

- Classification: `proposed`.
- Source: STU-02's approved input safety approach; exact STU-04 limits are not supplied.

Edit accepts only canonical booking ID, expected version, idempotency key, topic, and questions;
cancellation accepts booking ID, expected version, and idempotency key. Unknown/repeated/array/non-string
fields, invalid IDs/versions, NUL/invalid Unicode, and total encoded input above 16,384 bytes fail before
database work. STU-02's trimmed 1–200 topic/1–2,000 question code-point limits are proposed for reuse.
No pagination/cursor is added in this cycle; ordering/capacity are proposed operational details.

### STU-04-R8 — Accessible, reviewable UI

- Classification: `confirmed` for accessibility; `proposed` for interaction shape.
- Source: `SH-03-R15`; Joseph's view/edit/cancel request.

The UI provides loading, empty, error, status, validation, conflict, and success feedback as text;
keyboard-operable controls; visible focus; programmatic labels; 320 CSS-pixel and 200% zoom usability.
Proposed: an edit form pre-populates approved editable fields and a cancellation confirmation clearly
identifies the booking before submission. Client controls prevent accidental duplicate submissions but
server/database checks remain authoritative.

### STU-04-R9 — Privacy, logging, and abuse resistance

- Classification: `confirmed`.
- Source: `SH-01`, `SH-05-R8`, project policy.

Treat booking content and all client values as untrusted plain text. Render it as text, never HTML;
parameterize database operations; never log content, session material, raw payloads, raw database errors,
or unbounded identifiers. Authorize before returning a result or checking an expected version. Bounded
operation timeouts and failure handling prevent a failed dependency from changing a booking; repeated
cancel/edit submissions must not create extra rows or transitions.

### STU-04-R10 — No AI

- Classification: `confirmed`.
- Source: `SH-05-R9`; separate Student AI feature.

Listing, detail, edit, and cancellation are deterministic. They make no model call, prompt, AI-usage
read/write, or model-authorized decision. Prompt-injection-looking booking text remains inert; model or
provider failure cannot affect ordinary booking management.

## Data model and integrity rules

Bookings remain immutable history rows except approved content/status transitions. An append-only
migration may add a version/audit mechanism only after the editable-field decision is approved; it must
not edit existing migrations. Conditional database updates enforce owner/state/version/time together.
The existing partial unique slot-reservation constraint plus `SH-03-R5` release semantics govern a
successful cancellation. No direct Student grants to bookings, slots, courses, assignments, or staff
profiles are permitted.

## API and boundary contracts

The following are proposals, not implementation authorization:

```ts
type MyBooking = {
  bookingId: string;
  slotId: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  courseCode: string;
  courseName: string;
  lecturerName: string;
  startsAt: string;
  endsAt: string;
  topic: string;
  questions: string;
  version: string;
};
// list: { kind: "success", bookings: MyBooking[] } | SafeFailure
// detail/edit/cancel: { kind: "success", booking: MyBooking } | SafeFailure
```

Only server-side actions call narrow authenticated RPCs. All input/result schemas are strict allowlists.
Updates/cancellation use POST/action semantics with framework origin protection; no GET mutates state.
Exact RPC names, version/key encoding, ordering, summary truncation, and confirmation text remain proposed.

## Security requirements

- Page layout and every Server Action/Route Handler call `requireRole("student")`; database also checks
  trusted active role/identity before reading or mutating.
- The Student can never choose booking owner, Student ID, status, slot time, or target fields.
- Direct table reads/writes remain denied; no service/admin client is used for this ordinary feature.
- Foreign ID, inactive-user, wrong-role, and missing-ID behaviour is non-enumerating; authorization
  precedes version lookup or response construction.
- Cross-origin state changes, GET mutations, duplicate submits, stale edits, decision/cancel races,
  script/SQL/model-instruction text, oversized input, and dependency timeout/failure are tested.
- Migration/RLS/grant/authz changes require independent teammate/CODEOWNER review before merge.

## AI behavior

No AI applies. No booking or identity/content data is transmitted to a model, and no generated output can
edit, cancel, or decide a booking.

## Edge cases and failure paths

| Condition                                       | Required observable outcome                               | Invariant preserved     |
| ----------------------------------------------- | --------------------------------------------------------- | ----------------------- |
| No owned bookings                               | Accessible empty state; no other-user existence detail    | Privacy                 |
| Foreign/missing ID or inactive/wrong role       | Safe refusal, no projection/mutation                      | Ownership               |
| Edit after approval/rejection/cancel/completion | Conflict/refusal, no overwrite                            | State machine           |
| Cancel at exact start or later                  | Refusal, no release                                       | Strict pre-start cutoff |
| Lecturer decision/cancel/edit race              | At most one valid conditional transition; loser refreshes | Durable history         |
| Validation/cross-origin/GET/timeout failure     | Safe typed feedback, no partial write                     | Atomicity               |
| Stored hostile text                             | Literal rendering; no code/model action                   | Injection resistance    |

## Acceptance criteria and verification

Planned verification only; no test result is claimed.

- **STU-04-AC1** (R1; DB + E2E): Given owned bookings in each of the five statuses, when the Student opens My Bookings, then only their rows and literal statuses appear with the allowlisted projection.
- **STU-04-AC2** (R1/R2; DB security + E2E): Given another Student's booking or an arbitrary missing ID, direct list/detail calls return the same safe result and disclose/mutate nothing.
- **STU-04-AC3** (R2; unit + DB): Given owned history, the non-paginated list exposes only course, Lecturer, date/time, literal status, and topic summary; empty and dependency-failure states are distinct and safe.
- **STU-04-AC4** (R3/R7; unit + DB): Given topic/questions at valid/invalid boundaries, only a pending owned booking accepts both fields; unknown/duplicate/invalid/oversized input and forged fields fail at action and RPC boundaries.
- **STU-04-AC5** (R3/R4; real concurrent DB integration): Given a pending booking, simultaneous edit/edit, edit/cancel, or edit/Lecturer decision operations commit only the first valid transition; stale callers receive changed/refresh conflict.
- **STU-04-AC6** (R5; DB + E2E): Given an owned pending or approved future booking, cancel succeeds exactly once, status becomes `cancelled`, history/content remain, and a fresh slot browse can show the released otherwise-eligible slot.
- **STU-04-AC7** (R5; DB): Given exact slot start, past start, rejected/cancelled/completed status, a foreign owner, or inactive/wrong role, cancellation refuses and preserves every row/state.
- **STU-04-AC8** (R5/R6; real concurrent DB integration): Given simultaneous Student cancellation and Lecturer approval/rejection/completion, first valid transition wins; approval-first permits later pre-start cancellation, cancellation-first blocks Lecturer decision, and completed is never released.
- **STU-04-AC9** (R6/R9; DB security): Given direct table/RPC/action calls by signed-out, inactive, Lecturer, Administrator, or another Student, authorization precedes read/version lookup and no protected content is returned.
- **STU-04-AC10** (R4/R6/R9; browser + integration): Given GET/cross-origin write, response loss/retry, or database timeout, same-key replay safely returns the original outcome, no unauthorized/partial/duplicate mutation occurs, and feedback is safe.
- **STU-04-AC11** (R8; E2E + manual): Given keyboard use, narrow 320px layout, and 200% zoom, list/detail/edit/cancel states, focus, labels, errors, confirmation, and duplicate-submit feedback remain usable.
- **STU-04-AC12** (R9/R10; unit + browser security): Given script/SQL/model-instruction booking content and an unavailable AI provider, content renders literally, no model call/AI-usage mutation occurs, and ordinary management remains functional.

## Review evidence

- Challenge record: `workflow/reviews/stu-04/specification-challenge.md`.
- Review type: `self-review`; no fresh independent requirements architect was available.
- Human input required: review the exact revised digest and proposed API/UI details before approval.

## Open questions for review

1. Confirm exact ordering/topic-summary truncation for the non-paginated list.
2. Confirm version/key encoding, confirmation wording, and audit-detail projection. Rejection reason is
   not in the confirmed list/detail allowlist.
3. Identify the approved Lecturer transition endpoint/fixture for real race verification.

## Change log

| Date       | Change and reason                                                            | IDs affected            | Evidence invalidated             | By                     |
| ---------- | ---------------------------------------------------------------------------- | ----------------------- | -------------------------------- | ---------------------- |
| 2026-10-18 | Initial draft combining owned list, pending edit, and pre-start cancellation | STU-04-R1–R10; AC1–AC12 | None                             | requirements_architect |
| 2026-10-18 | Recorded team decisions; retained draft pending exact-digest review          | R1–R8; AC1–AC10         | Initial self-review dispositions | requirements_architect |
