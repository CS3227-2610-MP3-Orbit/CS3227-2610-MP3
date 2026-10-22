# Analyst-to-Developer Handoff — LEC-02

## Status

Human approval has been recorded for the primary LEC-02 behavior. Implementation may begin within the
approved scope; remaining wording and schema details must not change the approved behavior.

## Scope

- Task: Lecturer consultation request decisions.
- Requirements: `LEC-02-R1` through `LEC-02-R7`.
- Acceptance criteria: `LEC-02-AC1` through `LEC-02-AC17`.
- Reviewed source: `develop` at `3c8ba194d06439183318b66ba4824e8dc0521c1f`.
- Allowed future implementation scope after approval: Lecturer feature paths, named migration(s), and
  tests explicitly assigned from the approved spec. No implementation is authorized by this handoff.

## Repository evidence

- Shared booking state and transition rules: `workflow/specs/shared/SH-05-slot-and-booking-mutations.md`.
- Student request contract: `workflow/specs/student/STU-02-request-consultation.md`.
- Student management contract: `workflow/specs/student/STU-04-manage-my-bookings.md`.
- Existing request RPC/server path: `supabase/migrations/20261018020000_student_request_consultation.sql`,
  `src/features/student/bookings/request-server.ts`.
- Existing student booking management: `supabase/migrations/20261018030000_student_manage_bookings.sql`,
  `src/features/student/bookings/manage-server.ts`.
- Auth boundary: `src/lib/auth/session.ts` and `AGENTS.md`.

## Required behavior to preserve

- Trust authenticated server identity and database state, not client IDs or statuses.
- Preserve booking history; only pending requests may transition to approved/rejected.
- Use atomic conditional transitions and safe results for stale/concurrent decisions.
- Keep request content plain text and private; no AI calls or AI-usage writes.
- Add migrations rather than editing existing migrations; independently review RLS/grants and sensitive changes.

## Unresolved decisions

Rejection reasons are required and visible to students; decisions are allowed until consultation start;
administrators may manage requests; notifications are minimal in-app records; notification failure must
not falsely roll back a committed decision; each slot supports multiple students; and lecturers may view
all currently stored request fields subject to privacy and least-data rules.

| ID  | Criterion | Test reference |
| --- | --------- | -------------- |

## Evidence

- Analyst evidence log: `workflow/logs/2026-10-19-lecturer-request-decisions-analyst.md`.
- Checks: branch/status inspection and repository reads completed; formatting/spec traceability checks were
  not run because no spec artifact existed until this draft and the required consultation-spec junction was
  unavailable.

## Next action

Human approval recorded on 2026-10-19. Developer Agent may be assigned for the approved scope.

Handoff evidence: workflow/handoffs/analyst-to-developer.md
