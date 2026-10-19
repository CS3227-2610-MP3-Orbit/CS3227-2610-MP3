---
id: LEC-02
title: Lecturer consultation request decisions
owner: lecturer
status: draft
---

# LEC-02: Lecturer consultation request decisions

## Document control

- Spec owner: Lecturer feature team.
- Reviewed commit or content digest: `3c8ba194d06439183318b66ba4824e8dc0521c1f` (`develop`).
- Prior approved commit or digest invalidated by this revision: none; new draft.
- Parent/shared requirements: `SH-03`, `SH-05`; `STU-02`; `STU-04`.
- Related plan and latest handoff: `workflow/handoffs/analyst-to-developer.md`.
- Confirmed requirements: owning lecturers decide their consultation requests; existing statuses are
  `pending`, `approved`, `rejected`, `cancelled`, and `completed`; terminal history is retained.
- Proposed assumptions requiring review: exact Lecturer page path, rejection-reason bounds, notification
  transport, and whether administrators may view or decide private request content.
- Unresolved decisions: administrator permissions, exact decision deadline, notification delivery contract,
  and whether a rejection requires a reason.

## Product and feature description

This feature lets an active Lecturer review pending consultation requests for slots they own and make an
atomic approval or rejection decision. Students should receive a safe status notification, while the
booking history and reservation invariants remain intact. A decision is made from trusted server and
database state; client-supplied lecturer, student, slot, course, or status values are never authoritative.

## Scope, non-goals, and dependencies

### In scope

- Listing pending requests for the authenticated Lecturer's own consultation slots.
- Viewing the minimum request details needed to decide, subject to privacy rules.
- Approving a pending request.
- Rejecting a pending request, including the product decision on a reason.
- Role, ownership, state-transition, stale-operation, duplicate, and concurrency handling.
- Student notification, safe UI errors, and unit/integration/database/E2E verification.

### Non-goals

- Creating or editing Lecturer slots (`LEC-01`).
- Student request creation or Student booking management (`STU-02`, `STU-04`).
- Completing consultations, course administration, or AI-generated recommendations.
- Administrator workflows until their permission and privacy policy is explicitly approved.

### Dependencies

- Existing `profiles`, `courses`, `course_lecturers`, `consultation_slots`, and `bookings` schema.
- `SH-05-R2` through `R5` for ownership, statuses, reservation release, and atomic transitions.
- `STU-02` request fields and idempotency/history semantics; `STU-04` owned-booking state handling.
- Existing `requireRole`, server Supabase client, RLS, and notification conventions once confirmed.

## Users, roles, and permissions

| Actor | Responsibility or goal | Allowed actions/data | Refused actions/data |
| --- | --- | --- | --- |
| Active Lecturer | Review and decide own requests | Own pending requests and allowlisted topic/questions; approve/reject own requests | Other lecturers' requests, supplied identity/status, terminal or non-pending transitions |
| Active Student | Receive outcome | Own status/notification and any safe rejection reason if approved | Lecturer decision, other students' requests, private Lecturer data |
| Administrator | Administrative oversight | Unresolved; no access is granted by this draft | Private request content or decisions unless separately approved |
| Signed-out/inactive/wrong-role user | None | Login/role-safe refusal only | Any request listing, detail, or mutation |

Identity, active state, role, slot ownership, course assignment, booking status, and time come from
trusted server/database state. UI hiding is not authorization.

## Functional requirements

### LEC-02-R1 — Own pending-request visibility

- Classification: `confirmed`.
- Source: user feature request; `SH-05-R2` and `SH-05-R3`.

An active Lecturer can list only pending bookings attached to that Lecturer's slots and current course
assignment. The result contains an allowlisted booking/slot/course projection and bounded consultation
content required for a decision. Other Lecturer, Student identity/contact, audit, and unrelated booking
data are excluded. Empty and dependency-failure states are distinguishable without revealing private
existence.

### LEC-02-R2 — Approve a pending request

- Classification: `confirmed` for the transition; `proposed` for exact transport.
- Source: `SH-05-R3`.

Only the owning active Lecturer may atomically transition `pending` to `approved`. The operation must
re-check ownership, assignment, current status, slot eligibility, and reservation invariants in the
database transaction. A successful approval preserves the booking identity/history and reports the new
status. A stale or already-decided request changes nothing and returns a safe conflict.

### LEC-02-R3 — Reject a pending request

- Classification: `confirmed` for the transition; `unresolved` for reason policy.
- Source: `SH-05-R3` and product request.

Only the owning active Lecturer may atomically transition `pending` to `rejected`. Rejection releases
the otherwise eligible slot and preserves the booking row and history. Whether a bounded nonblank
reason is mandatory, optional, or hidden from the Student requires human approval; no implementation may
silently choose among these behaviors.

### LEC-02-R4 — Valid state transitions and decision timing

- Classification: `confirmed` for state machine; `unresolved` for exact deadline.
- Source: `SH-05-R3`.

Allowed decisions are only `pending -> approved` and `pending -> rejected`. Approved, rejected,
cancelled, and completed bookings cannot be decided again. The database uses current Singapore-aware
time and the approved decision deadline policy; a late request returns a safe conflict without mutation.

### LEC-02-R5 — Duplicate and concurrent decisions

- Classification: `confirmed` for atomicity; `proposed` for idempotency contract.
- Source: `SH-05-R3`, `SH-05-R5`.

Competing approval/rejection operations on one booking commit at most one valid transition. The loser
receives a typed stale/decision-conflict result and cannot overwrite the winner. Repeating an operation
must not create notifications or audit records more than once; exact replay-key behavior needs approval.

### LEC-02-R6 — Notifications

- Classification: `proposed` pending product decision.
- Source: user feature request and existing notification boundary if present.

After a committed decision, the affected Student receives a notification containing only the approved
status and approved safe fields. Notification failure must not falsely report a rolled-back decision;
the system must define whether delivery is transactional/outbox-backed or a separately retried event.
No other Student receives the request content.

### LEC-02-R7 — Safe errors and recovery

- Classification: `confirmed` for safe disclosure; `proposed` for exact codes.
- Source: `AGENTS.md`, project security policy, `STU-02`/`STU-04` safe result conventions.

Malformed input, missing/foreign booking, wrong role, stale status, overlap/reservation conflict, late
decision, and database/provider failure return safe user-facing feedback. Raw SQL, stack traces,
tokens, private request text, and whether an inaccessible booking exists are not exposed. A committed
decision remains truthful if the response is lost and can be recovered by an authorized owner.

## Non-functional requirements

- Every protected page/layout and Server Action/Route Handler must call `requireRole` before protected
  work; database/RLS boundaries independently enforce role and ownership.
- Decision transitions must be atomic and use database conditional updates/locks or an equivalent
  constraint-safe mechanism. Application prechecks alone are insufficient.
- Request content is bounded by the existing approved Student request limits unless a new limit is
  approved. Logs contain operation category/correlation ID only, not topic/questions.
- UI supports loading, empty, validation, success, conflict, and unavailable states with labelled
  controls, keyboard focus, textual status announcements, and 320px/200% zoom support.

## UI description

The Lecturer area provides a pending-request list and a detail/decision interaction under the existing
`src/app/lecturer/` structure. Each item identifies the course, slot time in Singapore time, and the
allowlisted request content. Approve and reject controls are disabled while submitting. The UI must
confirm rejection if a reason or irreversible decision policy requires it, preserve the request view on
validation/conflict, refresh after a stale result, and show a safe retry/recovery message after an
uncertain response. Exact wording and rejection-reason UX remain open.

## Use cases

### UC1 — Lecturer approves a pending request

- Actors: active owning Lecturer, Student recipient.
- Preconditions: pending booking, eligible owned slot, active assignment.
- Trigger: Lecturer submits approval.
- Main flow: authorize, lock/recheck, transition once, record decision, notify Student, show approved.
- Alternative flows: wrong owner/role, stale status, late slot, or DB failure returns safe refusal.
- Postconditions: one approved booking; no duplicate decision side effects.

### UC2 — Lecturer rejects a pending request

- Actors: active owning Lecturer, Student recipient.
- Preconditions: pending booking and eligible ownership.
- Trigger: Lecturer submits rejection.
- Main flow: collect any required reason, authorize, atomically reject, release reservation, notify Student.
- Alternative flows: missing required reason or concurrent decision leaves status unchanged for loser.
- Postconditions: one rejected historical row; slot may become eligible under `SH-05` rules.

## Technical constraints and proposals

Fixed constraints: append-only migrations, existing shared schema, server-derived identity/time,
RLS/grants, no direct client table writes, and no AI decision authority. Proposed implementation:
narrow Server Actions/RPCs with allowlisted results, conditional `UPDATE ... WHERE status='pending'`,
an operation key/version for safe retries, and an outbox or durable notification record. These proposals
require implementation review and must not be treated as approved API names.

## Data model and integrity rules

Read/write `bookings`, joined to `consultation_slots`, `courses`, `course_lecturers`, and trusted
profiles. Preserve every booking row and existing audit timestamps. Approval/rejection must retain the
Student owner, slot, course, topic/questions, and prior history. A new migration may add decision version,
reason, notification, audit, or idempotency support; existing migrations must not be edited. Exact
administrator audit fields and notification schema are unresolved for this feature.

## API and boundary contracts

Proposed logical operations (names not approved):

- `listPendingConsultationRequests()` -> success with allowlisted rows or safe unavailable result.
- `decideConsultationRequest({ bookingId, decision, expectedVersion, operationKey, reason? })` -> success
  with owned receipt/status, validation error, forbidden/not-found, conflict, unavailable, or outcome-unknown.

No operation accepts lecturer ID, student ID, slot/course/status override, SQL, selectors, or arbitrary
fields. The server derives all identity and authorization. The exact error/status mapping, idempotency
key semantics, and response projection require review.

## Security requirements

- Enforce active Lecturer role and slot ownership before querying or mutating; use RLS/database checks too.
- Prevent IDOR by testing foreign Lecturer, foreign Student, missing, inactive, and signed-out calls.
- Treat topic/questions/rejection reason as untrusted plain text; render text only and never HTML/SQL.
- Do not expose other Students' identity/contact data, raw errors, audit details, or booking existence.
- Bound list size, request text, operation keys, lock/statement timeouts, and notification retries.
- Use `createAdminClient` only after explicit authorization if unavoidable; prefer session-aware client/RPC.
- Review migration, grants, RLS, notification, and decision-transition changes independently before merge.

## AI behavior

No AI is required or authorized. Consultation text, including direct or indirect prompt-injection-looking
content, remains inert data. No model call, prompt construction, `ai_usage` access, or model-generated
approval/rejection may occur. Provider availability must not affect decision outcomes.

## Edge cases and failure paths

| Condition | Required observable outcome | Invariant preserved |
| --- | --- | --- |
| Signed out, inactive, wrong role | Redirect/refusal with no data | Authorization |
| Foreign/missing booking | Same safe result; no enumeration | Privacy |
| Non-pending status | Typed conflict; no mutation | State machine |
| Two simultaneous decisions | One winner, one conflict | Atomicity |
| Duplicate retry | No duplicate transition/side effects; exact replay TBD | Idempotency |
| Invalid/oversized reason | Safe validation failure | Input bounds |
| Notification failure | Truthful committed-vs-delivery state; retry policy TBD | No false success |
| Database timeout/error | Safe retry or outcome-unknown result | No partial mutation |
| Malicious text | Literal text only; no code/model effect | Injection resistance |

## Acceptance criteria and verification

| ID | Requirement | Given / when / then outcome | Verification method | Mocked or live |
| --- | --- | --- | --- | --- |
| LEC-02-AC1 | R1 | Given two Lecturers' pending bookings, when one lists requests, then only their own allowlisted pending rows appear. | DB + integration + E2E | live |
| LEC-02-AC2 | R1/R7 | Given signed-out, inactive, Student, Admin, foreign, and missing actors/IDs, when they invoke list/detail, then no protected data is disclosed. | DB security + E2E | live |
| LEC-02-AC3 | R2 | Given an eligible owned pending booking, when its Lecturer approves, then exactly one row becomes approved and history is retained. | unit + DB + E2E | live |
| LEC-02-AC4 | R3 | Given an eligible owned pending booking and an approved rejection input, when its Lecturer rejects, then it becomes rejected and the slot reservation is released under SH-05. | unit + DB + E2E | live |
| LEC-02-AC5 | R4 | Given approved/rejected/cancelled/completed bookings, when a decision is attempted, then status and history remain unchanged with a safe conflict. | DB | live |
| LEC-02-AC6 | R4 | Given a decision at or beyond the approved deadline, when submitted, then it is refused without mutation. | unit + DB | live |
| LEC-02-AC7 | R2/R3 | Given a foreign Lecturer or forged IDs/status, when deciding, then authorization fails and no other booking changes. | DB security + integration | live |
| LEC-02-AC8 | R5 | Given simultaneous approve/reject operations, when both execute, then one valid transition commits and the other receives a stale conflict. | concurrent DB integration | live |
| LEC-02-AC9 | R5 | Given a repeated decision submission or lost response, when the same operation is retried, then no duplicate transition, notification, or audit event occurs. | unit + fault-injected integration | deterministic/live |
| LEC-02-AC10 | R6 | Given a committed decision, when notification processing runs, then only the affected Student receives an allowlisted status notification. | DB + integration + E2E | live |
| LEC-02-AC11 | R6/R7 | Given notification delivery failure, when the decision commits, then the result distinguishes committed state from delivery retry and never falsely rolls back or claims delivery. | fault-injected integration | deterministic |
| LEC-02-AC12 | R7 | Given invalid, oversized, unknown, duplicate, or missing fields, when submitted, then safe validation feedback appears and no mutation occurs. | unit + integration | deterministic/live |
| LEC-02-AC13 | R7/security | Given HTML, SQL, or model-instruction text in request fields, when displayed or decided, then it renders literally and no model/SQL/code execution occurs. | unit + browser security | deterministic/live |
| LEC-02-AC14 | R7 | Given a DB timeout before or after possible commit, when the UI receives failure/uncertainty, then it offers safe retry/recovery without duplicate decisions. | fault-injected integration + E2E | deterministic/live |
| LEC-02-AC15 | R1/R7 | Given zero, many, or dependency-failed requests, when the Lecturer opens the page, then empty/loading/error states are usable and bounded. | unit + E2E | deterministic/live |
| LEC-02-AC16 | all | Given keyboard, 320px, 200% zoom, and pending submission, when the Lecturer uses the page, then labels, focus, status, and disabled duplicate controls remain usable. | E2E + manual | live/N/A |
| LEC-02-AC17 | R8 | Given the app and AI provider states, when list/decision operations run, then no AI call or `ai_usage` access occurs and ordinary behavior is unchanged. | unit spy + inspection | deterministic |

## Review evidence

- Challenge record: not run; this is the initial analyst draft.
- Review type: `independent` analyst inspection of repository state.
- Open findings and disposition: all material unresolved decisions are listed below; implementation is blocked.
- Human input required: rejection reason policy, decision deadline, notification contract, and administrator access.

## Open questions blocking approval

1. Must rejection include a nonblank reason? If yes, what length limit and may the Student see it?
2. What exact cutoff applies to decisions: one hour before slot start, slot start, or another Singapore-time rule?
3. May administrators list, view, approve, or reject Lecturer requests? If yes, what privacy boundary and audit trail apply?
4. Which notification mechanism/table/event contract is authoritative, and what does delivery failure mean to the UI?
5. Should duplicate decisions be idempotent with a client operation key, or return a conflict after the first commit?
6. What exact user-facing error/status mapping should the UI display?
7. Should pending-request list/detail expose Student name, topic, questions, course, or only minimal identifiers?

## Change log

| Date | Change and reason | IDs affected | Evidence invalidated | By |
| --- | --- | --- | --- | --- |
| 2026-10-19 | Initial repository-grounded draft for Lecturer request decisions | LEC-02-R1–R7; AC1–AC17 | None | requirements_architect |
