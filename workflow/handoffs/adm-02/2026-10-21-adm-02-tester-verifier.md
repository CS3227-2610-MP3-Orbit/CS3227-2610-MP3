# Handoff: TASK-ADM-02 / ADM-02-R1..R9, AC1..AC16 — tester_verifier → coordinator

<!--
Keep this JSON block valid. The completion hook validates structure, not truth or approval.
Use [] for no changed files or no unresolved issues. "blocked" and "not-run" are honest results.
-->
<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-02",
"requirementIds": ["ADM-02-R1", "ADM-02-R2", "ADM-02-R3", "ADM-02-R4", "ADM-02-R5", "ADM-02-R6", "ADM-02-R7", "ADM-02-R8", "ADM-02-R9"],
"status": "passed",
"changedFiles": [],
"verification": [
{"check": "npm run lint", "result": "passed", "evidence": "0 errors/warnings"},
{"check": "npm run typecheck", "result": "passed", "evidence": "next typegen + tsc --noEmit clean"},
{"check": "npx vitest run --exclude 'workflow/**'", "result": "passed", "evidence": "Test Files 36 passed; Tests 268 passed, incl. every admin/courses unit file"},
{"check": "npm run check:spec", "result": "passed", "evidence": "0 errors; ADM-02-AC1..AC16 all covered by a non-skipped test; exit code 0"},
{"check": "npx supabase test db", "result": "passed", "evidence": "Files=13 Tests=226 Result: PASS, incl. supabase/tests/admin_courses.test.sql (43 pgTAP assertions, all ok)"},
{"check": "eval \"$(npx supabase status -o json | node tests/integration/local-supabase-env.mjs)\" && npm run test:admin-courses:integration", "result": "passed", "evidence": "Test Files 1 passed; Tests 12 passed"},
{"check": "eval \"$(npx supabase status -o json | node tests/integration/local-supabase-env.mjs)\" && npm run test:admin:integration (ADM-01 regression)", "result": "passed (1 pre-existing local-only failure)", "evidence": "Test Files 1 failed | 1 passed; Tests 1 failed | 25 passed -- the single failure is [ADM-01-AC14], a documented local-only seed-id issue (null profile row for a hardcoded seed admin id), unrelated to ADM-02 and reset by CI"},
{"check": "ADMIN_E2E_PORT=3104 npx playwright test --config tests/e2e/admin.playwright.config.ts", "result": "passed (1 unrelated pre-existing failure)", "evidence": "run 1: 25/26 passed; the only failure is [SH-07-AC1]/[SH-07-AC20] (ui-shell.spec.ts, a different in-flight feature, not ADM-02/03/04); both admin-courses.spec.ts tests passed. Re-ran a filtered subset a second time; the same unrelated ui-shell sign-in test flaked again (and once a second ui-shell test, SH-07-AC10) while every ADM-02/03/04-scoped test stayed green both times"},
{"check": "post-run DB hygiene check (service-role read, then cleanup)", "result": "passed after cleanup", "evidence": "found 9 pre-existing stray 'E2E...'-coded course rows (plus their course_lecturers rows) left on the shared stack by earlier admin-courses.spec.ts runs that had no cleanup step; verified none were referenced by any slot/booking, then deleted them (course_lecturers first, then courses); 0 remain. All of this session's own vitest-created 'adm02-'/'adm03-'/'adm04-' fixture rows, auth users, and admin.activity-summary ai_usage rows were independently confirmed at 0 after every run"}
],
"unresolvedIssues": [
"[ADM-02-AC11] pgTAP proves the invariant (a second active row for the same pair always fails, and the partial unique index itself throws 23505 when inserted directly, bypassing the RPC) but never opens two real simultaneous connections, so the AC's literal 'two concurrent attempts' race is not executed as a true race -- same class of limitation already accepted for ADM-01-AC14. Low severity: the actual concurrency authority (the unique index) is exercised directly, not just assumed.",
"tests/e2e/admin-courses.spec.ts creates a fixture course via the UI on every run but has no afterAll/cleanup step (unlike admin-announcements.spec.ts and admin-reports.spec.ts in the same config), so repeated runs accumulate stray rows on the shared local stack. Found and removed 9 accumulated rows during this verification; recommend the coordinator ask for a cleanup step to be added."
]
}
<!-- HANDOFF:END -->

## Status

passed

## Scope and gate

- Task/requirement IDs: TASK-ADM-02 (issue #19), ADM-02-R1..R9, ADM-02-AC1..AC16.
- Spec reviewed: `workflow/specs/admin/ADM-02-manage-courses-and-assignments.md`, front matter
  `status: approved`, owner Johannsen, 2026-10-20, covering R1-R9/AC1-AC16 as written.
- Implementation/handoffs reviewed: `workflow/handoffs/adm-02/2026-10-20-adm-02-requirements-architect.md`,
  `workflow/handoffs/adm-02/2026-10-20-adm-02-developer.md` (status `incomplete` there only because
  of a sandbox-only e2e symptom on the developer's own prior run; independently re-verified clean
  below).
- Allowed test paths used: none needed editing — all verification ran against the existing test
  suite as-is. No test, handoff-adjacent fixture, product code, or migration was modified. A tiny
  read-only Node probe script (service-role queries only, immediately discarded, never committed)
  was used in the scratchpad dir to check for and remove stray shared-stack fixture rows; it wrote
  no file under the project tree.
- This review is independent: every count below was produced by running the suite myself, not by
  trusting the developer handoff's reported numbers.

## AC → test traceability

| AC   | Requirement | Test(s)                                                                                                                                            | Layer                   | Judgment                                                                                                                                                             |
| ---- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1  | R1          | `tests/integration/admin-courses.test.ts` ("creating a course..."); `src/features/admin/courses/validation.test.ts`                                | live DB + unit          | Sound: asserts both the returned shape and the real stored row (exactly one, normalized code, `isActive: true`).                                                     |
| AC2  | R1          | `tests/integration/admin-courses.test.ts` ("a duplicate normalized code...")                                                                       | live DB                 | Sound: exercises both an active and an inactive duplicate against the real unique index, then counts the real row.                                                   |
| AC3  | R1          | `src/features/admin/courses/validation.test.ts`; `src/features/admin/courses/server.test.ts`                                                       | unit (mocked)           | Sound: boundary values and invalid characters checked; confirms no RPC call is made on validation failure.                                                           |
| AC4  | R2          | `tests/integration/admin-courses.test.ts` ("editing a course's code and name...")                                                                  | live DB                 | Sound: re-reads the stored row after the edit.                                                                                                                       |
| AC5  | R2          | `tests/integration/admin-courses.test.ts` ("editing to another course's normalized code...")                                                       | live DB                 | Sound: confirms neither of the two real rows changed.                                                                                                                |
| AC6  | R3          | `supabase/tests/admin_courses.test.sql`; `tests/integration/admin-courses.test.ts`; `src/features/admin/courses/presentation.test.ts`              | pgTAP + live DB + unit  | Sound: pgTAP directly checks the course/slot/assignment rows are preserved and the slot drops out of `browse_available_slots()`.                                     |
| AC7  | R3          | `supabase/tests/admin_courses.test.sql`; `tests/integration/admin-courses.test.ts`; e2e                                                            | pgTAP + live DB + e2e   | Sound: reactivation restores visibility, checked at the database, server-action, and browser layers.                                                                 |
| AC8  | R4          | `tests/integration/admin-courses.test.ts`; e2e                                                                                                     | live DB + e2e           | Sound: counts exactly one active row for the pair.                                                                                                                   |
| AC9  | R4          | `supabase/tests/admin_courses.test.sql`; `tests/integration/admin-courses.test.ts`                                                                 | pgTAP + live DB         | Sound: refusal plus a real zero-row count.                                                                                                                           |
| AC10 | R4          | `supabase/tests/admin_courses.test.sql`; `tests/integration/admin-courses.test.ts`                                                                 | pgTAP + live DB         | Sound: both refusal kinds (`lecturer_inactive`, `lecturer_wrong_role`) checked separately, with a real zero-row count.                                               |
| AC11 | R4          | `supabase/tests/admin_courses.test.sql`                                                                                                            | pgTAP                   | **Partial.** Proves the refusal and that the unique index itself throws on a direct bypass insert, but never runs two real simultaneous connections — see finding 1. |
| AC12 | R5          | `supabase/tests/admin_courses.test.sql`; `tests/integration/admin-courses.test.ts`; e2e                                                            | pgTAP + live DB + e2e   | Sound: checks `is_active`/`ended_at`, the untouched booking/slot, and both real `in_app_notifications` rows from the existing trigger.                               |
| AC13 | R6          | `supabase/tests/admin_courses.test.sql`                                                                                                            | pgTAP                   | Sound: confirms two distinct rows exist and the prior row's `ended_at` is byte-for-byte unchanged — a genuinely strong check, not tautological.                      |
| AC14 | R7          | `tests/integration/admin-courses.test.ts`; `src/features/admin/courses/presentation.test.ts`; `src/features/admin/courses/validation.test.ts`; e2e | live DB + unit + e2e    | Sound: asserts the exact allowlisted key set via `Object.keys(...).sort()`, not just a subset match.                                                                 |
| AC15 | R8          | `supabase/tests/admin_courses.test.sql`; `tests/integration/admin-courses.test.ts`                                                                 | pgTAP + live DB         | Sound: covers Server-Action redirects, a direct non-admin RPC call, and a direct `anon` call (42501 before the function body runs).                                  |
| AC16 | R9          | `src/features/admin/courses/server.test.ts`; `tests/integration/admin-courses.test.ts`                                                             | unit (mocked) + live DB | Sound: unit asserts `generateText` is never called; integration asserts a real `ai_usage` count delta of zero after a real mutation.                                 |

No AC is backed only by a mock when the spec demanded live-DB evidence; every "integration; live DB"
AC has a real-Postgres/real-Auth test, and the one weak spot (AC11) is a database-authority proof,
not a tautology.

## Commands run and actual results

- `npm run lint` → passed, 0 errors/warnings.
- `npm run typecheck` → passed.
- `npx vitest run --exclude 'workflow/**'` → Test Files 36 passed; Tests 268 passed.
- `npm run check:spec` → 0 errors, exit code 0; every ADM-02-AC1..AC16 covered; remaining
  repo-wide warnings are unrelated draft specs (`LEC-05`/`LEC-06`/`SH-02`..`SH-05`/`WFG-01`..`05`).
- `npx supabase test db` → `Files=13, Tests=226 ... Result: PASS` (all 13 files, incl.
  `admin_courses.test.sql`, report "ok").
- `eval "$(npx supabase status -o json | node tests/integration/local-supabase-env.mjs)" && npm run test:admin-courses:integration`
  → Test Files 1 passed; Tests 12 passed.
- `eval "..." && npm run test:admin:integration` → Test Files 1 failed | 1 passed; Tests 1 failed |
  25 passed. The one failure, `[ADM-01-AC14]`, throws `TypeError: Cannot read properties of null
(reading 'is_active')` because the hardcoded seed admin ids it reads no longer have matching
  `profiles` rows on this long-lived, never-reset local stack (introduced by #33's seed change) —
  exactly the known local-only issue flagged in the assignment, not an ADM-02 regression.
- `eval "..." && ADMIN_E2E_PORT=3104 npx playwright test --config tests/e2e/admin.playwright.config.ts`
  → 25 passed, 1 failed (`[SH-07-AC1]`/`[SH-07-AC20]`, ui-shell sign-in → dashboard → sign-out
  flow — unrelated to ADM-02/03/04). Both `admin-courses.spec.ts` tests
  (`[ADM-02-AC1][AC6][AC7][AC8][AC12][AC14][SH-07-AC15][SH-07-AC18]` and
  `[ADM-02-AC3][SH-07-AC18]`) passed. Re-ran a filtered subset a second time to probe the one
  failure; it reproduced, and once a second, unrelated `ui-shell.spec.ts` test
  (`[SH-07-AC10]`) also flaked on student sign-in redirect timing — this looks like local
  sign-in-flow flakiness in `ui-shell.spec.ts` itself (a different, in-flight feature), not an
  ADM-02 defect; every ADM-02-scoped test passed in both runs.

## Findings

| #   | Severity           | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Reproduction                                                                                                                                                                              |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Low                | `[ADM-02-AC11]`'s "two concurrent attempts" half is not literally exercised: `supabase/tests/admin_courses.test.sql` proves the refusal sequentially and shows the partial unique index itself throws `23505` on a direct bypass insert, but pgTAP never opens two real simultaneous sessions (the same documented limitation as `ADM-01-AC14`). The underlying invariant is credibly proven (the unique index, not app logic, is the authority), so this is a coverage gap, not a defect. | `supabase/tests/admin_courses.test.sql:120-148`; no `Promise.all` two-client race exists anywhere under `tests/integration/admin-courses.test.ts` or the pgTAP file.                      |
| 2   | Low (test hygiene) | `tests/e2e/admin-courses.spec.ts` creates a fixture course via the UI (`code = E2E${Date.now()...}`) on every run with no `afterAll` cleanup, unlike the sibling `admin-announcements.spec.ts`/`admin-reports.spec.ts`. Found 9 accumulated stray course rows (each with a `course_lecturers` row) on this shared local stack from prior runs; confirmed none were referenced by any slot/booking, then deleted them during this verification. Left 0 stray rows.                          | `tests/e2e/admin-courses.spec.ts:26` (fixture code generation, no matching delete anywhere in the file); confirmed by querying `courses` where `code ilike '%E2E%'` before/after cleanup. |

No defect was found in `ADM-02`'s product code, migration, or RPC behavior. Both findings above are
coverage/hygiene gaps, not functional defects.

## Changes

None — read-only verification. No test, fixture, product code, or migration file was modified. A
read-only cleanup of pre-existing stray shared-stack data (finding 2) was performed via direct
service-role queries, not by editing any file.

## Gaps and unresolved questions

- `ADM-02-AC11`'s true-concurrency half (finding 1) would need a real two-connection race (e.g. two
  `pg` clients issuing `admin_assign_lecturer` simultaneously inside one pgTAP-adjacent script, or a
  dedicated vitest `Promise.all` against two signed-in clients) to fully satisfy the AC's literal
  wording. Not blocking: the unique index is the documented concurrency authority and is tested
  directly.
- No other coverage gaps found; every other AC has a live-DB or pgTAP test that matches its stated
  intent, not just its wording.

## Next action

Coordinator: this feature can proceed — no functional defect was found and every automated check
(lint, typecheck, unit, pgTAP, both live-DB integration and e2e suites) passes independently of the
developer's own report. Optionally ask the developer/next round to (a) add a true two-connection
concurrency test for `ADM-02-AC11`, and (b) add an `afterAll` cleanup to
`tests/e2e/admin-courses.spec.ts` so repeated runs stop accumulating stray rows on the shared stack.

Handoff evidence: workflow/handoffs/adm-02/2026-10-21-adm-02-tester-verifier.md

## Coordinator follow-up (2026-10-21)

- Finding "admin-courses.spec.ts has no cleanup": resolved. The spec records each course code it
  creates and an `afterAll` deletes those courses and their `course_lecturers` rows with the local
  secret key (same no-print loading as `admin-announcements.spec.ts`). Re-run: 3/3 passed; `E2E%`
  course rows on the shared stack were 0 before and 0 after.
- Finding "AC11 concurrency is a sequential proxy": left open, accepted as Low; the partial unique
  index remains the authority and is checked directly.
