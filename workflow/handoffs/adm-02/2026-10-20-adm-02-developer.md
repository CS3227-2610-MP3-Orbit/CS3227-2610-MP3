# Handoff: TASK-ADM-02 / ADM-02-R1..R9, AC1..AC16 — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-02",
"requirementIds": ["ADM-02-R1", "ADM-02-R2", "ADM-02-R3", "ADM-02-R4", "ADM-02-R5", "ADM-02-R6", "ADM-02-R7", "ADM-02-R8", "ADM-02-R9"],
"status": "incomplete",
"changedFiles": [
"supabase/migrations/20261020140000_admin_courses.sql",
"supabase/tests/admin_courses.test.sql",
"src/features/admin/courses/validation.ts",
"src/features/admin/courses/server.ts",
"src/features/admin/courses/presentation.ts",
"src/features/admin/courses/validation.test.ts",
"src/features/admin/courses/server.test.ts",
"src/features/admin/courses/presentation.test.ts",
"src/app/admin/courses/actions.ts",
"src/app/admin/courses/page.tsx",
"src/app/admin/courses/course-row.tsx",
"src/app/admin/courses/create-course-form.tsx",
"src/app/admin/page.tsx",
"tests/integration/admin-courses.test.ts",
"tests/integration/admin-courses.vitest.config.mts",
"tests/e2e/admin-courses.spec.ts",
"package.json",
".github/workflows/ci.yml",
"playwright.config.ts",
"workflow/handoffs/adm-02/2026-10-20-adm-02-developer.md"
],
"verification": [
{"check": "npx supabase migration up --local", "result": "passed", "evidence": "20261020140000_admin_courses.sql applied cleanly"},
{"check": "npx supabase test db --local (full suite)", "result": "passed", "evidence": "Files=10 Tests=168 Result: PASS, including supabase/tests/admin_courses.test.sql (43 assertions)"},
{"check": "npx supabase db lint --local --level error", "result": "passed", "evidence": "{\"results\":[],\"message\":\"db lint\"}"},
{"check": "npm run lint", "result": "passed", "evidence": "no eslint errors/warnings"},
{"check": "npm run typecheck", "result": "passed", "evidence": "next typegen + tsc --noEmit clean"},
{"check": "npm test", "result": "passed", "evidence": "Test Files 20 passed | 1 skipped; Tests 141 passed | 4 todo (includes 15 new admin/courses unit tests)"},
{"check": "npm run test:admin-courses:integration (live local Supabase)", "result": "passed", "evidence": "Test Files 1 passed; Tests 12 passed"},
{"check": "npm run test:admin:integration (ADM-01 regression)", "result": "passed", "evidence": "Test Files 2 passed; Tests 26 passed -- no regression from the new migration/index"},
{"check": "npm run check:spec", "result": "passed", "evidence": "all ADM-02-AC1..AC16 covered, zero ADM-02 warnings/errors; remaining errors are pre-existing SH-07 (UI agent's scope, expected per assignment)"},
{"check": "npm run format:check (after npx prettier --write on changed files)", "result": "passed", "evidence": "All matched files use Prettier code style!"},
{"check": "npx playwright test --config tests/e2e/admin.playwright.config.ts (port 3104)", "result": "blocked", "evidence": "1 passed (pre-existing ADM-01-AC17), 2 failed (both new admin-courses.spec.ts tests). Root cause isolated below: a pre-existing environment issue, not an ADM-02 regression."}
],
"unresolvedIssues": ["e2e: clicking any plain onClick Server-Action-backed button (e.g. the pre-existing, untouched AccountRow 'Deactivate' button on /admin/accounts) produces zero network activity in this sandbox's headless Chromium against the Next 16/Turbopack dev server -- reproduced identically on ADM-02's own new buttons and on ADM-01's unmodified code, so it is not caused by this change; likely the dev server's HMR/WebSocket channel failing in this sandbox (observed 'WebSocket connection to ws://.../_next/hmr failed' throughout every run) breaks Turbopack's dev-mode Server Action reference resolution client-side, with no console error and no network attempt. Needs a human/coordinator check of whether the real CI runner (GitHub Actions) exhibits the same symptom; this spec is otherwise structurally complete and should pass once that is resolved."]
}
<!-- HANDOFF:END -->

## Status

incomplete

## Scope and gate

- Task/requirement IDs: TASK-ADM-02 (issue #19), ADM-02-R1..R9, ADM-02-AC1..AC16.
- Spec: `workflow/specs/admin/ADM-02-manage-courses-and-assignments.md`, status `approved` (owner
  Johannsen, 2026-10-20). Read in full before any code; handoff
  `workflow/handoffs/adm-02/2026-10-20-adm-02-requirements-architect.md` read for context.
- Allowed edit paths: all touched; no files outside the assignment's allowed list were edited.
- Deviation (recorded decision, not a gap): every new RPC parameter is prefixed `p_` (e.g.
  `admin_set_course_active(p_course_id, p_active)` rather than the spec prose's unprefixed
  `is_active`), to avoid the same plpgsql column/parameter-shadowing hazard `admin_set_active`
  already avoids by naming its parameter `active` instead of `is_active`. Behavior is unaffected;
  only the internal RPC parameter names differ from the spec's descriptive prose.

## Changes

- `supabase/migrations/20261020140000_admin_courses.sql`: new append-only migration. Unique
  index `courses_code_normalized_idx` on `upper(trim(code))` (ADM-02-R1), and six
  `security definer`/`set search_path = ''` RPCs (`admin_create_course`, `admin_update_course`,
  `admin_set_course_active`, `admin_list_courses`, `admin_assign_lecturer`,
  `admin_remove_assignment`), each checking `current_app_role() = 'admin'` first, each with
  `execute` revoked from `public`/`anon`/`authenticated` then granted to `authenticated` only.
  `admin_remove_assignment` sets `is_active = false, ended_at = now()` in one update (never a
  delete) so Jordan's existing `course_assignment_deactivation_notice` trigger fires unchanged.
  No existing migration, table, or RLS policy touched; `browse_available_slots` untouched and
  verified still correct (its `courses.is_active` join is the only read-side effect of R3).
- `supabase/tests/admin_courses.test.sql`: new pgTAP suite (43 assertions) covering function/
  index existence, ADM-02-AC9/AC10/AC11/AC6/AC7/AC12/AC13/AC15.
- `src/features/admin/courses/{validation,server,presentation}.ts` (+ matching `.test.ts`):
  mirror `src/features/admin/accounts`'s exact shape -- zod `.strict()` schemas, `requireRole`
  first in every exported function, typed `kind` results, no raw DB errors surfaced.
- `src/app/admin/courses/{actions,page,course-row,create-course-form}.tsx`: `/admin/courses`
  workspace mirroring `/admin/accounts`'s plain-Tailwind style; search/active-filter GET form,
  create form, per-row edit/deactivate/reactivate/assign/remove controls. Lecturer picker reuses
  `admin_list_accounts(p_role:'lecturer', p_active:true)` per the spec -- no new read RPC added
  for it.
- `src/app/admin/page.tsx`: added a "Manage courses" link next to "Manage accounts" only.
- `tests/integration/admin-courses.test.ts` + `tests/integration/admin-courses.vitest.config.mts`
  - `package.json` script `test:admin-courses:integration` + `.github/workflows/ci.yml`'s
    "Accounts and passwords" job: 12 live-DB integration tests covering AC1/AC2/AC4/AC5/AC6/AC7/
    AC8/AC9/AC10/AC12/AC14/AC15/AC16.
- `tests/e2e/admin-courses.spec.ts` + `playwright.config.ts`'s `testIgnore`: two Playwright specs
  against the seeded local stack (port 3104), picked up by `admin.playwright.config.ts`'s
  existing `admin-*.spec.ts` testMatch.

## Decisions and assumptions

- All decisions already authorized by the spec (code bounds/normalization, insert-new-row
  re-assignment, `admin_list_courses` shape, specific `assignLecturer` refusal kinds). No new
  gaps introduced.
- New gap (not in the spec, found during verification): see "Findings" below -- the e2e
  environment issue.

## Evidence

See the `verification` array in the HANDOFF JSON block above for every command and its actual
result. Highlights: migration applies cleanly; full pgTAP suite 168/168 passing (43 new); lint,
typecheck, unit tests (141 passing, 15 new), and both live-DB integration suites (ADM-02's 12 new

- ADM-01's 26 regression-checked) all pass; `check:spec` shows zero ADM-02 warnings/errors across
  AC1-AC16 (only pre-existing SH-07 errors remain, which are the UI agent's scope per the
  assignment). `db lint --level error` clean. `format:check` clean after `prettier --write`.

## Findings and unresolved questions

1. **(Medium severity, likely environment/tooling, not an ADM-02 regression)** Running
   `npx playwright test --config tests/e2e/admin.playwright.config.ts` on port 3104: the
   pre-existing `admin-accounts.spec.ts` AC17 test (read-only, no clicks on any mutating control)
   passes. Both new `admin-courses.spec.ts` tests fail: clicking "Create course" (a
   `useActionState`/`<form action>` submission, the same pattern as the pre-existing, untouched
   `CreateAccountForm`) produces zero network activity and no visible state change. I isolated
   this with a standalone Playwright script (not committed) against a freshly started dev server:
   the _exact same_ zero-network-activity symptom reproduces on the pre-existing, completely
   unmodified `AccountRow`'s plain `onClick`/`startTransition` "Deactivate" button on
   `/admin/accounts` -- a button I never touched. Every run in this sandbox also logs repeated
   `WebSocket connection to ws://127.0.0.1:3104/_next/hmr failed` errors. This strongly suggests
   the sandbox blocks the WebSocket upgrade Turbopack's dev server needs for HMR, and that in turn
   silently breaks client-side Server Action dispatch for already-hydrated interactive elements
   (no console error, no fetch attempt -- the click is simply swallowed). I did not change
   `next.config.ts` or any shared/ADM-01-owned file to chase this, since it reproduces on code
   outside this task's scope and a config change would need its own review. Owner: coordinator/
   human -- please confirm whether the same symptom appears when the "Accounts and passwords" CI
   job (a real GitHub Actions runner, not this sandbox) runs `admin.playwright.config.ts`; if CI
   is unaffected, this is sandbox-only and `admin-courses.spec.ts` should be re-run there as the
   real verification. No app code was changed to work around this.
2. **(Info)** `supabase/seed.sql` was not extended: the e2e spec reuses the existing seeded
   `CS3227`/`demo-lecturer` fixture per the assignment's "prefer creating fixtures in tests"
   guidance, creating its own course with a timestamp-suffixed code.

## Next action

Coordinator/tester_verifier: re-run `npx playwright test --config tests/e2e/admin.playwright.config.ts`
in the real CI runner (or any environment with working WebSockets) to get the real signal on
`admin-courses.spec.ts`; if it passes there, finding #1 is sandbox-only and this task's e2e check
can be marked passed. All other checks (migration, pgTAP, lint, typecheck, unit, both live-DB
integration suites, check:spec, format) already passed and are independent of that environment
issue.

Handoff evidence: workflow/handoffs/adm-02/2026-10-20-adm-02-developer.md
