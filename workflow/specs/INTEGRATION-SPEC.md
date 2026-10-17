---
id: INT-01
title: Application integration contracts and data model
owner: team
status: draft
---

# INT-01: Application integration contracts and data model

## Context

This document defines the logical data model and contracts between the Next.js application,
Supabase, and the SoC LLM. The application currently has no public third-party API. Server Actions
are internal application boundaries and must still authenticate, authorize, and validate every call.

## Logical data model

| Entity | Required information | Important rules |
| --- | --- | --- |
| `profiles` | user ID, full name, role, active flag, timestamps | One profile per Auth user; new users default to student |
| `courses` | ID, normalized code, name, active flag, timestamps | Code is unique; inactive courses cannot receive new slots |
| `course_lecturers` | course ID, lecturer ID | Unique pair; lecturer must have active lecturer role |
| `consultation_slots` | ID, lecturer ID, course ID, start, end, timestamps | Start before end; future on creation; no lecturer overlap |
| `bookings` | ID, slot ID, student ID, topic, questions, status, rejection reason, timestamps | At most one pending/approved booking per slot |
| `announcements` | ID, title, body, published flag, author ID, timestamps | Plain text; students read published records only |
| `ai_usage` | ID, user ID, feature identifier, creation time | Server-only accounting; no prompt or response body |

All identifiers are generated or resolved by the server/database. Client-submitted ownership fields
do not determine access or authorship.

## Booking state protocol

Allowed transitions are:

```text
available slot → pending
pending        → approved | rejected | cancelled
approved       → completed | cancelled
rejected       → terminal
cancelled      → terminal
completed      → terminal
```

- `pending` and `approved` are active and reserve the slot.
- `rejected`, `cancelled`, and `completed` are inactive for future reservation purposes; completed
  records remain historical.
- Reusing a slot after rejection or cancellation creates a new booking record rather than rewriting
  the historical record.
- A transition includes the expected current status and authorized actor in its database condition.

## Internal action contracts

Contracts below describe logical inputs and outcomes, not a commitment to public HTTP endpoints.

### Student actions

| Operation | Untrusted input | Server-derived data | Outcomes |
| --- | --- | --- | --- |
| Browse slots | lecturer/course/date filters | role and current time | bounded available-slot list or validation failure |
| Request slot | slot ID, topic, questions | student ID and slot course | pending booking, validation failure, conflict, or refusal |
| Edit request | booking ID, topic, questions | student ID | updated pending booking, conflict, not found/refused |
| Cancel booking | booking ID | student ID and current time | cancelled booking, conflict, not found/refused |
| Improve request | draft topic and questions | user ID, feature ID, fixed prompt | generated draft or typed AI failure |

### Lecturer actions

| Operation | Untrusted input | Server-derived data | Outcomes |
| --- | --- | --- | --- |
| Create/edit slot | slot/course IDs and times | lecturer ID | stored slot, validation failure, conflict, or refusal |
| Delete slot | slot ID | lecturer ID | deleted empty slot, conflict, or not found/refused |
| Decide request | booking ID, approve/reject, rejection reason | lecturer ID and expected state | updated booking, conflict, validation failure, or refusal |
| Complete request | booking ID | lecturer ID and current time | completed booking, conflict, or refusal |
| Prepare briefing | selected date | lecturer ID and approved source rows | plain-text briefing, empty result, or typed AI failure |

### Administrator actions

| Operation | Untrusted input | Server-derived data | Outcomes |
| --- | --- | --- | --- |
| Manage account | profile/account fields | administrator identity | created/updated account, validation failure, or conflict |
| Manage course | course fields and lecturer IDs | administrator identity | created/updated course or validation/conflict failure |
| Manage announcement | title, body, publication state | administrator identity | created/updated announcement or validation failure |
| View statistics | period and grouping filters | authorized aggregate query | aggregate dataset or validation failure |
| Summarise activity | period and grouping filters | sanitized aggregate dataset | plain-text summary, empty result, or typed AI failure |

For inaccessible IDs, actions return the same not-found/refused shape so callers cannot enumerate
another user's records.

## SoC LLM protocol

Every feature calls the shared gateway with:

```ts
{
  userId: "authenticated profile ID",
  feature: "stable role.feature identifier",
  system: "fixed trusted instructions",
  input: "labelled and escaped untrusted data"
}
```

Stable feature identifiers are:

- `student.improve-request`
- `lecturer.prepare-briefing`
- `admin.activity-summary`

The gateway returns either `{ ok: true, text }` or `{ ok: false, reason, retryAfterSeconds? }`.
Feature code never receives provider credentials and never relies on model output for authorization or
state transitions.

### Data minimization by AI feature

| Feature | Permitted model data | Prohibited model data |
| --- | --- | --- |
| Improve request | Current student's submitted draft | Other bookings, account data, invented personal facts |
| Prepare briefing | Course, time, topic, questions for authenticated lecturer's approved bookings | Other lecturers' bookings, contact details, internal IDs |
| Activity summary | Aggregate counts and selected reporting period | Student identities, topics, questions, raw booking rows |

## Date, time, and serialization

- Persist timestamps as PostgreSQL `timestamptz` values in UTC.
- Treat user-selected dates in the documented application timezone before converting query bounds to
  UTC.
- Serialize dates to clients in ISO 8601 form; format them for humans only at the presentation layer.
- Never trust a browser clock for authorization or booking transition decisions.

## Failure contract

Expected operation results distinguish:

- `validation_error`: submitted data is malformed or violates a documented bound.
- `forbidden_or_not_found`: actor lacks access or the record does not exist.
- `conflict`: current state or concurrent data prevents the requested transition.
- `ai_unavailable`: typed AI failure with optional safe retry guidance.
- `success`: the documented result only.

Raw database errors, provider responses, stack traces, and credentials are not returned to clients.

## Acceptance criteria

- **INT-01-AC1** Given a booking in each status, when a transition is attempted, then only the
  transitions in the booking state protocol succeed and terminal states cannot be changed.
- **INT-01-AC2** Given a rejected or cancelled booking, when another student requests its future
  slot, then a new booking record is created and the historical record remains unchanged.
- **INT-01-AC3** Given any internal action with an inaccessible identifier, when it responds, then it
  does not reveal whether the other user's record exists or return its fields.
- **INT-01-AC4** Given each AI feature, when its gateway request is inspected, then it uses its stable
  feature identifier and contains only the data permitted for that feature.
- **INT-01-AC5** Given a server authorization or transition decision, when time is evaluated, then it
  uses server/database time rather than a time supplied by the browser.
- **INT-01-AC6** Given an expected validation, permission, conflict, or AI failure, when the action
  responds, then the response follows the failure contract and exposes no raw infrastructure error.

## Out of scope

- A public REST API, webhooks, real-time subscriptions, calendar protocols, and external identity
  providers.
- Final physical table/index/policy syntax before detailed specs are approved.

## Open questions

- Confirm whether a completed slot may ever become available again; this draft treats it as historical
  and not reusable.
- Decide whether announcements require start/end publication dates or only a boolean state.
- Decide whether account creation sends an invitation or assigns a temporary password out of band.
- Decide the application timezone before date-filter contracts are approved.

## Change log

| Date | Change | By |
| --- | --- | --- |
| 2026-10-17 | First integration draft | analyst |
