---
id: LEC-03
title: View and complete lecturer consultations
owner: lecturer
status: approved
---

# LEC-03: View and complete lecturer consultations

## Scope

Allow an active Lecturer to view consultation bookings. Consultation status is display-derived from current time, and approved consultations automatically become completed after their scheduled end time. Administrator consultation management is out of scope for this feature.

## Existing components and dependencies

- `src/app/lecturer/page.tsx`: current Lecturer dashboard entry point.
- `src/features/student/bookings/manage-server.ts`: existing server-side booking mutation patterns.
- `supabase/migrations/20261018000000_student_browse_available_slots.sql`: shared slots, bookings, statuses, and RLS foundations.
- `supabase/migrations/20261018030000_student_manage_bookings.sql`: booking versioning and conditional mutation patterns.
- Existing statuses: `pending`, `approved`, `rejected`, `cancelled`, and `completed`.

## Functional requirements

- **LEC-03-R1:** Active Lecturers may view consultations associated with slots they own.
- **LEC-03-R2:** Ownership must be derived from the authenticated server-side identity; client-supplied Lecturer IDs are ignored.
- **LEC-03-R3:** Display status is derived without adding an `ongoing` database status: approved before start is `upcoming`, approved between start and end is `ongoing`, and after end is `completed`.
- **LEC-03-R4:** Approved consultations automatically become completed after their end time using server/database time; no manual completion or confirmation dialog is required.
- **LEC-03-R5:** The Lecturer view uses the existing booking state and preserves completed history; Administrator consultation management is not added by this feature.
- **LEC-03-R6:** Duplicate or concurrent reads/refreshes cannot create duplicate state changes or side effects.
- **LEC-03-R7:** Errors are safe and user-facing; raw SQL, stack traces, internal IDs, and hidden-record existence are not exposed.
- **LEC-03-R8:** Responses contain only Student name, email, topic, and questions, plus required consultation fields.
- **LEC-03-R9:** If a slot or Lecturer assignment is deactivated after approval, affected Lecturers and Students receive an in-app notification.
- **LEC-03-R10:** Listing and completion do not call an LLM or mutate AI usage records.

## Security requirements

- Enforce active Lecturer authorization on every protected page, Server Action, and RPC.
- Enforce slot ownership and booking status in the database, not only in the UI.
- Prevent IDOR through forged booking, Lecturer, Student, slot, or status fields.
- Preserve completed booking history and do not expose unrelated Student or Lecturer data.
- Render topic and question text as inert text.

## Acceptance criteria

| ID          | Given / When / Then                                                                                                                            | Verification               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| LEC-03-AC1  | Given an active Lecturer, when they open the consultation view, then only their authorized upcoming consultations are shown.                   | Unit, DB, E2E              |
| LEC-03-AC2  | Given another Lecturer's consultation, when the current Lecturer requests it, then no protected data is returned.                              | DB security, E2E           |
| LEC-03-AC3  | Given a consultation list, then only approved fields are returned and unrelated/private data is excluded.                                      | Unit, integration          |
| LEC-03-AC4  | Given pending, rejected, cancelled, and completed bookings, when the list is requested, then visibility follows the approved listing policy.   | DB, E2E                    |
| LEC-03-AC5  | Given an approved consultation before its end time, then its display status is upcoming or ongoing based on current time.                      | Unit, DB, E2E              |
| LEC-03-AC6  | Given an approved consultation after its end time, then its display status is completed without manual action.                                 | Unit, DB, E2E              |
| LEC-03-AC7  | Given another Lecturer's consultation, when the current Lecturer requests it, then authorization fails without protected data.                 | DB security                |
| LEC-03-AC8  | Given pending, rejected, cancelled, or completed bookings, then listing follows the approved visibility policy and does not mutate them.       | DB, E2E                    |
| LEC-03-AC9  | Given an approved consultation that reaches its end time, then completed history is retained exactly once.                                     | DB                         |
| LEC-03-AC10 | Given concurrent list refreshes or automatic status evaluation, then no duplicate state changes or side effects occur.                         | Concurrent DB integration  |
| LEC-03-AC11 | Given a Lecturer or Administrator refreshes the view, then no duplicate notification or audit side effect is created.                          | Unit, integration          |
| LEC-03-AC12 | Given a signed-out, inactive, Student, or Administrator user, then protected operations are refused before data access.                        | DB security, E2E           |
| LEC-03-AC13 | Given forged client identity or status fields, then ownership and authorization cannot be bypassed.                                            | Security integration       |
| LEC-03-AC14 | Given a database failure, then a safe user-facing error is returned without internal details.                                                  | Fault-injected integration |
| LEC-03-AC15 | Given listing or completion operations, then no LLM call or AI usage mutation occurs.                                                          | Unit spy, inspection       |
| LEC-03-AC16 | Given loading, empty, success, error, keyboard, and zoom states, then the UI remains usable and announces status changes without confirmation. | E2E, manual                |

## Required tests

Add unit, database/RLS, integration, concurrent mutation, E2E, accessibility, and security tests covering every acceptance criterion. Include Lecturer ID substitution, booking enumeration, direct RPC calls by wrong roles, stored malicious text, stale versions, early completion, duplicate completion, and database failures.

## Approved decisions

- The default view includes pending and approved consultations.
- Ongoing is display-only and derived from current time.
- Consultations become completed automatically after their end time.
- A minimal past/completed view is included.
- Administrator consultation management is out of scope and remains unchanged.
- Student fields are limited to name, email, topic, and questions.
- Completion creates no notification or audit record and requires no confirmation dialog.
- Deactivation after approval sends minimal in-app notifications to affected Lecturers and Students.

Human approval recorded on 2026-10-20.
