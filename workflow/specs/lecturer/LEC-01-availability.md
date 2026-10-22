---
id: LEC-01
title: Lecturer consultation availability
owner: lecturer
status: approved
---

# LEC-01: Lecturer consultation availability

## Context

Lecturers create and maintain consultation slots that students can later use for consultation requests.
The current repository implements slot ownership and availability management through Lecturer Server
Actions and role-checked Supabase functions.

## Observed repository behaviour

- `src/app/lecturer/layout.tsx` calls `requireRole("lecturer")` for the Lecturer route.
- `src/app/lecturer/page.tsx` renders the Lecturer dashboard, slot form, slot list, consultation lists,
  request decisions, announcements, and saved AI briefings.
- `src/lib/auth/session.ts` derives the active user and role from the server-side session and redirects users who are signed out, inactive, or in the wrong role.
- The later migrations define courses, lecturer assignments, consultation slots, bookings, notifications,
  audit records, and role-checked Lecturer RPCs.
- `src/app/lecturer/actions.ts`, `slot-form.tsx`, and `slot-row.tsx` implement the slot workflows, with
  validation and database tests under `src/features/lecturer/` and `supabase/tests/`.
- Shared project rules require server-side authorization, RLS for protected data, a spec before implementation, and handoff evidence.

## Current behaviour

An authenticated active lecturer can create consultation slots with a course, date, start time, and end time; view only their own slots; edit or delete owned slots only while they have no pending or approved booking. The backend validates the request, derives ownership from the authenticated session, prevents overlapping slots for the same lecturer, and returns safe errors for invalid, conflicting, concurrent, or failed operations.

The authoritative validation timezone is Singapore time. Courses must be selected from courses the
lecturer is assigned to. Administrators do not use the Lecturer slot operations. The Lecturer UI belongs
under the existing `src/app/lecturer/` area and related Lecturer feature folders.

## Behaviour

### Create

1. The Lecturer UI submits a course reference, calendar date, start time, and end time to a server-side operation.
2. The server obtains the lecturer identity from the authenticated session; it does not trust a client-supplied owner ID.
3. The server validates the course reference and date/time values, rejects past or non-positive intervals, checks for an overlapping slot owned by the same lecturer, and writes the slot only after all checks pass.
4. A successful response returns or refreshes the created slot without exposing unrelated lecturers' data.

### View

- An active lecturer can request their consultation slots.
- Results are filtered by the authenticated lecturer's identity in the backend and database policy, not only in the UI.
- A request for another lecturer's slot must not disclose the slot or alter it.

### Edit

- An active lecturer can edit an owned slot when validation and conflict checks pass, only when it has no pending or approved booking.
- The same validation and overlap checks used for creation apply to the proposed values.
- If a pending or approved booking exists, the edit is refused and the slot and booking remain unchanged. No confirmation can override this invariant.
- The mutation must be conditional on ownership and the current slot state so a concurrent booking or edit cannot be silently overwritten.

### Delete

- An active lecturer can hard-delete an owned slot when it has no active bookings.
- If active bookings exist, deletion is refused. The slot and bookings remain preserved; no confirmation can override this invariant.
- The deletion must be conditional on ownership and the current slot state. A cancellation releases the slot until the one-hour-before-start deadline; after that deadline it is unavailable.

## Permissions

- Active authenticated lecturers may create slots owned by themselves and view, edit, or delete only their own slots.
- Students, signed-out users, inactive users, and users with any other role, including administrators,
  must be refused by Lecturer slot operations.
- A lecturer must be refused when attempting to read, edit, or delete another lecturer's slot, even if the slot identifier is guessed or supplied directly.
- Client-supplied lecturer/user IDs must not determine authorization or ownership.
- Lecturer slot mutations are recorded in the existing consultation audit log containing the actor, action,
  affected slot, timestamp, and outcome.

## Data

### Existing data and services

- `profiles.id`, `profiles.role`, and `profiles.is_active` provide the existing identity and role foundation.
- `getCurrentUser()` and `requireRole("lecturer")` provide the existing server-side session/RBAC convention.
- The initial migration enables RLS on existing tables, but no slot table exists.

### Current data model

The migrations define the course, lecturer-course assignment, consultation-slot, booking, notification, and
audit relationships required by this specification. The course model uses `courses` and
`course_lecturers`, with lecturer membership enforced by server-side authorization and secured RPCs. The
model represents:

- Slot identifier
- Owner lecturer identity, referencing the authenticated profile
- Course reference
- Consultation date
- Start time and end time, interpreted and validated in Singapore time and stored using the
  repository's approved timestamp convention
- Creation/update timestamps as required by repository convention
- A relationship or query path to bookings sufficient to determine whether active bookings exist and whether a booking was cancelled
- Notification records or the repository's existing notification mechanism for confirmed slot changes/deletions
- Consultation audit records for Lecturer slot changes

The migration must enable RLS and provide policies consistent with this specification. Exact table and column names are intentionally not prescribed before the repository's course and booking model is known.

## Validation and failure cases

- Missing course, date, start time, or end time: reject without writing.
- Unknown or unauthorized course reference: reject without writing; do not reveal data the lecturer cannot access.
- Start time equal to or after end time: reject without writing.
- A slot is considered past/unavailable when its one-hour-before-start deadline has passed without a student booking; reject creation or edits that fall after this deadline.
- Overlap with an existing slot owned by the same lecturer: reject without changing either slot.
- Overlap with a different lecturer's slot: not restricted by this feature unless a separate approved
  course/resource rule requires it.
- Edit or delete of another lecturer's slot: reject without disclosure or mutation.
- Edit or delete while a pending or approved booking exists: refuse the operation without mutation. The existing database guard is authoritative; no confirmation, notification, or hard deletion is performed.
- Missing slot: return a safe not-found result without confirming another user's data.
- Concurrent create/edit/delete or booking changes: use a transaction, conditional mutation, database constraint, or equivalent mechanism so the final state cannot violate ownership, overlap, or active-booking rules. Return a safe conflict result when the operation loses a race.
- Database/network failure: return a generic safe error, preserve existing data where possible, and do not expose SQL/provider details.
- Repeated submission with identical details is not idempotent: the user must be notified that a
  duplicate slot already exists and no second identical slot should be silently created.

## Security requirements

- Call `requireRole("lecturer")` in every Lecturer page boundary and every slot Server Action or Route Handler; a layout check alone is insufficient.
- Derive the acting lecturer from the server session and scope every read and mutation by that identity.
- Enforce the same ownership boundary with Supabase RLS and appropriate database predicates/constraints.
- Do not use a privileged/admin Supabase client before authorization. If one is required for a narrowly scoped operation, authorization must be checked first and the operation must remain ownership-scoped.
- Do not trust hidden form fields, route parameters, or client state for lecturer identity, role, booking state, or ownership.
- Treat database errors and authorization failures as clear user-facing messages without leaking
  another lecturer's slot, course, booking, or internal details. The UI may use ordinary user-facing
  validation, conflict, authorization, not-found, and failure messages; provider/SQL details remain internal.
- Slot operations do not use the SoC LLM. No user text should be sent to an AI provider for this feature.

### Data access path (2026-10-22)

STU-01 revokes every direct table privilege on `courses`, `course_lecturers`,
`consultation_slots` and `bookings` from `authenticated` (`STU-01-AC21`, `SH-02-AC12`,
`SH-03-AC19`). Lecturer reads and writes therefore cannot use direct table queries; they go through
role-checked `security definer` functions, the same pattern ADM-01 to ADM-04 use:

- `lecturer_list_my_courses()` returns only courses that are active and actively assigned to the
  calling lecturer; `lecturer_list_my_slots()` returns only the caller's own slots.
- `lecturer_create_slot`, `lecturer_update_slot` and `lecturer_delete_slot` check the caller's role
  first, derive the lecturer from `auth.uid()`, re-check the one-hour lead time, the active course
  assignment, overlap and active-booking confirmation, and serialize each lecturer's slot changes
  with a transaction-scoped advisory lock. They write the audit row and student notifications in
  the same transaction as the slot change.
- No direct table privilege is granted to `authenticated`.

## Acceptance criteria

- **LEC-01-AC1** Given an active authenticated lecturer and a valid authorized course, date, future start time, and end time where start is before end, when the lecturer submits a create request, then exactly one slot owned by that authenticated lecturer is persisted and can be returned in that lecturer's slot list.
- **LEC-01-AC2** Given a signed-out user, inactive user, student, administrator, or other non-lecturer, when they invoke the create, list, edit, or delete operation directly, then the server refuses the operation before protected slot data is returned or changed.
- **LEC-01-AC3** Given an active lecturer with slots owned by themselves and another lecturer, when they list slots, then the response contains only slots owned by the authenticated lecturer.
- **LEC-01-AC4** Given an active lecturer and an owned slot with no pending or approved booking, when they submit valid changed course/date/start/end values, then the slot is updated and remains owned by the authenticated lecturer.
- **LEC-01-AC5** Given an active lecturer and an owned slot with no booking history, when they delete it, then it is removed from the UI and no unrelated slot is changed; slots with booking history are preserved.
- **LEC-01-AC6** Given an active lecturer and a slot owned by another lecturer, when they attempt to view, edit, or delete it directly by identifier, then the operation is refused or safely not-found, no protected slot data is disclosed, and the slot is unchanged.
- **LEC-01-AC7** Given an owned slot with a pending or approved booking, when the lecturer attempts to edit or delete it, with or without confirmation, then the operation is refused and both the slot and booking remain unchanged.
- **LEC-01-AC8** Given an existing slot for the same lecturer whose interval overlaps the requested interval, when the lecturer creates or edits a slot, then the operation is refused and no conflicting state is persisted.
- **LEC-01-AC9** Given missing fields, an invalid course, a malformed date/time, a start time not before the end time, or a past date/time, when the lecturer creates or edits a slot, then validation fails, no unintended write occurs, and a safe validation error is returned.
- **LEC-01-AC10** Given two concurrent slot mutations or a concurrent booking change, when the operations race, then the database/transaction/conditional mutation permits no state that violates ownership, overlap, or active-booking restrictions and returns a safe conflict/error for the losing operation.
- **LEC-01-AC11** Given a database or network failure during a slot operation, when the request completes, then the user receives a safe generic failure, no internal database details are exposed, and the system does not report success for an uncommitted mutation.
- **LEC-01-AC13** Given any signed-in user, when lecturer slot data is listed, created, edited or deleted, then it goes through the role-checked functions in "Data access path", a non-lecturer receives `forbidden_or_not_found` or an empty list, and `authenticated` still holds no direct privilege on `courses`, `course_lecturers`, `consultation_slots` or `bookings`.
- **LEC-01-AC14** Given a course the lecturer was assigned to but whose assignment has ended, or an inactive course, when the lecturer lists courses or creates or edits a slot for it, then the course is not offered and the operation is refused as not assigned.
- **LEC-01-AC12** Given the repository's approved implementation for slot operations, when unit, integration, and E2E tests run, then tests cover valid create/list/edit/delete flows, every refusal and validation case above, cross-lecturer isolation, RLS, concurrent/conflict behavior, and safe database failures, with test names referencing these acceptance-criteria IDs.

## Required tests

### Unit tests

- Validate course/date/start/end input, including malformed values, past values, equal/reversed intervals, and timezone boundaries.
- Test overlap detection, including adjacent intervals, which are allowed, versus genuinely overlapping intervals.
- Test safe error mapping for validation, authorization, conflict, not-found, and database failures.
- Test that ownership is derived from the authenticated user rather than client input.

### Integration/database tests

- Directly invoke each Server Action or Route Handler as unauthenticated, inactive, student, admin, owning lecturer, and non-owning lecturer.
- Verify RLS and query predicates prevent cross-lecturer reads and mutations.
- Verify confirmation, notification, cancellation release, and deadline behavior for edit and delete with active bookings.
- Verify course membership through `courses` and `course_lecturers`, administrator authorization, and audit records.
- Verify the database/transaction/constraint strategy under concurrent create/edit/delete and booking races.
- Verify no partial write occurs after validation, authorization, conflict, or database failure.

### E2E tests

- Lecturer creates and sees a valid slot.
- Lecturer sees only their own slots.
- Lecturer edits and deletes an unbooked owned slot.
- Lecturer receives a safe error for overlapping, past, invalid, or booked-slot operations; booked-slot edits/deletes remain refused even after confirmation.
- Student/admin/signed-out users cannot use the Lecturer slot workflow.

## Historical discrepancies

The initial draft was written before the Lecturer slot schema, Server Actions, secured RPCs, and tests
were implemented. Those implementation gaps are now resolved. Remaining test work is tracked by the
acceptance-criteria verification table and CI traceability check.

## Out of scope

- Student booking/request creation or cancellation.
- Lecturer approval/rejection of requests.
- Consultation completion and AI briefing generation.
- Calendar integration, recurring availability, attendance, or reporting.
- Changes to shared authentication, AI quota logic, or unrelated roles/features.

## Assumptions

- The existing migrations provide `courses`, `course_lecturers`, a stable course reference, and a way to determine active bookings.
- A slot belongs to exactly one lecturer and is scoped by that lecturer's authenticated profile ID.
- Singapore is the authoritative timezone. Adjacent slots are allowed; only intervals with actual overlap conflict.
- The repository will use its existing Supabase server-client and RLS conventions.

## Open questions

None blocking approval. The implementation uses safe generic messages for authorization, duplicate,
conflict, not-found, and database failures; records lecturer slot mutations in the existing consultation
audit log; uses `courses` and `course_lecturers` with active lecturer assignment checks; and checks
overlap only among slots owned by the same lecturer. Administrators do not use the Lecturer slot
operations.

## Change log

| Date       | Change                                                                                                                                                                                                                                                                                           | By                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| 2026-10-19 | Initial draft based on repository inspection                                                                                                                                                                                                                                                     | Codex                             |
| 2026-10-19 | Replaced prior general availability draft with repository-grounded slot specification                                                                                                                                                                                                            | Requirements Analyst              |
| 2026-10-22 | Added "Data access path", AC13 and AC14: lecturer slot reads and writes go through role-checked functions because STU-01 revokes direct table access, which left the dashboard unable to read or create slots. Approved by Johannsen (coordinator) on 22 Oct; Jordan reviews in the pull request | Coordinator                       |
| 2026-10-22 | Jordan agreed with the cross-role resolution: pending/approved bookings make slot details immutable; edit/delete are refused and the existing database guard remains authoritative. Approval must be renewed for this material revision.                                                         | Joseph (reported Jordan decision) |

## Change impact

- Superseded behavior: a Lecturer could confirm an edit or delete of a slot with active bookings and
  students would be notified.
- Confirmed replacement: a slot with a pending or approved booking cannot have its course, lecturer,
  start time, or end time edited or deleted. Confirmation does not override the database invariant.
- Rationale: this matches `STU-02`'s `guard_requested_slot_details`, `TECHNICAL-SPEC.md`, and
  `SH-05` preservation rules, preventing booked Students from receiving silently changed slot details.
- Affected criteria: `LEC-01-AC4`, `LEC-01-AC5`, `LEC-01-AC7`, `LEC-01-AC12` and the booked-slot
  validation/E2E requirements. Prior approval evidence for those criteria is stale and requires renewal.
- Implementation evidence: the existing `guard_requested_slot_details` trigger already refuses these
  updates at the database boundary; tests must prove the refusal and preservation behavior.
