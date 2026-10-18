---
id: EXAMPLE-STU-01
title: Request a consultation from an available slot
owner: example only
status: draft
---

# EXAMPLE-STU-01: Request a consultation from an available slot

> Draft example only. This document demonstrates the `feature-specification` workflow. It is not an
> approved project requirement, implementation authority, or evidence that review or tests occurred.
> `EXAMPLE-` IDs are non-production placeholders and must never be allocated to tests or implementation.

## Document control

- Reviewed commit or digest: none; example draft
- Parent requirements: proposed relationship to `PRD-01` and `INT-01`, pending human confirmation
- Confirmed: the repository describes students requesting consultation slots.
- Proposed: one pending request per slot and a 1,000-character topic limit.
- Unresolved: cancellation policy, exact eligibility rules, and whether lecturers may reopen a slot.

## Product and feature description

An active student chooses an available consultation slot and submits a short topic so the lecturer can
review the request. The system must prevent double booking without revealing another student's request.

## Scope, non-goals, and dependencies

- In scope: request submission, confirmation, authorization, conflict handling, and safe topic storage.
- Non-goals: lecturer approval, rescheduling, cancellation, reminders, and AI topic improvement.
- Dependencies: approved shared booking-state, course-eligibility, slot-availability, and RLS contracts.

## Users, roles, and permissions

| Actor          | Allowed                                         | Refused                                                |
| -------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Active student | Request an eligible available slot for themself | Request for another student or inspect another request |
| Lecturer/admin | None in this student flow                       | Invoke the student request boundary                    |

Identity and role come from the validated server session, never request fields.

## Functional requirements

### EXAMPLE-STU-01-R1 — Submit a request

- Classification: `proposed`
- Source: derived from the draft product concept; requires human confirmation

An active eligible student can submit a plain-text topic for a currently available slot. On success the
student sees a durable confirmation and the slot is no longer requestable by another student.

### EXAMPLE-STU-01-R2 — Preserve booking integrity

- Classification: `proposed`
- Source: proposed interpretation of one-request-per-slot behavior; requires human confirmation

Availability is rechecked in the same trusted transaction that creates the request. At most one active
request may occupy a slot, including under concurrent submissions.

### EXAMPLE-STU-01-R3 — Enforce access and safe input

- Classification: `proposed`
- Source: repository security constraints applied to the unapproved example behavior

The server authenticates an active student before reading or writing booking data, derives the student ID
from the session, validates slot/topic input, and returns no other student's identity or topic.

### EXAMPLE-STU-01-R4 — Provide accessible request feedback

- Classification: `proposed`
- Source: repository accessibility direction; exact targets remain unresolved

The submit control exposes pending, success, validation, conflict, and temporary-error states in text,
remains keyboard operable, and prevents accidental duplicate submission without treating the browser as
the integrity boundary. Exact response-time and browser targets remain inherited/unresolved.

## Use case: request an available slot

- Preconditions: active student session; eligible course relationship; future available slot.
- Main flow: open slot → enter topic → submit → server authorizes and validates → transactional request
  succeeds → confirmation appears.
- Alternatives: invalid topic shows field feedback; stale slot returns a neutral conflict; dependency
  failure returns a retryable generic error with no partial booking.
- Postcondition: exactly one active request exists for the slot, owned by the authenticated student.

## Data, API, and security boundaries

- Proposed input: opaque slot ID and trimmed plain-text topic of 1–1,000 characters.
- Student identity, role, eligibility, and authoritative time are server-derived.
- The page layout and every supporting Server Action or Route Handler call `requireRole("student")`
  before reading booking data or invoking the transactional write boundary.
- A database uniqueness/integrity rule must arbitrate concurrent requests; its physical design belongs in
  the approved shared data spec and a new migration.
- Stored topic is untrusted content and is always rendered as plain text.
- Authorization and validation occur before any write. Ordinary request creation must not use an admin
  client unless an approved design adds and proves all equivalent permission checks.
- This example has no AI call. Slot, topic, and student data must not enter model context.

## Edge cases and failure paths

| Condition                                | Required outcome                                               |
| ---------------------------------------- | -------------------------------------------------------------- |
| Signed out, wrong role, inactive account | Refuse before booking access or mutation                       |
| Malformed slot ID                        | Field validation with no booking lookup or mutation            |
| Absent, inaccessible, or ineligible ID   | Same neutral shape/message; status/timing needs human review   |
| Two students submit concurrently         | Exactly one succeeds; the other receives the standard conflict |
| Stored instruction-like or HTML topic    | Stored and rendered only as plain text                         |
| Database unavailable                     | Generic retryable error and no partial request                 |

## Acceptance criteria and verification

| ID                 | Requirement       | Observable outcome                                                                                                                       | Method                          |
| ------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| EXAMPLE-STU-01-AC1 | EXAMPLE-STU-01-R1 | After submission, reload and authoritative-state query show exactly one request owned by the authenticated student.                      | integration + e2e               |
| EXAMPLE-STU-01-AC2 | EXAMPLE-STU-01-R2 | Concurrent requests for one slot produce exactly one active request and one conflict.                                                    | database integration            |
| EXAMPLE-STU-01-AC3 | EXAMPLE-STU-01-R3 | Signed-out, wrong-role, inactive, and identity-substitution attempts cause no booking read or write.                                     | integration + e2e               |
| EXAMPLE-STU-01-AC4 | EXAMPLE-STU-01-R3 | Invalid topic/slot input causes no write and returns bounded, non-sensitive feedback.                                                    | unit + integration              |
| EXAMPLE-STU-01-AC5 | EXAMPLE-STU-01-R3 | Instrumented provider mocks observe zero LLM calls across request, display, logging, and error paths; hostile text renders only as text. | integration + manual inspection |
| EXAMPLE-STU-01-AC6 | EXAMPLE-STU-01-R4 | Keyboard use and text feedback cover pending, success, validation, conflict, and temporary-error states.                                 | e2e + accessibility inspection  |

These are planned criteria; no test has been executed for this example.

## Review evidence and open questions

- Challenge record: `workflow/reviews/project-setup/2026-10-17-feature-specification-challenge.md`
- Review type: independent workflow/example challenge; findings are not human approval.
- Human decisions: eligibility, topic length, state uniqueness, cancellation/reopen behavior, shared data
  contract, neutral private-resource error status/timing, and canonical production IDs.
- Readiness: not ready for approval or implementation.

## Change log

| Date       | Change                                                            | By    |
| ---------- | ----------------------------------------------------------------- | ----- |
| 2026-10-17 | Created a non-authoritative draft example for skill demonstration | Codex |
