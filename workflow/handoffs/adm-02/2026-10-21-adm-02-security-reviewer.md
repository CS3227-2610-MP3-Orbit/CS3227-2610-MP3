# Security review: ADM-02 (courses and lecturer assignments)

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
{"check": "npm run lint", "result": "passed", "evidence": "eslint: no output, zero errors/warnings"},
{"check": "npm run typecheck", "result": "passed", "evidence": "next typegen + tsc --noEmit clean"},
{"check": "npx supabase test db (full pgTAP suite, rolled back)", "result": "passed", "evidence": "Files=13 Tests=226 Result: PASS, incl. supabase/tests/admin_courses.test.sql and rls_enabled.test.sql"},
{"check": "npx vitest run --exclude 'workflow/**' (full unit suite, mocked)", "result": "passed", "evidence": "Test Files 36 passed; Tests 268 passed"},
{"check": "npm run check:spec", "result": "passed", "evidence": "no ADM-02 errors; grep for ADM-02/error/FAIL on the output found nothing"},
{"check": "static review of 20261020140000_admin_courses.sql", "result": "passed", "evidence": "see Findings/Checks below"},
{"check": "static review of src/features/admin/courses/**, src/app/admin/courses/**", "result": "passed", "evidence": "see Findings/Checks below"}
],
"unresolvedIssues": [
"No independent live-DB concurrency run was executed by this review for ADM-02-AC11 beyond reading the pgTAP file; the developer handoff reports it passing and the unique index is the real concurrency authority by inspection.",
"e2e click-through (admin-courses.spec.ts) was not re-run by this review, per the assignment's instruction to avoid the shared e2e/integration suites; the developer and coordinator already reported it passing in a real install."
]
}
<!-- HANDOFF:END -->

## Status

passed — no blocking findings. Two Info-level notes recorded below; no Critical/High/Medium findings.

## Scope and effective restrictions

- Role: `security_reviewer`, operating on `feature/admin-announcements` at commit
  `72b6e363b17d9c83009f6bbc3da69d20d5bd6698` (clean working tree, verified via `git status --short`).
- Task/requirement IDs: `TASK-ADM-02` (issue #19), `ADM-02-R1`..`R9`, `ADM-02-AC1`..`AC16`.
- Spec: `workflow/specs/admin/ADM-02-manage-courses-and-assignments.md` (`status: approved`, owner
  Johannsen, 2026-10-20). Developer handoff read for context:
  `workflow/handoffs/adm-02/2026-10-20-adm-02-developer.md`.
- Files reviewed: `supabase/migrations/20261020140000_admin_courses.sql`,
  `supabase/tests/admin_courses.test.sql`, `src/features/admin/courses/{validation,server}.ts`,
  `src/app/admin/courses/{actions,page}.tsx`, `src/app/admin/layout.tsx`,
  `src/lib/auth/session.ts`, the pre-existing `20261018000000_student_browse_available_slots.sql`
  (table/grant/trigger context for `courses`/`course_lecturers`), and `.github/CODEOWNERS`.
- Effective restriction: this session carries the coordinator's full Claude Code toolset (Read,
  Bash, Edit, Write, Agent, Artifact — not the restricted Read/Grep/Glob set the
  `.claude/agents/security-reviewer.md` subagent definition describes), so "read-only" here is
  behavioral/instructional, not a technical sandbox boundary, except for the three handoff files
  this task explicitly directed me to write. No product code, migration, or test file was
  created, edited, or deleted. No destructive, state-changing, or push/commit/deploy command was
  run. No `.env` file was read; no secret was printed. The only commands executed were
  `git rev-parse`/`git log`/`git status`, `npm run lint`, `npm run typecheck`,
  `npx supabase test db` (pgTAP, every file wraps in `begin ... rollback`), `npx vitest run`
  (mocked unit tests), and `npm run check:spec` — all read-only against the shared local stack,
  leaving zero rows behind.

## Threat model / attack surfaces considered

1. A non-admin (lecturer/student) or signed-out caller invoking a course/assignment Server Action
   or RPC directly (bypassing the UI).
2. A malicious or malformed `code`/`name`/UUID payload reaching the RPC (SQL injection, oversized
   input, control characters, unpaired UTF-16 surrogates).
3. Concurrent assignment races double-booking a course/lecturer pair past the intended
   current-pair invariant.
4. Privilege escalation via `createAdminClient`/service-role use before an authorization check.
5. Information disclosure through raw database errors or an overly broad search query.
6. An admin mutation accidentally bypassing RPC and writing the table directly (grant leakage).

## Checks performed, with evidence

| Area                                       | Check                                                                                                                                                                                                                                                                                                                                                                              | Result | Evidence                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization order                        | Every RPC (`admin_create_course`, `admin_update_course`, `admin_set_course_active`, `admin_list_courses`, `admin_assign_lecturer`, `admin_remove_assignment`) checks `current_app_role() = 'admin'` as its first statement, before touching any row.                                                                                                                               | passed | `supabase/migrations/20261020140000_admin_courses.sql:38,94,164,212,284,353`                                                         |
| Authorization order (app layer)            | `src/app/admin/layout.tsx` calls `requireRole("admin")`, covering every `/admin/courses/*` page; every Server Action in `src/app/admin/courses/actions.ts` re-checks `requireRole("admin")` before delegating to `src/features/admin/courses/server.ts`, which checks it again.                                                                                                    | passed | `src/app/admin/layout.tsx:6`; `src/app/admin/courses/actions.ts:17,23,27,32,37`                                                      |
| `createAdminClient`/service role           | Not used anywhere in this feature; every read/write goes through the caller's own session via `createClient()` then an RPC, matching the spec's "not needed here" statement.                                                                                                                                                                                                       | passed | `src/features/admin/courses/server.ts` (no `createAdminClient` import)                                                               |
| `search_path` / security-definer hardening | Every function is `security definer`, `set search_path = ''`, with `lock_timeout`/`statement_timeout` set.                                                                                                                                                                                                                                                                         | passed | `20261020140000_admin_courses.sql:27-31,85-89,...`                                                                                   |
| Grants                                     | `execute` revoked from `public`/`anon`/`authenticated`, then granted to `authenticated` only, for all six functions; `courses`/`course_lecturers` already revoke all table privileges from `anon`/`authenticated` (no new direct-write grant added).                                                                                                                               | passed | `20261020140000_admin_courses.sql:378-390`; `20261018000000_student_browse_available_slots.sql:120-121`                              |
| RLS coverage                               | `rls_enabled.test.sql` asserts every `public` table has RLS enabled; `courses`/`course_lecturers` already had RLS enabled with no change needed by this feature.                                                                                                                                                                                                                   | passed | pgTAP run, `rls_enabled.test.sql`                                                                                                    |
| Input validation (server)                  | Code normalized to `upper(trim())`, regex-bounded `^[A-Z0-9/_-]{2,20}$`; name trimmed, 1-200 chars; all four reject-null-first, matching the spec's bounds exactly.                                                                                                                                                                                                                | passed | `20261020140000_admin_courses.sql:42-56,98-116`                                                                                      |
| Input validation (app)                     | Zod `.strict()` schemas duplicate the same bounds client-side (`codeSchema`, `nameSchema`, `safeText` rejecting NUL and unpaired UTF-16 surrogates); `boundedInput` rejects unknown/duplicate form fields and caps total payload at 16 KiB.                                                                                                                                        | passed | `src/features/admin/courses/validation.ts:12-32,37-56`                                                                               |
| Concurrency (assignment uniqueness)        | The pre-existing partial unique index `course_lecturers_current_pair_idx (course_id, lecturer_id) where is_active` is the true concurrency authority; `admin_assign_lecturer` pre-checks then maps a `unique_violation` exception to the same `conflict_duplicate_assignment`, so a race cannot create two active rows for one pair.                                               | passed | `20261020140000_admin_courses.sql:314-333`; index at `20261018000000_student_browse_available_slots.sql:36-38`                       |
| Re-assignment insert-path safety           | `enforce_current_course_lecturer_endpoints` (pre-existing `before insert or update` trigger) re-checks the course is active and the lecturer is active+role=lecturer on every insert, including ADM-02-R6's new-row re-assignment path.                                                                                                                                            | passed | `20261018000000_student_browse_available_slots.sql:43-78`                                                                            |
| Code uniqueness                            | New non-partial unique index on `upper(trim(code))` spans active and inactive courses, matching R1's "duplicate against an inactive course is refused too" rule; `unique_violation` is also caught as a defense-in-depth fallback.                                                                                                                                                 | passed | `20261020140000_admin_courses.sql:14-19,69-74`                                                                                       |
| No raw error leakage                       | Every RPC path returns a typed `jsonb` `kind` on both success and handled exception (`lock_not_available`, `deadlock_detected`, `serialization_failure`, `query_canceled` -> `temporarily_unavailable` with a `correlationId`, never the underlying SQLSTATE/message); the app layer treats any Supabase `error` or schema-mismatch as the same generic `temporarily_unavailable`. | passed | `20261020140000_admin_courses.sql:69-74` (repeated per function); `src/features/admin/courses/server.ts:54-59` (repeated per action) |
| Non-admin/signed-out direct calls          | `admin_courses.test.sql` exercises this at the pgTAP level (function existence + grant matrix); `requireRole` redirects a non-admin/signed-out caller before any Server Action body runs.                                                                                                                                                                                          | passed | pgTAP run; `src/lib/auth/session.ts:37-42`                                                                                           |
| No-AI boundary (R9)                        | No import of `@/lib/ai/*`, no prompt construction, no `ai_usage` write anywhere in `src/features/admin/courses/**` or `src/app/admin/courses/**`.                                                                                                                                                                                                                                  | passed | grep for `ai/client`, `generateText`, `ai_usage` under both directories: no matches                                                  |
| Deactivation read-side effect (R3)         | `browse_available_slots` already joins `courses c ... and c.is_active`; `admin_set_course_active` only flips the column, adds no new read path, so a Student immediately stops/starts seeing that course's slots without any new code.                                                                                                                                             | passed | `20261018000000_student_browse_available_slots.sql:296,387,407` (unmodified by this feature)                                         |
| Static analysis                            | `npm run lint`, `npm run typecheck`                                                                                                                                                                                                                                                                                                                                                | passed | see JSON block                                                                                                                       |
| Database rules                             | `npx supabase test db` (full suite, rolled back)                                                                                                                                                                                                                                                                                                                                   | passed | Files=13 Tests=226, PASS                                                                                                             |
| Unit tests                                 | `npx vitest run --exclude 'workflow/**'`                                                                                                                                                                                                                                                                                                                                           | passed | Test Files 36 passed; Tests 268 passed                                                                                               |
| Spec traceability                          | `npm run check:spec`                                                                                                                                                                                                                                                                                                                                                               | passed | no ADM-02 warnings/errors in output                                                                                                  |

## Findings

1. **Info** — `supabase/migrations/20261020140000_admin_courses.sql:218,254-256` (`admin_list_courses`):
   the search term (`v_query`) is interpolated into an `ILIKE '%' || v_query || '%'` pattern
   without escaping `%`/`_` wildcard metacharacters. This is not a SQL-injection risk (the value is
   a bound plpgsql variable, never concatenated into dynamic SQL/`EXECUTE`), and it discloses
   nothing beyond what the caller — always an authenticated admin — can already see via
   `admin_list_courses(null, null)`, so there is no privilege or privacy impact. Recommended fix
   (low priority, cosmetic): escape `%`, `_`, and `\` in `v_query` before building the pattern, so
   an admin's literal search for e.g. `CS32_7` matches only that string.
2. **Info** — the app-layer `optionalText(200)` bound on the free-text search query
   (`src/features/admin/courses/validation.ts:23-24,90`) is defense-in-depth only; the RPC itself
   already re-bounds it to 200 chars (`20261020140000_admin_courses.sql:218`), so a direct RPC call
   with a longer string is still safely truncated server-side. No action needed; noted for
   completeness since the spec calls this out as deliberate defense-in-depth.

No Critical, High, or Medium findings. `ADM-02-R1`–`R9` are each independently enforced at the
database layer (RPC first-statement role check, grants, unique indexes, triggers) as well as the
application layer (`requireRole`, zod schemas), so a defect in one layer alone would not create an
authorization or integrity gap.

## Approval-gate assessment

Enforced outside model/agent output: Postgres grants (`execute` to `authenticated` only, table
writes revoked from `anon`/`authenticated`), the partial unique index
`course_lecturers_current_pair_idx` and the non-partial `courses_code_normalized_idx` (true
concurrency/uniqueness authorities, not just app-level pre-checks), `security definer` with
`set search_path = ''` on every new function, and `requireRole("admin")` at both the shared
`/admin` layout and every Server Action. This spec's own Security requirements section explicitly
calls for independent human review before merge (new RPCs, new unique index); that human review
has not yet happened and this report does not substitute for it. The `.codex`/`.claude` hook
deny-list and GitHub branch-protection/CODEOWNERS gates described in
`workflow/policies/approval-gates.md` are unchanged by this feature and were not re-verified here
(out of this task's bounded scope; already covered by the ADM-01/SH-06 review).

## Limitations and unresolved questions

- This review is static plus read-only automated checks (lint, typecheck, pgTAP, unit tests,
  check:spec); it did not independently execute the live-DB integration suite
  (`test:admin-courses:integration`) or the e2e suite (`admin-courses.spec.ts`), per the
  assignment's instruction to avoid the shared integration/e2e suites that `tester_verifier` is
  running concurrently in this worktree. The developer's and coordinator's reported results for
  those suites (12/12 integration, e2e passing in a real install) were read but not re-executed.
- True two-connection concurrency for `ADM-02-AC11` was not independently exercised (pgTAP runs on
  a single backend); the unique index is the correctness guarantee by inspection, consistent with
  how `ADM-01`'s advisory-lock pattern was reviewed.
- I cannot grant human/PR approval. This finding set is evidence for the coordinator and an
  independent human reviewer, not a substitute for the sensitive-change and merge approval gates
  in `workflow/policies/approval-gates.md`.

## Next action

Coordinator: route this feature (new migration, new RPCs — flagged security-sensitive by the spec
itself) to an independent human reviewer before merge, alongside the tester-verifier's own
findings. No code changes are required from this review; both Info notes above are optional
polish, not blockers.

Handoff evidence: workflow/handoffs/adm-02/2026-10-21-adm-02-security-reviewer.md
