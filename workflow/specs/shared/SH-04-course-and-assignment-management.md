---
id: SH-04
title: Course and lecturer-assignment management
owner: team
status: draft
---

# SH-04: Course and lecturer-assignment management

## Document control

- Spec owner: shared/team.
- Source: future management behavior moved without product approval from the prior broad `SH-02`.
- Prior source digests: team-reported approved behavior
  `97c7288030a3aa1df604ce892cf4547497c75be9`; canonical metadata
  `8e8f677d361a18a41e9b073ac189618a2b9b63b5`.
- Change-impact record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-impact.md`.
- Parent/shared requirements: revised draft `SH-02` and `SH-01`.
- Confirmed requirements: previously confirmed preservation/current-assignment semantics, derived
  endpoint eligibility, archive-over-delete after dependent/history records, and no-AI management.
- Proposed assumptions requiring review: Administrator mutation boundary, normalized codes, and
  Lecturer assignment projection.
- Unresolved decisions: validation bounds, normalization, post-use code rename, retention duration,
  administrator self-management, handling booked consultations after lifecycle changes, and whether a
  never-used record may be physically deleted.

This split document is `draft`. Moving behavior here does not approve or authorize its implementation.

## Product and feature description

This future contract will define Administrator course and lecturer-assignment mutations and the narrow
Lecturer assignment projection required for slot creation. It is separated from the Student browse read
model so future work is reviewed and tested only when selected for implementation.

## Scope, non-goals, and dependencies

### In scope

- Course creation, update, deactivation, uniqueness, archival, and retention.
- Lecturer-course assignment add/reactivate/remove operations and integrity.
- Administrator authorization and Lecturer own-assignment projection.
- Preservation and downstream lifecycle effects of management changes.

### Non-goals

- Student browse/filter authorization, owned by `SH-02`/`SH-03`.
- Slot and booking mutation/state rules, owned by `SH-05` and later role specs.
- Account-role administration and Administrator self-management, which require an Administrator spec.

### Dependencies

- `SH-01` for active roles.
- `SH-02` for the read facts consumed by Student browse.
- Future Administrator and Lecturer role specs for UI and exact mutation contracts.

## Users, roles, and permissions

| Actor                | Proposed allowed actions/data                               | Refused actions/data                                       |
| -------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Active Administrator | Manage courses and lecturer assignments after authorization | Bypassing integrity rules or trusting client identity/role |
| Active Lecturer      | Read only their current active-course safe projection       | Other lecturers' assignments or management mutations       |
| Active Student       | None through management/projection operations               | All course/assignment mutations and Lecturer projections   |

## Functional requirements

### SH-04-R1 — Course lifecycle and canonical identity

- Classification: `proposed` except preservation of dependent history is `confirmed`.
- Source: split from old `SH-02-R1` and `SH-02-R2`.

Courses have opaque ID, bounded code/name, active state, and audit times. Canonical course codes are
unique under an approved normalization rule, including concurrent creation. Deactivation preserves
dependent records and does not rewrite bookings. A course with an assignment, slot, booking, or other
dependent/history record is archived/deactivated rather than hard-deleted. Bounds, normalization,
rename, retention duration, and deletion of a never-used course remain unresolved.

### SH-04-R2 — Administrator management boundary

- Classification: `proposed`.
- Source: split from old `SH-02-R7`.

Only an active Administrator may create/update/deactivate courses and add/reactivate/remove assignments.
Authorization occurs before any admin/service client; database controls reject wrong-role direct calls.
Exact inputs, idempotency, and self-management rules require the later Administrator spec.

### SH-04-R3 — Assignment mutation and integrity

- Classification: `confirmed` for active endpoints, uniqueness, preservation, and non-current effects;
  `proposed` for exact mutation API.
- Source: split from old `SH-02-R3`, `SH-02-R4`, and `SH-02-R7`.

Creating/reactivating a stored current pair requires active Lecturer and course endpoints and at most
one stored current pair. Eligibility thereafter is derived under `SH-02-R3`; endpoint deactivation or
role loss makes the pair ineligible without mutating the assignment record. Authorized removal makes it
non-current, blocks new slots, and invokes the read effects in `SH-02`. It preserves assignments, slots,
and bookings and performs no implicit booking transition.

### SH-04-R4 — Lecturer own-assignment projection

- Classification: `proposed`.
- Source: moved from old `SH-02-R8`.

An active Lecturer may read only safe ID/code/name fields for their own current active-course assignments
for future slot creation. No other lecturer's assignments or private account fields are returned.

### SH-04-R5 — Lifecycle and retention safety

- Classification: `confirmed` for archive-over-delete and historical preservation; retention duration
  and never-used deletion are `unresolved`.
- Source: old `SH-02-R1`/`R4` plus Joseph's accepted retention decision.

A course with dependent/history records and an assignment with dependent slot/booking records or a
non-current historical state are archived/deactivated rather than hard-deleted. Terminal and dependent
history remains referentially intact. Retention intervals, course-code changes after use, physical
deletion of never-used records, and operational handling of pending/approved bookings after lifecycle
changes require later human decisions before those behaviors are implemented.

## Non-functional requirements

### SH-04-R6 — Integrity and capacity

- Classification: `proposed`.
- Source: moved management portion of old `SH-02-R12`.

Database constraints and indexes enforce code/pair uniqueness and active endpoint checks under
concurrency. Exact catalogue size and latency targets remain unresolved.

### SH-04-R7 — No-AI management boundary

- Classification: `confirmed`.
- Source: prior broad no-AI course/assignment intent and Joseph's accepted no-AI decision.

Course and assignment creation, update, activation, deactivation, archival, lookup, and Lecturer own-
assignment projection are deterministic. They make no model/provider call, construct no prompt, send no
course/assignment/profile/session data to an LLM, write no AI-usage record, and never treat model output
as mutation or authorization input.

## UI description

No UI is approved here. Future role specs must define accessible form, confirmation, conflict, and
failure behavior.

## Use cases

### UC1 — Administrator removes an assignment

- Actors: active Administrator (proposed).
- Preconditions: a current pair exists.
- Trigger: authorized remove request.
- Main flow: conditionally mark non-current and preserve dependent records.
- Alternative and failure flows: wrong role refused; stale/missing target returns safe refusal/conflict.
- Postconditions and invariants: new slots blocked, Student read effects follow `SH-02`, and no booking
  state changes automatically.

## Technical constraints and proposals

Use append-only migrations, RLS/database integrity, trusted session identity, and server authorization.
Exact mutation/API names remain future proposals.

## Data model and integrity rules

The physical model must preserve course and assignment history and prevent duplicate canonical course
codes/current pairs. Retention and archival representation remain unresolved.

## API and boundary contracts

No exact mutation contract is approved. Future role specs must define bounded inputs, outputs,
idempotency, authorization order, conflicts, and failure mapping before implementation.

## Security requirements

- Authorize active Administrator/Lecturer roles from trusted identity.
- Refuse client role/owner substitution and wrong-role direct database mutation.
- Return only the Lecturer safe projection and typed non-enumerating failures.
- Independently review all admin/service-client, RLS, grant, trigger, and retention changes.

## AI behavior

No AI is used or permitted for deterministic course/assignment management or Lecturer assignment
discovery, as required by `SH-04-R7`.

## Edge cases and failure paths

| Condition                                 | Required outcome                                | Invariant preserved              |
| ----------------------------------------- | ----------------------------------------------- | -------------------------------- |
| Concurrent equivalent course codes        | At most one canonical course commits            | Code uniqueness                  |
| Inactive/non-lecturer assignment endpoint | Refuse without a current pair                   | Valid endpoints                  |
| Concurrent duplicate assignment           | At most one current pair                        | Pair uniqueness                  |
| Removal with pending/approved booking     | Preserve booking unchanged; workflow unresolved | No implicit transition/data loss |

## Acceptance criteria and verification

- **SH-04-AC1** (`SH-04-R1`; pgTAP concurrency): equivalent canonical codes yield one committed course
  and one conflict after bounds/normalization are approved. Moved from old `SH-02-AC3`.
- **SH-04-AC2** (`SH-04-R1`; pgTAP): course deactivation preserves dependent assignments, slots, and
  bookings. Moved from old `SH-02-AC2`.
- **SH-04-AC3** (`SH-04-R2`; pgTAP/integration): Student/Lecturer management calls are refused and
  mutate no row. Moved from old `SH-02-AC9`.
- **SH-04-AC4** (`SH-04-R3`; pgTAP): an authorized removal makes the pair non-current, blocks new slots,
  and leaves Student visibility to `SH-02-AC5`. Split from old `SH-02-AC5`.
- **SH-04-AC5** (`SH-04-R3`; pgTAP): removal with pending/approved bookings preserves records and states.
  Moved from old `SH-02-AC6`.
- **SH-04-AC6** (`SH-04-R2`; integration): endpoint failure returns validation/conflict and leaves data
  consistent. Moved from old `SH-02-AC10`.
- **SH-04-AC7** (`SH-04-R4`; pgTAP): each Lecturer receives only their current active-course safe
  projection. Moved from old `SH-02-AC11`.
- **SH-04-AC8** (`SH-04-R5`; pgTAP/integration): attempts to hard-delete a course with any dependent/
  history record or a historical/dependent assignment are refused; the authorized archival path keeps
  every dependent and terminal record intact and makes no implicit booking transition.
- **SH-04-AC9** (`SH-04-R6`; schema/concurrency): uniqueness and endpoint constraints remain effective
  under concurrent writes.
- **SH-04-AC10** (`SH-04-R7`; unit plus database before/after): every course/assignment management and
  Lecturer projection operation makes no model/provider call or prompt, sends no data to an LLM, writes
  no AI usage, and has the same outcome when the AI provider is unavailable.

## Review evidence

- Challenge record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-challenge.md`.
- Finding disposition: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-disposition.md`.
- Review type: independently challenged, then revised for accepted retention and no-AI decisions; a
  fresh exact-digest challenge is required after the remaining role/API decisions are resolved.
- Human input required: all remaining unresolved decisions and exact future role contracts.

## Open questions blocking approval

1. What code/name bounds and normalization apply, and may used course codes change?
2. What retention duration applies, and may a course or assignment with no dependency/history ever be
   physically deleted?
3. What workflow handles booked consultations after lifecycle changes?
4. What exact Administrator and Lecturer contracts, capacity, and latency targets apply?

## Change log

| Date       | Change and reason                                                      | IDs affected                | Evidence invalidated                           | By                     |
| ---------- | ---------------------------------------------------------------------- | --------------------------- | ---------------------------------------------- | ---------------------- |
| 2026-10-18 | Split future management behavior from approved broad SH-02             | SH-04-R1–R6/AC1–AC9         | Old SH-02 approval does not approve this draft | requirements_architect |
| 2026-10-18 | Added derived eligibility, archive safety, and explicit no-AI coverage | SH-04-R1/R3/R5/R7; AC8/AC10 | Prior split-draft challenge conclusions        | requirements_architect |
