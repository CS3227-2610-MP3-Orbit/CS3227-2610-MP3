# Handoff: TASK-STU-01-FIX-R1 — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-STU-01-FIX-R1",
"requirementIds": [
"STU-01-AC2",
"STU-01-AC13",
"SH-02-R3",
"SH-02-AC4",
"SH-03-AC21",
"SH-03-AC22",
"SH-03-AC24"
],
"status": "incomplete",
"changedFiles": [
"src/lib/supabase/proxy.ts",
"supabase/migrations/20261018000000_student_browse_available_slots.sql",
"workflow/handoffs/archive/stu-01/2026-10-18-stu-01-developer-round-1.md"
],
"verification": [
{
"check": "transactional new migration plus independent student_browse_available_slots pgTAP followed by ROLLBACK",
"result": "failed",
"evidence": "Cursor assertions 10-12 now pass. Assignment assertion 19 catches SQLSTATE 23514 as required but still reports not-ok because the verifier used the two-argument throws_ok overload and its descriptive text became an exact expected exception message. Deferred profiles assertion 18 remains failed. The transaction rolled back."
},
{
"check": "npx playwright test tests/e2e/student-browse-available-slots.spec.ts",
"result": "passed",
"evidence": "1 Chromium test passed; signed-out protected URL with hostile query redirected exactly to /login and rendered no slot data."
},
{
"check": "npx vitest run src/features/student/slots/verification.test.ts src/features/student/slots/validation.test.ts",
"result": "passed",
"evidence": "2 files and 19 tests passed."
},
{
"check": "npm test",
"result": "passed",
"evidence": "4 files passed, 1 skipped; 25 tests passed and 4 remained todo."
},
{
"check": "npm run lint",
"result": "passed",
"evidence": "ESLint exited 0 without findings."
},
{
"check": "npm run typecheck",
"result": "passed",
"evidence": "Next route generation and TypeScript exited 0."
},
{
"check": "npm run test:db",
"result": "blocked",
"evidence": "The local database has not permanently applied the new migration, so the independent browse pgTAP file stopped at missing public.courses. The two pre-existing pgTAP files passed. No reset or database push was authorized."
},
{
"check": "npm run check:spec",
"result": "failed",
"evidence": "14 specs, 139 criteria, 52 covered; unrelated and not-yet-implemented approved SH-01/SH-02/SH-03 criteria remain uncovered."
},
{
"check": "npm run check:secrets",
"result": "passed",
"evidence": "Secret scanner exited 0."
},
{
"check": "npm run check:sensitive",
"result": "passed",
"evidence": "Classifier correctly requires independent review for the migration and also lists pre-existing unrelated agent-control changes."
},
{
"check": "Prettier on src/lib/supabase/proxy.ts and git diff --check on assigned implementation paths",
"result": "passed",
"evidence": "Proxy formatting was unchanged and no whitespace errors were reported."
}
],
"unresolvedIssues": [
"F-TV-03 / SEC-R1-01 profiles access remains deliberately unchanged because the coordinator identified a specification/shared-auth ownership conflict.",
"Verifier pgTAP assertion 19 misuses the two-argument throws_ok overload: it caught the new SQLSTATE 23514 integrity exception but compared its message to the assertion description. The verifier should correct and rerun its own test rather than production code adopting a test-specific error string.",
"npm run test:db cannot exercise the new migration until a reviewed local reset/application workflow is authorized; transactional combined execution was used and rolled back instead.",
"npm run check:spec remains red for broader approved shared criteria outside this fix round.",
"No implementation commit exists because the developer role prohibits committing; all review is against the working tree based on e5893b28a6d898bdfb698dcb7f48e293ab373e7b."
]
}
<!-- HANDOFF:END -->

## Scope and gate

- Task: `TASK-STU-01-FIX-R1`.
- Confirmed findings in scope: `F-TV-01`, `F-TV-02`, and `F-TV-04` against the same approved spec
  digests and baseline `e5893b28a6d898bdfb698dcb7f48e293ab373e7b` used in round 0.
- Allowed paths were followed exactly. Verifier tests, specifications, existing migrations, other app
  code, CI, logs, hooks, and security configuration were not edited.
- `F-TV-03` / `SEC-R1-01`, per-slot IDs, and unapproved text/catalogue bounds were explicitly excluded
  and remain unchanged.
- No commit, push, merge, deployment, database push/reset, `.env` access, or production access occurred.

## Changes

- `F-TV-01`: PostgreSQL base64 payload/signature output now has all encoder-inserted whitespace removed
  before URL-safe translation, signing, and emission. The emitted token remains versioned, HMAC-protected,
  filter-bound, opaque, and within the 512-character contract. Unchanged replay now succeeds.
- `F-TV-02`: the signed-out proxy constructs `/login` from the request origin instead of cloning the
  protected URL, so attacker-controlled query parameters are not carried to the public login page.
- `F-TV-04`: a fixed-`search_path`, security-definer trigger now refuses creation or reactivation of a
  current course-lecturer assignment unless the course is active and the profile is active with trusted
  `lecturer` role. Deactivation remains possible to preserve history.

## Decisions and assumptions

- The assignment trigger runs only when a row is inserted or its course, lecturer, or active state is
  updated. It validates every active resulting row, while allowing an invalidated historical/current row
  to be deactivated without requiring its endpoints to become active again.
- The trigger emits a fixed non-sensitive database integrity message. It was not changed to an AC-labelled
  sentence merely to satisfy a verifier assertion using the wrong pgTAP overload.
- No broader profile grant/policy change was made because the coordinator explicitly reserved that
  cross-spec decision for shared-auth/spec owners.

## Evidence

| Check                                                  | Actual result                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transactional migration + independent pgTAP + rollback | 19 assertions behaved as expected, including all three cursor assertions; profile assertion 18 remained intentionally unresolved; assertion 19 caught SQLSTATE `23514` but the malformed test expected its description as the exact error message. Overall pgTAP output: 2 not-ok of 21. |
| Focused independent/developer Vitest                   | Passed: 19/19.                                                                                                                                                                                                                                                                           |
| Focused signed-out Playwright                          | Passed: 1/1 Chromium test.                                                                                                                                                                                                                                                               |
| Full `npm test`                                        | Passed: 25 tests, 4 todo.                                                                                                                                                                                                                                                                |
| `npm run lint`                                         | Passed.                                                                                                                                                                                                                                                                                  |
| `npm run typecheck`                                    | Passed.                                                                                                                                                                                                                                                                                  |
| `npm run test:db`                                      | Blocked for new feature because its migration is intentionally unapplied locally; existing two DB files passed before the missing-table stop.                                                                                                                                            |
| `npm run check:spec`                                   | Failed: 52/139 criteria covered; broader shared coverage remains incomplete.                                                                                                                                                                                                             |
| Secrets/sensitive/diff checks                          | Passed; sensitive review remains required.                                                                                                                                                                                                                                               |

## Findings and unresolved questions

1. **Verifier test defect:** `throws_ok(sql, description)` is interpreted by pgTAP as
   `throws_ok(sql, expected_error_message)`. The captured SQLSTATE proves the new integrity trigger works,
   but the verifier must use the appropriate overload to attach a description and independently recheck
   `F-TV-04`.
2. **Deferred shared-auth decision:** direct protected profile-column access remains unchanged exactly as
   instructed; it still prevents the overall database suite from being green.
3. **Local database state:** the new migration is deliberately unapplied, so ordinary `npm run test:db`
   cannot run its feature test. The combined transaction validates migration plus fixtures without
   retaining state.
4. **Traceability:** broader approved shared requirements still lack tests and keep `check:spec` red.

## Next action

Have the functional verifier correct only its own `throws_ok` assertion, rerun cursor, assignment,
redirect, and relevant regression tests against this working-tree patch, and have the security reviewer
recheck the fixed surfaces. Do not merge or deploy; the shared proxy and migration require independent
human review.
