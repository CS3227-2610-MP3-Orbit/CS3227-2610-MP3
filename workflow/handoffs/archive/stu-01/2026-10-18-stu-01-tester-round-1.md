# Handoff: TASK-STU-01-VERIFY-R1 — tester/verifier → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-STU-01-VERIFY-R1",
"requirementIds": [
"STU-01-R1",
"STU-01-R2",
"STU-01-R3",
"STU-01-R4",
"STU-01-R5",
"STU-01-R6",
"STU-01-R7",
"STU-01-R8",
"STU-01-AC1",
"STU-01-AC2",
"STU-01-AC3",
"STU-01-AC4",
"STU-01-AC5",
"STU-01-AC6",
"STU-01-AC7",
"STU-01-AC8",
"STU-01-AC9",
"STU-01-AC10",
"STU-01-AC11",
"STU-01-AC12",
"STU-01-AC13",
"STU-01-AC14",
"STU-01-AC15",
"STU-01-AC16",
"STU-01-AC17",
"STU-01-AC18",
"STU-01-AC19",
"STU-01-AC20",
"STU-01-AC21",
"STU-01-AC22",
"SH-02-R3",
"SH-02-R9",
"SH-03-R6",
"SH-03-R10",
"SH-03-R11",
"SH-03-R12",
"SH-03-R13",
"SH-03-R14",
"SH-03-R16",
"SH-03-R17"
],
"status": "failed",
"changedFiles": [
"src/features/student/slots/verification.test.ts",
"supabase/tests/student_browse_available_slots.test.sql",
"tests/e2e/student-browse-available-slots.spec.ts",
"workflow/handoffs/archive/stu-01/2026-10-18-stu-01-tester-round-1.md"
],
"verification": [
{
"check": "npm test",
"result": "passed",
"evidence": "4 files passed, 1 skipped; 25 tests passed and 4 remained todo, including 9 independent boundary/source checks."
},
{
"check": "transactional migration plus independent pgTAP test, followed by ROLLBACK",
"result": "failed",
"evidence": "17 of 21 pgTAP assertions passed and 4 failed: two assertions reproduced one cursor defect, one exposed protected profile-column access, and one showed invalid lecturer-course assignment integrity was absent. The enclosing transaction rolled back."
},
{
"check": "npx playwright test tests/e2e/student-browse-available-slots.spec.ts",
"result": "failed",
"evidence": "1 test failed: expected exact /login but received /login?courseId=...&role=student. Login rendered and slot UI did not."
},
{
"check": "npm run test:db",
"result": "blocked",
"evidence": "The persistent local database does not have the uncommitted migration applied, so the new pgTAP file stopped at relation public.courses does not exist; the isolated transactional run supplied behavioral evidence without changing local state."
},
{
"check": "npm run lint",
"result": "passed",
"evidence": "ESLint exited without findings."
},
{
"check": "npm run typecheck",
"result": "passed",
"evidence": "Next route types generated and TypeScript exited successfully."
},
{
"check": "npm run check:spec",
"result": "failed",
"evidence": "Coverage increased to 52 of 139 criteria; 32 approved shared-spec criteria remain uncovered. All STU-01 AC IDs now have non-skipped references, but failing tests prevent acceptance."
},
{
"check": "git diff --check on verifier-owned paths",
"result": "passed",
"evidence": "No whitespace errors."
}
],
"unresolvedIssues": [
"F-TV-01: server-issued continuation cursors are rejected, so pagination cannot traverse beyond page one.",
"F-TV-02: the signed-out proxy redirect preserves attacker-controlled browse query parameters on /login instead of redirecting exactly to /login.",
"F-TV-03: authenticated Students retain direct SELECT privilege for protected profiles.created_at and the existing staff policy can expose staff rows outside the browse projection; SH-01 and STU-01/SH-03 need explicit reconciliation before changing shared auth/RLS behavior.",
"F-TV-04: the new course_lecturers table accepts a current assignment to an inactive course, contrary to confirmed SH-02-R3/SH-02-AC4.",
"Authenticated happy/empty/error/filter UI flows, wrong-role browser navigation, manual keyboard/320px/200% zoom, and Firefox/Safari/Edge checks were not executed because deterministic role fixtures and manual browser coverage were unavailable."
]
}

<!-- HANDOFF:END -->

## Status

failed

## Scope

- Task: `TASK-STU-01-VERIFY-R1`, functional review round 1.
- Approved spec/version: `workflow/specs/student/STU-01-browse-available-slots.md`,
  `0.1-approved`, supplied hash-object `17248e77c0b9801810c3c190e925bfec62ab03b9`.
- Shared specs: SH-02 `8e8f677d361a18a41e9b073ac189618a2b9b63b5`, SH-03
  `2f704fe55f177fe8d9a8320dc5c5ea71c91e1680`, SH-01
  `451469df2a1f39233656b1c25d8aedccbd71702e`.
- Implementation reviewed: uncommitted patch based on
  `e5893b28a6d898bdfb698dcb7f48e293ab373e7b`; developer handoff
  `workflow/handoffs/archive/stu-01/2026-10-18-stu-01-developer-round-0.md`. There is no implementation commit.
- Allowed test paths: the three test files listed under Changes, plus this handoff.
- Approval limitation: the approval record is team-reported repository evidence and does not
  independently authenticate reviewer identity or a protected-PR approval.

## Test matrix

| Requirement             | Check                                                                  | Result                         | Evidence                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| STU-01-AC1              | Active Student boundary, role check before RPC, bounded first page     | passed                         | Vitest and pgTAP assertion 1                                                                                                              |
| STU-01-AC2              | Signed-out direct boundary and real `/student/slots` navigation        | failed                         | Mocked boundary refused before DB, but Playwright received `/login?courseId=...&role=student`, not exact `/login`                         |
| STU-01-AC3              | Wrong-role direct boundary/database call                               | passed with UI limitation      | Vitest refusal-before-DB and pgTAP assertion 21 passed; real Lecturer/Admin browser fixture was unavailable                               |
| STU-01-AC4              | Past versus future by database time                                    | passed                         | pgTAP assertion 2                                                                                                                         |
| STU-01-AC5              | Inactive course/profile, wrong role, missing assignment                | passed                         | pgTAP assertion 3                                                                                                                         |
| STU-01-AC6              | Pending/approved/completed excluded                                    | passed                         | pgTAP assertion 4                                                                                                                         |
| STU-01-AC7              | Rejected/cancelled history eligible                                    | passed                         | pgTAP assertion 5                                                                                                                         |
| STU-01-AC8              | Exact safe row projection and runtime schema                           | passed                         | pgTAP assertion 6 and Vitest strict projection check                                                                                      |
| STU-01-AC9–AC12         | Lecturer/course/SGT date filters and intersection                      | passed                         | pgTAP assertions 7–9 and RPC-argument Vitest                                                                                              |
| STU-01-AC13             | 20-row deterministic keyset traversal                                  | failed                         | Page one returned 20 and a cursor; replay returned `validation_error`, so the remaining row was unreachable                               |
| STU-01-AC14             | UUID/date/cursor/unknown/repeated/oversized validation before query    | passed                         | Independent Vitest abuse matrix and pgTAP assertion 13                                                                                    |
| STU-01-AC15             | Inaccessible/nonexistent indistinguishable response                    | passed                         | Vitest refusal-shape and pgTAP empty-success checks                                                                                       |
| STU-01-AC16             | Neutral empty message and clear path                                   | passed by source inspection    | Verifier asserted exact approved text and `/student/slots` clear link; authenticated browser rendering was unexecuted                     |
| STU-01-AC17             | Generic retryable dependency failure and safe log                      | passed                         | Injected RPC error/malformed response; raw identifier, SQL detail, and sample secret absent from captured log                             |
| STU-01-AC18             | Stored markup/instructions rendered as text                            | passed with browser limitation | Strict strings survive as data; JSX uses interpolation and no `dangerouslySetInnerHTML`; live authenticated script fixture was unexecuted |
| STU-01-AC19             | No LLM or AI accounting                                                | passed                         | AI mock stayed unused and pgTAP `ai_usage` before/after remained zero                                                                     |
| STU-01-AC20             | Browse read-only                                                       | passed                         | Function is `stable`, source has no DML, and repeated calls left booking count unchanged                                                  |
| STU-01-AC21             | Direct reads outside projection denied                                 | failed                         | Feature-table privileges were denied, but `has_column_privilege('authenticated', 'public.profiles', 'created_at', 'select')` was true     |
| STU-01-AC22             | Caller scope/page/sort/role/ownership cannot expand results            | passed                         | Abuse matrix stopped before RPC and database page remained at most 20                                                                     |
| SH-02-AC4               | Current assignments require active course and active Lecturer endpoint | failed                         | Insert of a current assignment to an inactive course raised no exception                                                                  |
| SH-02-AC12 / SH-03-AC19 | Direct table/projection boundary                                       | failed                         | New feature tables are denied, but protected profile audit-column access remains available                                                |
| SH-03-AC21 / AC22       | Page size and cursor behavior                                          | failed                         | Server-produced cursor was not accepted on page two                                                                                       |
| SH-03-AC24              | Signed-out and wrong-role navigation                                   | failed/blocked                 | Signed-out exact redirect failed; wrong-role real-browser path was not executed                                                           |
| SH-03-AC28              | Keyboard, responsive/zoom, cross-browser                               | unexecuted                     | Requires authenticated fixtures and manual/current-major-browser verification                                                             |

## Defects

### F-TV-01 — High — server-issued cursors cannot be replayed

- Requirement: `STU-01-AC13`, `SH-03-AC21`, `SH-03-AC22`.
- Reproduction: create 21 available slots for one course, call `browse_available_slots` for page one,
  then pass its `nextCursor` unchanged with the same course filter.
- Expected: `success` with the one remaining row and no duplicate ID.
- Actual: `validation_error` with no `slots` member.
- Evidence: transactional pgTAP assertions 10–12. Inspection shows PostgreSQL base64 encoding the
  cursor payload can insert a newline after 76 characters, while both validators allow only contiguous
  `[A-Za-z0-9_-]+` segments. The server therefore emits a token that its own boundary rejects.

### F-TV-02 — Medium — signed-out redirect retains untrusted browse query parameters

- Requirement: `STU-01-AC2`, `SH-03-AC24`.
- Reproduction: while signed out, navigate to
  `/student/slots?courseId=22222222-2222-4222-8222-222222222222&role=student`.
- Expected: exact `/login`, with no slot data.
- Actual: `/login?courseId=22222222-2222-4222-8222-222222222222&role=student`; the login page rendered
  and no slot UI rendered.
- Evidence: Playwright failure and `src/lib/supabase/proxy.ts`, which clones the source URL and replaces
  only its pathname.

### F-TV-03 — High — protected profile columns remain directly readable

- Requirement: `STU-01-AC21`, `STU-01-R4`, `SH-03-AC19`.
- Reproduction: inspect `has_column_privilege('authenticated', 'public.profiles', 'created_at',
'select')` after the new migration, or query staff profiles as an active Student under the existing
  staff-read RLS policy.
- Expected: Student access outside the available-slot projection returns no internal audit/inactive
  profile fields.
- Actual: the authenticated role retains column privilege; pgTAP assertion 18 failed. The foundation
  policy also permits active users to select staff rows without requiring the target profile to be
  active.
- Evidence: transactional pgTAP assertion 18 and
  `supabase/migrations/20261017000000_initial_schema.sql` policies.
- Specification impact: SH-01 says active users read staff but does not define a safe column projection,
  while STU-01/SH-03 forbid this direct surface. Resolve that shared-contract conflict before changing
  auth/RLS behavior; do not silently choose one specification over another.

### F-TV-04 — High — current lecturer-course assignment endpoint integrity is absent

- Requirement: `SH-02-R3`, `SH-02-AC4` (included in the developer's assigned shared scope).
- Reproduction: insert a current `course_lecturers` row joining an inactive course to an otherwise
  active Lecturer.
- Expected: database integrity refuses the assignment.
- Actual: insert succeeds; pgTAP `throws_ok` caught no exception.
- Evidence: transactional pgTAP assertion 19. The table has foreign keys and pair uniqueness but no
  active-course/active-Lecturer endpoint enforcement.

## Changes

- `src/features/student/slots/verification.test.ts`: independent authorization, input abuse,
  projection, failure/logging, empty-state, stored-text, and no-AI tests. Hash-object
  `00b4d62f457c0c2d8626bc963735fda619fd8a22` before this handoff-only edit.
- `supabase/tests/student_browse_available_slots.test.sql`: independent transactional pgTAP availability,
  filters, pagination, RLS/projection, read-only, no-AI, and integrity checks. Hash-object
  `bcfdf5d2354bb0e0184825f3931a854e70c1ef68` before this handoff-only edit.
- `tests/e2e/student-browse-available-slots.spec.ts`: signed-out navigation/no-slot-data check.
  Hash-object `27bcf2854b660c0e9b5b4c077f11bb985a8e7844`.
- `workflow/handoffs/archive/stu-01/2026-10-18-stu-01-tester-round-1.md`: this evidence.
- No application code, migration, specification, CI, hook, auth configuration, or developer-owned test
  was modified.

## Commands

- `npx vitest run src/features/student/slots/verification.test.ts`: passed 8 tests in the focused run;
  after the empty-state addition, `npm test` passed all 9 independent tests as part of 25 total passes.
- `npx playwright test tests/e2e/student-browse-available-slots.spec.ts`: failed 1/1 with the redirect
  URL mismatch documented in F-TV-02. No retry was needed because the mismatch was deterministic and
  reproduced by source inspection.
- Transactional migration + pgTAP via the local Supabase PostgreSQL container + `ROLLBACK`: 17/21
  assertions passed; assertions 11, 12, 18, and 19 failed. No state was retained.
- `npm run test:db`: blocked/failed before the new assertions because the persistent local database did
  not have the uncommitted migration applied (`public.courses` absent).
- `npm test`: passed, 4 files passed, 1 skipped, 25 tests passed, 4 todo.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run check:spec`: failed, 52/139 ACs covered with 32 errors; approved shared-spec gaps remain outside this bounded
  verifier assignment.
- `git diff --check -- <verifier-owned paths>`: passed.

## Gaps and unresolved questions

- No authenticated Student, Lecturer, or Administrator browser storage state/fixture exists, so only
  signed-out navigation ran end to end. The application/database boundary was exercised independently.
- Keyboard focus, 320 CSS pixel/200% zoom, Firefox, Safari, and Edge checks remain unexecuted/manual.
- The persistent local database was not mutated. This prevented the ordinary `npm run test:db` route;
  the migration and tests instead ran in one isolated transaction and were rolled back.
- No concurrent page-change scenario (`SH-03-AC23`) or query-plan/capacity measurement ran.
- F-TV-03 is both an implementation failure against STU-01 and an approved-spec interaction that needs
  coordinator/human resolution before a shared auth/RLS fix.

## Next action

Return F-TV-01, F-TV-02, and F-TV-04 to the developer for fixes within coordinator-approved scopes;
route F-TV-03 through shared-spec/auth ownership for an explicit decision, then rerun the affected
pgTAP, Playwright, unit, lint, type, and traceability checks.

Handoff evidence: workflow/handoffs/archive/stu-01/2026-10-18-stu-01-tester-round-1.md
