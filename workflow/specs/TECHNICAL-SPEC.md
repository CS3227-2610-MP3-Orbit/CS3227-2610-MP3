---
id: TEC-01
title: Role feature technical requirements
owner: team
status: draft
---

# TEC-01: Role feature technical requirements

## Context

This document translates `PRODUCT-SPEC.md` into feature-level technical requirements. It defines
application boundaries and expected server behaviour without replacing the smaller role specs that
must be approved before implementation.

## Application structure

- Next.js App Router provides the full-stack application and React provides the UI components.
- Role pages live under `src/app/student`, `src/app/lecturer`, and `src/app/admin`; reusable
  role-owned logic lives under the corresponding `src/features/<role>` directory.
- Shared authentication, database clients, booking-state rules, validation, and AI access live under
  `src/lib` and require shared review.
- Mutations use Server Actions or Route Handlers. Every mutation begins by calling `requireRole` and
  validates untrusted input on the server.
- Browser-side visibility checks are usability features, not authorization controls.

## Student feature requirements

### Slot discovery

- Query only future slots with no booking in an active status (`pending` or `approved`).
- Support optional lecturer, course, and date filters; invalid filter identifiers are rejected.
- Return only the lecturer display name, course details, and slot times needed for selection.

### Request and booking management

- A booking request receives the authenticated student's ID from the session, never from submitted
  form data.
- Creation is transactional and relies on a database constraint or equivalent locking so concurrent
  requests cannot both reserve one slot.
- Pending edits may change only `topic` and `questions`.
- Cancellation is an explicit state transition from `pending` or `approved` to `cancelled` and is
  rejected at or after `starts_at`.
- Listing and detail queries are scoped to the authenticated student's ID in both application logic
  and row-level security.

### Improve-request AI

- The system prompt is fixed in source control. The topic and questions are wrapped with
  `wrapUntrusted` and sent through `generateText` with a stable feature identifier.
- Output is accepted only as bounded plain text. It is returned as a draft and is not persisted until
  the student explicitly submits a normal booking or edit form.
- The UI labels generated content and keeps the original draft available for comparison.

## Lecturer feature requirements

### Slot management

- Course choices are limited to courses assigned to the authenticated lecturer.
- `starts_at` must be in the future and `ends_at` must be later than `starts_at`.
- A new or edited slot must not overlap another slot owned by the lecturer.
- Editing or deletion is refused when a pending or approved booking exists for the slot.

### Request decisions and completion

- Lecturer booking queries join through a slot owned by the authenticated lecturer.
- Approval permits only `pending → approved`.
- Rejection permits only `pending → rejected`, requires a bounded non-blank reason, and releases the
  slot by making its booking inactive.
- Completion permits only `approved → completed` and only at or after the slot end time.
- State transitions must be conditional on the current state so concurrent/stale decisions cannot
  overwrite one another.

### Briefing AI

- The server selects upcoming approved bookings for the authenticated lecturer and selected date.
- Model input includes course, time, topic, and questions only; it excludes student contact details
  and internal identifiers.
- Each database-sourced free-text field is wrapped as untrusted content.
- Output is a non-persistent, bounded plain-text briefing. Empty eligible results do not call the LLM.

## Administrator feature requirements

### Accounts and courses

- Account creation and role changes use server-only administrative access after `requireRole("admin")`.
- The client cannot submit or retrieve a Supabase secret key.
- Deactivation takes effect in `getCurrentUser` and row-level policies.
- Course codes are unique after canonical normalization; lecturer assignments reference existing,
  active lecturer profiles.

### Announcements and reports

- Announcements store a title, plain-text body, publication state, author, and timestamps.
- Only published announcements appear in the student workspace.
- Report filters are validated dates and identifiers. Aggregation is calculated by trusted backend or
  database code, not by the LLM.
- Reports return counts, not private student consultation descriptions.

### Activity-summary AI

- The backend serializes aggregate counts for the selected period and supplies those counts through
  `generateText`.
- The prompt instructs the model to describe only supplied figures and not infer student performance
  or lecturer quality.
- Output is validated as bounded plain text and never becomes a source of record.

## Validation and errors

- Zod schemas validate action inputs, including identifiers, dates, required strings, enumerations,
  and agreed length bounds.
- User-facing errors distinguish validation, permission, conflict, not-found, and temporarily
  unavailable outcomes without exposing stack traces, secrets, database details, or the existence of
  inaccessible records.
- Expected conflicts are returned as typed results; unexpected failures are logged on the server with
  no sensitive consultation text.

## Acceptance criteria

- **TEC-01-AC1** Given any booking mutation request containing a different `student_id`, when the
  student action runs, then the stored owner is the authenticated student and the submitted owner is
  ignored or rejected.
- **TEC-01-AC2** Given a lecturer attempting to create overlapping slots, when the second transaction
  is committed, then it is rejected even if both requests bypass client-side validation.
- **TEC-01-AC3** Given a stale lecturer decision, when the booking no longer has status `pending`,
  then approval or rejection changes zero records and returns a conflict.
- **TEC-01-AC4** Given an AI feature request containing `</untrusted_data>` and instruction-like text,
  when the model input is assembled, then each free-text value remains inside exactly one escaped
  untrusted-data block.
- **TEC-01-AC5** Given generated text containing `<script>alert(1)</script>`, when any role displays
  it, then the characters appear as text and no script executes.
- **TEC-01-AC6** Given no eligible bookings for a lecturer briefing, when the briefing is requested,
  then no LLM call or usage record is created and the user sees that there is nothing to summarise.
- **TEC-01-AC7** Given an administrator activity-summary request, when model input is inspected, then
  it contains backend-calculated aggregates and no rows or free text from individual bookings.

## Out of scope

- Exact component layout and visual design beyond accessibility and role separation.
- Exact SQL definitions, which are finalized in an approved detailed spec and migration review.
- Public third-party APIs or calendar integrations.

## Open questions

- Decide concrete field-length bounds before approving the role-specific child specs.
- Decide whether date filters use Singapore time while timestamps remain stored in UTC.
- Decide whether course deletion is prohibited or represented by an inactive/archive state.
- Decide whether administrators may change their own role or deactivate their own account.

## Change log

| Date       | Change                | By      |
| ---------- | --------------------- | ------- |
| 2026-10-17 | First technical draft | analyst |
