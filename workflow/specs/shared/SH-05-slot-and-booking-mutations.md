---
id: SH-05
title: Slot and booking mutations
owner: team
status: draft
---

# SH-05: Slot and booking mutations

## Document control

- Spec owner: shared/team.
- Source: future mutation behavior moved without product approval from the prior broad `SH-03`.
- Prior source digests: team-reported approved behavior
  `3bc3f5cd29ea26040e8cedd71df71fa1f68d51c8`; canonical metadata
  `2f704fe55f177fe8d9a8320dc5c5ea71c91e1680`.
- Change-impact record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-impact.md`.
- Parent/shared requirements: revised drafts `SH-02`, `SH-03`, and `SH-04`.
- Confirmed requirements: prior slot/booking invariants, role ownership, archive-over-delete after
  dependent/history records, and preservation of terminal booking history carried forward below.
- Proposed assumptions requiring review: exact mutation APIs and slot edit/delete behavior.
- Unresolved decisions: duration/horizon, text bounds, cancellation cutoff, retention duration, deletion
  of never-used slots, booked lifecycle handling, and idempotency details.

This split document is `draft`; it preserves prior intent for later review but authorizes no mutation
implementation.

## Product and feature description

This future contract defines creation and mutation of consultation slots/bookings, role-owned state
transitions, and database concurrency. It is separated from the implemented Student browse read model.

## Scope, non-goals, and dependencies

### In scope

- Slot creation, valid times, Lecturer ownership, and overlap prevention.
- Booking identity, Student ownership, statuses, transitions, and historical semantics.
- One active reservation per slot and no overlapping active Student bookings.
- Slot editing/deletion/archive behavior and lifecycle-change handling.

### Non-goals

- Student browse filters/projection/pagination, owned by `SH-03`.
- Detailed role pages/forms, which belong in Student/Lecturer/Admin feature specs.
- AI booking decisions or automatic transitions.

### Dependencies

- `SH-01` for trusted active roles.
- `SH-02`/`SH-04` for current assignments and their management.
- `SH-03` for the read-side consequences of stored states.

## Users, roles, and permissions

| Actor           | Allowed actions                                                   | Refused actions                                    |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| Active Student  | Create own request; cancel own eligible pending/approved booking  | Other owners, approval/rejection/completion        |
| Active Lecturer | Manage eligible own slots; decide/complete own-slot consultations | Other lecturers' slots/bookings, Student ownership |
| Administrator   | No private-content access by default                              | Undocumented mutation or consultation-text access  |

## Functional requirements

### SH-05-R1 — Slot creation and overlap integrity

- Classification: `confirmed` except duration/horizon.
- Source: moved creation/mutation portion of old `SH-03-R2`.

Only an owning active Lecturer with a current course assignment may create a slot. Database time requires
a strictly future start and an end after start. Same-Lecturer slots cannot overlap, including concurrent
writes. Duration and advance horizon need approval.

### SH-05-R2 — Booking identity and trusted ownership

- Classification: `confirmed`.
- Source: old `SH-03-R3`.

A booking records one slot, Student owner from trusted identity, status, topic/questions, optional
rejection reason, and audit times. Client identity/role cannot grant ownership. New requests create new
records rather than overwriting rejected/cancelled history. A created booking row is workflow history
and is never hard-deleted; cancellation, rejection, and completion are retained state transitions.

### SH-05-R3 — Booking transition protocol

- Classification: `confirmed` except unresolved text/cancellation bounds.
- Source: old `SH-03-R4`.

Allowed statuses/transitions remain: pending to approved/rejected/cancelled; approved to
completed/cancelled; rejected/cancelled/completed terminal. Only the owning Lecturer approves, rejects,
or completes; only the owning Student cancels. Rejection needs a bounded nonblank reason. Cancellation is
strictly before start unless a stricter approved cutoff applies. Completion is from approved at/after
end. Transitions are atomic conditional authorized updates; stale operations conflict.

### SH-05-R4 — Reservation and historical semantics

- Classification: `confirmed`.
- Source: mutation portion of old `SH-03-R5`.

Pending/approved reserve; rejected/cancelled release an otherwise eligible future slot; completed never
releases it. Rebooking creates a new record and preserves terminal history. Completion before end is
forbidden.

### SH-05-R5 — Concurrency and Student conflicts

- Classification: `confirmed`.
- Source: old `SH-03-R8`.

Database controls allow at most one pending/approved reservation per slot and no overlapping active
booking intervals for one Student. Simultaneous conflicts produce one committed winner and typed
conflicts for losers.

### SH-05-R6 — Slot edit/delete/archive

- Classification: `confirmed` for history preservation/archive-over-delete; authorization and exact
  never-used deletion API remain `proposed`.
- Source: old `SH-03-R9` plus Joseph's accepted retention decision.

Only the owning active Lecturer may edit or archive an eligible slot; edits revalidate future time,
assignment, and overlap. A slot with any booking history—pending, approved, rejected, cancelled, or
completed—is never hard-deleted, and its bookings remain stored. Pending/approved/completed history also
blocks slot editing under the prior rule. The exact archival representation, retention duration,
treatment of edits when only rejected/cancelled history exists, and physical deletion of a slot that has
never had a booking require later review.

### SH-05-R7 — Lifecycle-change handling

- Classification: `unresolved` beyond preservation.
- Source: old `SH-03-R7` open decision.

Course/assignment/Lecturer lifecycle changes block new slots and preserve existing pending/approved
bookings without automatic transition. The operational resolution workflow needs human approval.

## Non-functional requirements

### SH-05-R8 — Secure atomic mutation

- Classification: `confirmed` for database atomicity/authorization; exact capacity is `unresolved`.
- Source: prior broad SH-03 security and reliability requirements.

Mutations derive actor/owner/time from trusted server/database state, validate bounded input, use
database constraints/conditional updates, return typed safe failures, and log no private booking text.

### SH-05-R9 — No-AI mutation boundary

- Classification: `confirmed`.
- Source: mutation portion of old `SH-03-R16` and `SH-03-AC29`.

No slot or booking mutation calls a model, constructs a prompt, writes AI usage, or treats model output
as authority. Provider availability cannot change a mutation outcome.

## UI description

No role UI is approved here. Later role specs define review/confirmation/error states and accessibility.

## Use cases

### UC1 — Two Students request one slot

- Actors: two active Students.
- Preconditions: slot initially available.
- Trigger: simultaneous requests.
- Main flow: exactly one pending booking commits.
- Alternative flow: loser receives typed conflict.
- Postconditions and invariants: one active reservation and no partial success.

### UC2 — Lecturer completes consultation

- Actors: owning active Lecturer.
- Preconditions: approved booking and database time at/after slot end.
- Trigger: completion action.
- Main flow: atomic transition to completed.
- Alternative flows: early/stale/wrong-owner/wrong-state request is refused or conflicts.
- Postconditions and invariants: completed is terminal and slot never reused.

## Technical constraints and proposals

Use PostgreSQL database constraints/transactions, RLS/grants, append-only migrations, and server-derived
identity/time. Exact action/RPC names and idempotency keys await role specs.

## Data model and integrity rules

Slots retain owner/course/time/audit data; bookings retain slot/Student/status/content/reason/audit data.
Foreign keys prevent orphans. Every booking row and every slot with booking history is preserved rather
than hard-deleted. Database mechanisms, not application prechecks alone, enforce concurrency.

## API and boundary contracts

Exact bounded request/result contracts, idempotency, and error mapping must be defined by the consuming
role spec before any mutation implementation.

## Security requirements

- Authorize role and resource ownership before mutation; trust no client owner/role/time.
- Bound and validate topic/questions/reason before storage once human limits are approved.
- Enforce transitions, expected state, reservation, and overlap inside the database transaction.
- Return non-enumerating typed failures without private content or raw database details.
- Require independent review for migration/RLS/grant/transition changes.

## AI behavior

No AI may create, approve, reject, cancel, complete, or otherwise mutate a slot/booking.

## Edge cases and failure paths

| Condition                                     | Required outcome                             | Invariant preserved        |
| --------------------------------------------- | -------------------------------------------- | -------------------------- |
| Invalid/past range or missing assignment      | No slot created                              | Valid eligible slot        |
| Concurrent overlapping Lecturer slots         | Conflicting write refused                    | No Lecturer overlap        |
| Client substitutes Student/Lecturer identity  | Trusted identity remains owner; call refused | Ownership                  |
| Concurrent same-slot/Student overlap requests | At most one conflicting booking commits      | Reservation/conflict rules |
| Early or stale transition                     | Typed refusal/conflict; no state change      | State machine              |

## Acceptance criteria and verification

- **SH-05-AC1** (`SH-05-R1`; pgTAP): invalid range/past start/ineligible assignment are refused and a
  valid slot succeeds. Creation behavior split from old `SH-03-AC3`; read failure remains `SH-03-AC3`.
- **SH-05-AC2** (`SH-05-R1`; pgTAP concurrency): same-Lecturer overlaps are refused under ordinary and
  concurrent writes; non-overlaps succeed. Moved from old `SH-03-AC4`.
- **SH-05-AC3** (`SH-05-R2`; integration): supplied owner ID cannot replace trusted Student ownership.
  Moved from old `SH-03-AC5`.
- **SH-05-AC4** (`SH-05-R3`; pgTAP): only documented actor/state transitions succeed atomically. Moved
  from old `SH-03-AC6`.
- **SH-05-AC5** (`SH-05-R3`; unit plus pgTAP): blank rejection and early completion fail without state
  change. Moved from old `SH-03-AC7`.
- **SH-05-AC6** (`SH-05-R5`; concurrency): simultaneous same-slot requests yield exactly one active
  booking and typed loser conflicts. Moved from old `SH-03-AC13`.
- **SH-05-AC7** (`SH-05-R5`; concurrency): simultaneous overlapping Student requests commit at most one.
  Moved from old `SH-03-AC14`.
- **SH-05-AC8** (`SH-05-R6`; pgTAP): wrong-owner, stale, overlap, pending, approved, and completed cases
  cannot edit or remove the slot; any rejected/cancelled/other booking history prevents hard deletion;
  archival preserves the slot and all booking rows. A never-used deletion case waits for its API decision.
- **SH-05-AC9** (`SH-05-R4`; pgTAP): rejected/cancelled history can be followed by a new record while
  history remains; read eligibility is separately `SH-03-AC8`.
- **SH-05-AC10** (`SH-05-R4`; pgTAP): early completion/rebooking a completed slot is refused; read hiding
  is separately `SH-03-AC9`.
- **SH-05-AC11** (`SH-05-R7`; integration): an approved lifecycle workflow preserves records and makes
  only approved state changes.
- **SH-05-AC12** (`SH-05-R8`; security integration): wrong actor/stale/input failures mutate no row and
  expose/log no private or raw infrastructure detail.
- **SH-05-AC13** (`SH-05-R9`; unit plus database before/after): slot and booking mutations make no
  model/provider call, prompt, or AI-usage mutation. Split from old `SH-03-AC29`.

## Review evidence

- Challenge record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-challenge.md`.
- Finding disposition: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-disposition.md`.
- Review type: independently challenged, then revised for the accepted retention decision; a fresh
  exact-digest challenge is required after the remaining role/API decisions are resolved.
- Human input required: all remaining open product/API decisions.

## Open questions blocking approval

1. What slot duration/horizon and booking-text/reason bounds apply?
2. What cancellation cutoff, retention duration, archival representation, and never-used-slot deletion
   behavior apply?
3. How are booked consultations resolved after lifecycle changes?
4. What exact role APIs, idempotency, capacity, and latency targets apply?

## Change log

| Date       | Change and reason                                              | IDs affected         | Evidence invalidated                           | By                     |
| ---------- | -------------------------------------------------------------- | -------------------- | ---------------------------------------------- | ---------------------- |
| 2026-10-18 | Split future mutation behavior from approved broad SH-03       | SH-05-R1–R9/AC1–AC13 | Old SH-03 approval does not approve this draft | requirements_architect |
| 2026-10-18 | Required archive-over-delete and terminal-history preservation | SH-05-R2/R6; AC8     | Prior split-draft challenge conclusions        | requirements_architect |
