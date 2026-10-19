# Evidence summary: Lecturer consultation availability analysis

- Date: 2026-10-19
- Task: Draft the first Lecturer feature specification for consultation availability.
- Agent role: Requirements Analyst
- Skill invoked: `.codex/skills/consultation-spec/SKILL.md`
- Specification: `workflow/specs/lecturer/LEC-01-availability.md`
- Approval status: `draft`; human approval pending.

## Prompt summary

Inspected the current implementation and prepared a repository-grounded specification for creating, viewing, editing, and deleting Lecturer consultation slots with course/date/time fields, overlap prevention, past-value validation, RBAC/ownership, concurrency/database failure handling, and unit/integration/E2E coverage. No implementation was requested.

## Repository evidence

- Lecturer route boundary: `src/app/lecturer/layout.tsx`.
- Lecturer page: `src/app/lecturer/page.tsx` (dashboard heading only).
- Auth/RBAC: `src/lib/auth/session.ts`, `src/lib/auth/roles.ts`.
- Existing schema: `supabase/migrations/20261017000000_initial_schema.sql` (`profiles`, `ai_usage` only).
- Existing relevant tests: `src/lib/auth/roles.test.ts`, `src/lib/ai/*.test.ts`, `tests/e2e/auth.spec.ts`.
- Shared requirements: `workflow/specs/shared/SH-01-foundation.md`.

## Files changed

- `workflow/specs/lecturer/LEC-01-availability.md`
- `workflow/handoffs/analyst-to-developer.md`
- `workflow/logs/2026-10-19-lecturer-availability-analyst.md`

No application code, tests, migrations, CI, agent definitions, skills, or deployment files were changed.

## Acceptance criteria

`LEC-01-AC1` through `LEC-01-AC12` cover valid creation, RBAC, owner-scoped listing, unbooked edit/delete, cross-owner protection, active-booking protection, overlap prevention, invalid/past values, concurrent changes, database failures, and required test coverage.

## Commands and results

- `git -c safe.directory=... diff --check`: passed.
- `npm.cmd run check:spec`: exited 1. It detected `LEC-01` and the shared foundation, reported the new `LEC-01-AC1` through `LEC-01-AC12` as draft criteria without tests, and reported pre-existing parser errors for `LEC-02` through `LEC-05` due to missing front matter.

## Security requirements and tests

The draft requires server-side `requireRole("lecturer")`, authenticated-owner scoping, RLS, no trust in client owner IDs, safe errors, no premature privileged-client use, and direct unauthorized/cross-owner/RLS tests. Because the feature has no implementation yet, runtime feature-security tests remain pending.

## Findings and limitations

- No course or booking schema exists.
- Adjacent slots are allowed. A booking is active while booked and not cancelled; cancellation releases
  the slot until the one-hour-before-start deadline. Editing or hard deletion with active bookings is
  allowed after explicit confirmation, with affected-student notifications. The implementation must
  add a migration using `courses` and `course_lecturers`, and administrator changes require an audit
  record containing actor, action, slot, timestamp, and outcome. Exact error/status mapping and the
  definition of “past” remain unresolved.
- The specification remains draft and must not be implemented until a human resolves the relevant questions and records approval.

## Human decision

Human decisions received after the initial draft: Singapore timezone; administrator slot management;
course assignment to lecturers; hard deletion; duplicate submissions notify the user without silent
deduplication; Lecturer UI under the existing `src/app/lecturer/` and related feature folders; and
normal safe user-facing errors.

Pending. Next action: resolve the remaining open questions, then record the approval decision before
Developer handoff. No application code, migration, commit, or push has been performed.
