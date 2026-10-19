---
id: LEC-01
title: Manage consultation availability
owner: lecturer
status: draft
---

# LEC-01: Manage consultation availability

## Context

Lecturers need to publish and maintain consultation availability so students can request suitable times. The repository currently provides only the lecturer dashboard shell; no availability data model or behaviour exists yet.

## Objective

Define the lecturer workflow for creating, viewing, editing, and withdrawing availability without permitting access to another lecturer's availability.

## Actors and permissions

- An authenticated, active lecturer may manage only their own availability.
- Students may view availability that is published and open for booking, but may not create, edit, or withdraw it.
- Administrators' management rights are not defined by the current repository and require clarification.
- Signed-out, deactivated, or non-lecturer users must be refused by server-side authorization.

## Functional requirements

- The lecturer can view their availability and its current state.
- The lecturer can submit availability for publication after server-side validation.
- The lecturer can edit or withdraw availability only when business rules permit it.
- The system reports validation failures and booking conflicts without silently changing data.

## Non-functional requirements

- Server Actions and Route Handlers must call `requireRole("lecturer")` before access.
- Data access must use RLS and ownership checks.
- Mutations must be validated server-side and be safe to retry without creating unintended duplicates.
- Changes must be traceable to acceptance-criteria tests.

## Inputs and outputs

- Inputs: lecturer identity, availability date/time, optional course or location metadata, requested action.
- Outputs: validated availability record or a user-safe error; no credentials or internal errors are exposed.

## Business rules

- Only the authenticated lecturer owns the created availability.
- The exact timezone, duration, recurrence, publication state, overlap, past-time, and edit-after-booking rules are open questions.

## Acceptance criteria

- **LEC-01-AC1** Given a signed-in active lecturer, when they create valid availability, then a record owned by that lecturer is created and shown.
- **LEC-01-AC2** Given a student, administrator, signed-out user, or deactivated lecturer, when they call the lecturer availability mutation directly, then the request is refused server-side.
- **LEC-01-AC3** Given invalid or incomplete availability input, when the lecturer submits it, then no record is written and a safe validation error is returned.
- **LEC-01-AC4** Given availability owned by another lecturer, when a lecturer attempts to read or mutate it, then the operation is refused and the record is unchanged.
- **LEC-01-AC5** Given a conflict or an availability state that is not editable, when the lecturer attempts the prohibited change, then the system refuses it without deleting or changing an existing booking.

## Error and edge cases

- Invalid date/time, past time, overlapping availability, duplicate retry, missing record, ownership mismatch, and database failure.
- The user-facing error must not reveal another lecturer's data.

## Security requirements

- Enforce role and ownership on the server and in database policies.
- Do not trust hidden form fields for lecturer identity.
- Do not use an admin client before authorization.

## Out of scope

- Student booking requests, approval decisions, notifications, recurring schedules, and calendar integrations.

## Required tests

- Authorization and ownership tests, input validation tests, conflict/idempotency tests, and RLS tests once the schema exists.

## Dependencies and assumptions

- Depends on SH-01 authentication and role enforcement.
- Assumes a future availability table and migration; neither exists currently.

## Open questions

- What fields define a slot, and what timezone is authoritative?
- Are recurring slots supported?
- Can a slot be edited or withdrawn after a booking request exists?
- May administrators manage lecturer availability?

## Change log

| Date       | Change                                       | By    |
| ---------- | -------------------------------------------- | ----- |
| 2026-10-19 | Initial draft based on repository inspection | Codex |
