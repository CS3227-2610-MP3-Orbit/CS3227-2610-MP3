# Handoff: TASK-ADM-01B / ADM-01-R1,R2,R3,R4,R5,R6,R9 (app layer); UI for R8 — developer (application layer) → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-01B",
"requirementIds": ["ADM-01-R1", "ADM-01-R2", "ADM-01-R3", "ADM-01-R4", "ADM-01-R5", "ADM-01-R6", "ADM-01-R9", "ADM-01-R8-UI"],
"status": "passed",
"changedFiles": [
"supabase/migrations/20261020010000_admin_list_accounts.sql",
"supabase/tests/admin_list_accounts.test.sql",
"src/features/admin/accounts/validation.ts",
"src/features/admin/accounts/validation.test.ts",
"src/features/admin/accounts/server.ts",
"src/features/admin/accounts/server.test.ts",
"src/features/admin/accounts/presentation.ts",
"src/features/admin/accounts/presentation.test.ts",
"src/app/admin/accounts/page.tsx",
"src/app/admin/accounts/actions.ts",
"src/app/admin/accounts/create-account-form.tsx",
"src/app/admin/accounts/account-row.tsx",
"src/app/admin/accounts/one-time-password-panel.tsx",
"src/app/admin/page.tsx",
"tests/integration/admin-accounts.test.ts",
"tests/integration/admin-accounts.vitest.config.mts",
"tests/e2e/admin-accounts.spec.ts",
"tests/e2e/admin.playwright.config.ts",
"package.json",
"workflow/handoffs/adm-01/2026-10-20-adm-01-developer-app.md"
],
"verification": [
{"check": "npm run lint", "result": "passed", "evidence": "no output, exit 0"},
{"check": "npm run typecheck", "result": "passed", "evidence": "'Types generated successfully', tsc --noEmit clean"},
{"check": "npm test", "result": "passed", "evidence": "14 files passed, 1 pre-existing skipped (unrelated), 103 tests passed, 4 pre-existing todo (unrelated); includes 35 new ADM-01 unit tests across validation.test.ts/presentation.test.ts/server.test.ts"},
{"check": "npm run check:spec", "result": "passed", "evidence": "0 errors (previously 3: ADM-01-AC1/AC2/AC18 had no test); Covered 125 (was 122); remaining warnings are pre-existing unrelated draft specs"},
{"check": "npx supabase test db", "result": "passed", "evidence": "Files=7, Tests=98, 0 failed (52 pre-existing STU/SH + 36 other-agent ADM-01 DB-layer + 10 new admin_list_accounts.test.sql), including the other developer's admin_account_management.test.sql unaffected"},
{"check": "npm run test:admin:integration (new script, real local Supabase + real Auth)", "result": "passed", "evidence": "10/10 tests passed covering AC1,AC2,AC3,AC4,AC13,AC18,AC19,AC20,AC21(x2),AC22; verified zero leftover adm01- fixture rows in auth.users after the run"},
{"check": "npx playwright test --config tests/e2e/admin.playwright.config.ts (own config, port 3104, non-default)", "result": "passed", "evidence": "1/1 test passed (AC17); confirmed port 3104 was free before and after the run, no lingering dev server process"},
{"check": "npx prettier --write <own files only>", "result": "passed", "evidence": "all new/edited files formatted; .sql files not-applicable (no SQL parser installed, consistent with the other developer's own finding)"},
{"check": "scope check: git diff/status limited to allowed paths", "result": "passed-with-finding", "evidence": "see Findings #1: src/lib/auth/session.ts and src/components/role-shell.tsx show as modified in git status, but the diff is not mine (I never Edit/Write'd either file, only Read them) -- this is the concurrent SH-06 agent's own in-progress work in the shared tree"}
],
"unresolvedIssues": [
"Finding #1 (process, not code): src/lib/auth/session.ts (+12 lines) and src/components/role-shell.tsx (+4 lines) are modified in the shared working tree by the concurrent SH-06 agent, not by me. I did not read their diff content (out of my scope) and made no changes to either file.",
"ADM-01-R2's prose lists 'created date' among listAccounts' allowlisted fields, but the spec's own binding API contract section lists {id,email,fullName,role,isActive,isProtected} with no createdAt and with isProtected instead -- I followed the API contract (needed for AC17's protected-badge/disabled-controls UI) and did not add createdAt; flagging the prose/contract mismatch for the architect, not resolving it myself.",
"ADM-01-AC9 (R6, session deactivation takes effect immediately) is not mine (owned by the DB-layer agent's pgTAP + likely SH-06/tester e2e); I did not add coverage for it.",
"AC14 (true two-admin concurrent race) and AC15/AC16 (R8 mechanism) are the DB-layer agent's pgTAP responsibility, already handled in their handoff; not re-verified here beyond confirming their test file still passes."
]
}
<!-- HANDOFF:END -->

- Date: 2026-10-20
- Task ID: TASK-ADM-01B (application layer of ADM-01, GitHub issue #18)
- Requirement IDs: ADM-01-R1, R2, R3, R4, R5, R6, R9 (application layer); UI only for R8
- AC IDs covered: AC1, AC2, AC3, AC4, AC11, AC12, AC13, AC17, AC18, AC19, AC20, AC21, AC22 (the
  assigned set), plus incidental pass-through coverage of AC6/AC8/AC10's app-layer boundary and
  the RPC error-kind mapping (server.test.ts), on top of the DB-layer agent's own AC5–AC10/AC14–16
  pgTAP coverage.
- Specification: `workflow/specs/admin/ADM-01-manage-accounts.md`, `status: approved`
- Specification version used: owner re-approved 2026-10-20 at commit `9627610`; repository HEAD at
  the start of this round was `fdc059d` (one commit ahead: "Seed two local administrators and
  isolate the admin database tests", unrelated to this spec). Spec digest as read:
  `e4aa8cb60358a19b41ab9faa3cd3589af42e0bcc` (`git hash-object`).
- Latest handoffs read: `workflow/handoffs/adm-01/2026-10-19-adm-01-requirements-architect.md`,
  `workflow/handoffs/adm-01/2026-10-19-adm-01-developer-db.md` (DB layer: `admin_set_role`/
  `admin_set_active` RPCs, `is_protected` column/index, migration
  `20261020000000_admin_account_management.sql`, already applied locally).
- Allowed edit paths used: `src/app/admin/**`, `src/features/admin/accounts/**` (not
  `password.ts`, read/used only), one new migration + its pgTAP test, new test files under
  `tests/integration/` and `tests/e2e/`, `package.json` (one new script), this handoff. Did not
  touch `src/lib/auth/`, `src/components/role-shell.tsx`, `src/app/account/`, `src/features/account/`.

## Decisions and assumptions

- **New migration `20261020010000_admin_list_accounts.sql`** adds `admin_list_accounts(p_query,
p_role, p_active)`, a `security definer` RPC joining `profiles` and `auth.users` (for email) and
  returning `{kind:"success", accounts:[{id,email,fullName,role,isActive,isProtected}]}` or
  `forbidden_or_not_found`. Chose this over `createAdminClient().auth.admin.listUsers()` because
  (a) `listUsers()` has no email/name/role filter (only page/perPage pagination — see
  `@supabase/auth-js` `GoTrueAdminApi.listUsers`), so "search" would mean pulling every user into
  the Next.js process and filtering in JS; (b) every other multi-row read in this codebase
  (`list_my_bookings`, `browse_available_slots`) is already a security-definer RPC returning the
  exact allowlisted shape, so this keeps R2 consistent with that convention instead of introducing
  a second one; (c) it is independently pgTAP-testable like `admin_set_role`/`admin_set_active`.
  Full reasoning is in the migration file's own header comment.
- **Create-account flow (R1)**: `createAdminClient().auth.admin.createUser(...)` then, for a
  non-student role, `admin_set_role` via the caller's own cookie-scoped client (so every role
  change, including from account creation, goes through the same RPC and the same R5/R7/R8
  checks). If that step does not confirm success, the auth user is deleted (best-effort
  compensation) and the result is `{kind:"incomplete", correlationId}` — never `success`, and
  never the requested role — matching the spec's edge case "auth.users insert succeeds but
  role-set step fails → reported as incomplete, not as the requested role." This `incomplete` kind
  is my own addition (the spec's API contract only names `validation_error`/
  `conflict:duplicate_email` for `createAccount`); reported here as a deviation, not a spec
  violation, since the spec's own edge-case table requires this outcome to exist in some form.
- **Reset password (R9)**: refuses the caller's own id before any lookup (same ordering as
  `admin_set_role`/`admin_set_active`'s self-check), then reads the target's `profiles.is_protected`
  via the admin's own session (RLS already allows "admin reads all"), then
  `createAdminClient().auth.admin.updateUserById`. Never touches a `profiles` row directly.
- **Error-kind conventions**: followed the existing `request-server.ts`/`manage-server.ts`
  pattern exactly — reads use `temporarily_unavailable` on any failure (nothing written), writes
  use `outcome_unknown` on any failure including a _returned_ (not just thrown) error, since a
  write RPC's own uncaught exception rolls back inside Postgres but the client-side failure mode
  is still "did I see confirmation or not." Implemented as two narrowly-typed helpers
  (`temporarilyUnavailable()`/`outcomeUnknown()`) rather than one boolean-flag function, because
  each result schema only declares whichever one or two of these kinds it actually needs, and a
  shared union return type did not narrow correctly at each call site (first typecheck attempt
  failed on exactly this; fixed before proceeding).
- **AC17 unit coverage**: extracted the row-locking decision (self or protected ⇒ hide controls)
  into a pure function `isAccountLocked()` in a new `presentation.ts`, used by `account-row.tsx`,
  specifically so AC17's "unit" verification type has a real, independently-testable target rather
  than only being checked via the e2e spec.
- **Integration-test architecture** (`tests/integration/admin-accounts.test.ts`): unlike the
  existing STU-02 integration tests, which exercise raw SQL/REST only, this suite imports
  `src/features/admin/accounts/server.ts` directly and runs its _real_ `requireRole`/
  `getCurrentUser` and _real_ `createAdminClient()` against the already-running local Supabase
  instance; only `@/lib/supabase/server`'s `createClient()` is mocked, substituted with a real,
  already-signed-in `supabase-js` client per fixture actor (admin/non-admin/signed-out), since that
  function's only job normally is reading Next's request cookies. I verified empirically (see
  Evidence) that Next's `redirect()` from `next/navigation`, called by the real `requireRole`
  outside any Next.js render/request context, throws a clean `Error("NEXT_REDIRECT")` with a
  `.digest` string rather than crashing or behaving unexpectedly — this is what makes the
  architecture viable; it is not something I assumed. Local Supabase URL/keys come from
  `npx supabase status -o json` at test run time, never from a `.env` file, and the secret key is
  never printed or asserted against in any test output.
- **E2E config** (`tests/e2e/admin.playwright.config.ts`): a dedicated config rather than the root
  `playwright.config.ts`, because the root config was repurposed by the STU-02 round to _require_
  four `STU02_TEST_*` disposable-stack env vars for every run, unconditionally (including for
  unrelated specs like `auth.spec.ts`). My config runs on port 3104 (non-default, distinct from
  STU-02's 3102) against the already-running local Supabase (no disposable stack needed, since the
  fixtures here are additive/cleaned-up, not racing). `testDir: "."` rather than `"tests/e2e"` —
  Playwright resolves `testDir` relative to the _config file's own directory_, and this config
  lives inside `tests/e2e/` itself (first run failed with "No tests found" until this was fixed).

## Changes

- `supabase/migrations/20261020010000_admin_list_accounts.sql` (new): `admin_list_accounts` RPC —
  see Decisions. Applied locally with `npx supabase migration up --local` (non-destructive;
  confirmed via `supabase migration list --local` that only this new file was pending — did not
  run `db reset --local`, to avoid disrupting the concurrent SH-06 agent's session state).
- `supabase/tests/admin_list_accounts.test.sql` (new): pgTAP, `[ADM-01-AC4]`/`[ADM-01-AC10]`/
  `[ADM-01-AC12]`-tagged — unfiltered list shape, search by email substring, search by full-name
  substring, role filter, active filter, non-admin/anon direct-call refusal.
- `src/features/admin/accounts/validation.ts` (new): zod `.strict()` schemas for all five actions'
  inputs/outputs; `boundedInput()`/`uuid`/`safeText` duplicated from the Student feature's own
  `request-validation.ts` rather than cross-imported (different CODEOWNERS owner).
- `src/features/admin/accounts/server.ts` (new): `createAccount`, `listAccounts`, `setRole`,
  `setActive`, `resetPassword` — each calls `requireRole("admin")` first; see Decisions.
- `src/features/admin/accounts/presentation.ts` (new): `isAccountLocked()`.
- `src/app/admin/accounts/page.tsx` (new): server component, GET search form on `searchParams`
  (query/role/active), renders `CreateAccountForm` + the account list.
- `src/app/admin/accounts/actions.ts` (new): `"use server"` — `createAccountAction`,
  `setRoleAction`, `setActiveAction`, `resetPasswordAction`, each calling `requireRole("admin")`
  before delegating (same defense-in-depth pattern as `src/app/student/bookings/actions.ts`).
- `src/app/admin/accounts/create-account-form.tsx`, `account-row.tsx`,
  `one-time-password-panel.tsx` (new, all `"use client"`): `useActionState`-based create form;
  per-row role/active/reset controls via `useTransition`; shared one-time credential panel
  (Copy + Done, never in a URL/localStorage/server-rendered HTML — see inline comments).
- `src/app/admin/page.tsx`: added a "Manage accounts" link to `/admin/accounts`.
- `package.json`: added `test:admin:integration` script.
- Test files: `validation.test.ts`, `presentation.test.ts`, `server.test.ts` (mocked unit, 35
  tests), `tests/integration/admin-accounts.test.ts` (10 tests, real DB/Auth),
  `tests/e2e/admin-accounts.spec.ts` + its dedicated config (1 test, real browser).

## Evidence

| Command                                                             | Result | Evidence                                                                                                 |
| ------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `npx supabase migration up --local`                                 | passed | `{"applied":[".../20261020010000_admin_list_accounts.sql"],"message":"Migrations applied"}`              |
| `npx supabase test db`                                              | passed | `Files=7, Tests=98, ... Result: PASS`                                                                    |
| `npm run lint`                                                      | passed | no output                                                                                                |
| `npm run typecheck`                                                 | passed | `Types generated successfully`, clean `tsc`                                                              |
| `npm test`                                                          | passed | `14 passed \| 1 skipped (15)`, `103 passed \| 4 todo (107)`                                              |
| `npm run check:spec`                                                | passed | `Covered: 125` (was 122); 0 `error:` lines (was 3: AC1/AC2/AC18)                                         |
| `npm run test:admin:integration`                                    | passed | `10 passed (10)`; post-run DB check (`select count(*) from auth.users where email like 'adm01-%'`) = `0` |
| `npx playwright test --config tests/e2e/admin.playwright.config.ts` | passed | `1 passed`; port 3104 confirmed free before and after                                                    |
| `npx prettier --write` (own files)                                  | passed | all formatted; `.sql` not-applicable (no parser, pre-existing repo-wide limitation)                      |

## Changes outside the owner's area

None by me. `supabase/migrations/` is shared per CODEOWNERS (needs teammate review per policy —
flagged here as security-sensitive, touches RLS-adjacent read access to `auth.users`).
`src/lib/auth/session.ts` and `src/components/role-shell.tsx` show modified in `git status` but
are the concurrent SH-06 agent's own changes, not mine (see Findings #1).

## Findings and open questions

| #   | Severity       | Finding                                                                                                                                                                                                                                                                                                                                  | Status                                                                 |
| --- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Info (process) | `src/lib/auth/session.ts` (+12) and `src/components/role-shell.tsx` (+4) are modified in the shared working tree. I never opened either file with Edit/Write, only Read. This is the concurrent SH-06 agent's in-progress work; flagging so the coordinator does not attribute it to this task.                                          | Coordinator to reconcile                                               |
| 2   | Low            | ADM-01-R2's prose ("created date") and its own API-contract section (`isProtected`, no `createdAt`) list slightly different allowlisted fields for `listAccounts`. I implemented the API contract's exact shape (needed for AC17's UI).                                                                                                  | Architect to reconcile the spec's internal inconsistency, non-blocking |
| 3   | Info           | `admin_list_accounts`'s `ilike '%'                                                                                                                                                                                                                                                                                                       |                                                                        | query |     | '%'`does not escape`%`/`_`wildcards in the caller's search text; worst case is an over-broad match within data the calling admin can already read in full via`listAccounts()` itself, not a disclosure beyond that. Not fixed, since it is not a security boundary and escaping would be a behavior change outside my envelope's instructions. | Non-blocking, reported for awareness |
| 4   | Info           | R9's AC18 (sign in with the new password) necessarily exercises real GoTrue sign-in in the integration suite; this creates and later deletes fixture users via the Admin API (not through the app's own create/list UI) — consistent with "non-goals: deleting accounts" being an app-layer restriction, not a test-fixture restriction. | Informational                                                          |

## Next action

Independent verification (tester_verifier/security_reviewer): re-run
`npx supabase migration up --local`, `npx supabase test db`,
`npm run test:admin:integration`, and the e2e spec; review `admin_list_accounts`'s
`security definer`/`auth.users` read for the same security-sensitivity as the DB-layer migration;
confirm Finding #2 (R2 prose vs. API contract) with the architect/owner; reconcile Finding #1 with
whatever TASK-SH-06 state exists once that agent's own round completes.

Handoff evidence: workflow/handoffs/adm-01/2026-10-20-adm-01-developer-app.md
