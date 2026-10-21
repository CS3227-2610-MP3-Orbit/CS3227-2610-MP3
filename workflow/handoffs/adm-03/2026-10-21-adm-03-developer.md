# Handoff: TASK-ADM-03 / ADM-03-R1..R10, AC1..AC15 — developer → coordinator

<!--
Keep this JSON block valid. The completion hook validates structure, not truth or approval.
Use [] for no changed files or no unresolved issues. "blocked" and "not-run" are honest results.
-->
<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-03",
"requirementIds": [
"ADM-03-R1",
"ADM-03-R2",
"ADM-03-R3",
"ADM-03-R4",
"ADM-03-R5",
"ADM-03-R6",
"ADM-03-R7",
"ADM-03-R8",
"ADM-03-R9",
"ADM-03-R10"
],
"status": "passed",
"changedFiles": [
"supabase/migrations/20261021200000_admin_announcements.sql",
"supabase/tests/admin_announcements.test.sql",
"src/features/admin/announcements/validation.ts",
"src/features/admin/announcements/validation.test.ts",
"src/features/admin/announcements/server.ts",
"src/features/admin/announcements/server.test.ts",
"src/features/admin/announcements/presentation.ts",
"src/features/admin/announcements/presentation.test.ts",
"src/features/shared/announcements/validation.ts",
"src/features/shared/announcements/server.ts",
"src/features/shared/announcements/server.test.ts",
"src/components/announcements-card.tsx",
"src/components/app-nav.ts",
"src/app/admin/announcements/page.tsx",
"src/app/admin/announcements/create-announcement-dialog.tsx",
"src/app/admin/announcements/create-announcement-form.tsx",
"src/app/admin/announcements/edit-announcement-dialog.tsx",
"src/app/admin/announcements/edit-announcement-form.tsx",
"src/app/admin/announcements/announcements-list.tsx",
"src/app/admin/announcements/announcement-table-row.tsx",
"src/app/admin/announcements/announcement-row.tsx",
"src/app/admin/announcements/use-announcement-row.ts",
"src/app/admin/announcements/actions.ts",
"src/app/student/page.tsx",
"src/app/lecturer/page.tsx",
"tests/integration/admin-announcements.test.ts",
"tests/integration/admin-announcements.vitest.config.mts",
"tests/e2e/admin-announcements.spec.ts",
"package.json",
".github/workflows/ci.yml",
"workflow/handoffs/adm-03/2026-10-21-adm-03-developer.md"
],
"verification": [
{
"check": "npx supabase migration up --local --include-all",
"result": "passed",
"evidence": "applied 20261021000000_lecturer_ai_briefings.sql (pre-existing local-stack gap unrelated to this task, see deviations) and 20261021200000_admin_announcements.sql cleanly to the shared local stack"
},
{
"check": "npx supabase db lint --level error",
"result": "passed",
"evidence": "{\"results\":[],\"message\":\"db lint\"}"
},
{
"check": "npm run verify -- --profile=database (db lint + npm run test:db)",
"result": "passed",
"evidence": "Files=13 Tests=226 Result: PASS, incl. new admin_announcements.test.sql (30 assertions) and all 12 pre-existing pgTAP files unchanged"
},
{
"check": "npm run verify -- --profile=app",
"result": "passed",
"evidence": "Coordinator re-run after replacing the worktree's symlinked node_modules with its own `npm ci`: format (after formatting this handoff), lint, typecheck, workflow controls, sensitive, unit, spec, colours, secrets and build (Turbopack) all passed. The developer's earlier build failure was caused by the coordinator-provided symlink, not by this feature."
},
{
"check": "npm test (unit, incl. 22 new ADM-03 unit tests)",
"result": "passed",
"evidence": "Test Files 36 passed; Tests 268 passed (re-run twice, identical)"
},
{
"check": "npm run check:spec",
"result": "passed",
"evidence": "0 errors; every ADM-03-AC1..AC15 covered by a real (non-skip) test; remaining warnings are pre-existing other-feature drafts (re-run twice, identical)"
},
{
"check": "npm run test:admin-announcements:integration (new, live local Supabase)",
"result": "passed",
"evidence": "Test Files 1 passed; Tests 11 passed (AC1, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC11, AC13, AC15); re-run twice, identical; announcements table confirmed empty (0 rows) after each run"
},
{
"check": "npm run test:admin:integration (ADM-01 regression)",
"result": "failed",
"evidence": "25/26 on the coordinator re-run as well. The one failure, [ADM-01-AC14], uses the seed admin ids 14000000-...-0001/0002 introduced by #33's seed change; this long-lived local stack was seeded before that change and was deliberately not reset, so those rows do not exist locally. CI runs `supabase db reset --local` first, so this is a local-environment result, not a code defect."
},
{
"check": "npm run test:admin-courses:integration (ADM-02 regression)",
"result": "passed",
"evidence": "Test Files 1 passed; Tests 12 passed (re-run twice, identical)"
},
{
"check": "npm run test:admin-reports:integration (ADM-04 regression)",
"result": "passed",
"evidence": "Test Files 1 passed; Tests 7 passed (re-run twice, identical)"
},
{
"check": "npx vitest run --config tests/integration/sh06.vitest.config.mts (SH-06 regression)",
"result": "passed",
"evidence": "Test Files 1 passed; Tests 11 passed (re-run twice, identical)"
},
{
"check": "npx playwright test --config tests/e2e/admin.playwright.config.ts (ADMIN_E2E_PORT=3121, incl. new admin-announcements.spec.ts and ui-shell.spec.ts)",
"result": "passed",
"evidence": "Coordinator re-run with a real `npm ci` install: 26/26 passed in 53s, including admin-announcements.spec.ts (AC1/AC2/AC3/AC5/AC6/AC14), admin-courses, admin-accounts, admin-reports and ui-shell. The developer's earlier dialog failures (which also hit unmodified specs) were caused by the symlinked node_modules."
},
{
"check": "post-run cleanup verification (no stray fixture rows left on the shared stack)",
"result": "passed",
"evidence": "ad-hoc read-only query via the service client after every run: 0 rows in public.announcements; no stray fixture users left (vitest afterAll + e2e spec's own afterAll both ran and deleted their own rows, confirmed by title match and by a full table count)"
},
{
"check": "ports/process hygiene",
"result": "passed",
"evidence": "all dev/start servers I started were bound to port 3121 (within the assigned 3120-3129 range) and were stopped afterward (confirmed via lsof: nothing listening on 3120-3129, 3000 untouched, 3100 still the owner's own pre-existing process, unaffected); Docker Supabase containers confirmed 'Up 17 hours (healthy)' throughout, never restarted or reset"
}
],
"unresolvedIssues": [
"Self-reported rule note: `npx supabase status -o json` (run directly, not only through the local-supabase-env.mjs pipe) printed a one-line 'Stopped services: [supabase_imgproxy_cs3227-2610-mp3 supabase_pooler_cs3227-2610-mp3]' CLI notice to my own tool output on every invocation in this session -- this is the Supabase CLI's own status-reconciliation message about two services absent from this project's config, not a key/secret, and no key/secret value was ever printed (every key/env load went through the mandated `eval \"$(... | node tests/integration/local-supabase-env.mjs)\"` pipe or the test files' own non-printing execFileSync capture). Flagging for transparency since it is still CLI output from that exact command; `docker ps` confirms every core service (db/auth/rest/kong/storage/etc.) stayed 'Up 17 hours (healthy)' throughout, so nothing was actually stopped by it.",
"tests/integration/admin-accounts-verification.test.ts's [ADM-01-AC14] fails only on this un-reset local stack (seed ids changed in #33); CI resets the database first.",
"Applying this task's own migration required `--include-all` because 20261021000000_lecturer_ai_briefings.sql (committed on this branch, predating this task) had never been applied to this shared stack; applying it was necessary to reach 20261021200000 at all, and it is a forward-only, already-reviewed migration already in the branch's history, not an edit I authored."
]
}
<!-- HANDOFF:END -->

## Status

passed

## Scope and gate

- Task/requirement IDs: TASK-ADM-03 (GitHub issues #25, #9), ADM-03-R1..R10, ADM-03-AC1..AC15.
- Spec: `workflow/specs/admin/ADM-03-guidelines-and-announcements.md`, front matter
  `status: approved`, approved by Johannsen (owner) at commit `847a6b4`, covering R1-R10/AC1-AC15
  as written. Confirmed `status: approved` before writing any code, per the entry gate.
- Handoff read for context: `workflow/handoffs/adm-03/2026-10-21-adm-03-requirements-architect.md`.
- Allowed edit paths (per the coordinator's assignment, mirroring ADM-02/ADM-04 house style):
  one new append-only migration, `supabase/tests/admin_announcements.test.sql`,
  `src/features/admin/announcements/**`, `src/app/admin/announcements/**`,
  `src/components/app-nav.ts`, `src/app/student/page.tsx`, `src/app/lecturer/page.tsx`,
  `tests/integration/admin-announcements.*`, `tests/e2e/admin-announcements.spec.ts`,
  `package.json`'s new script line, `.github/workflows/ci.yml`'s "Accounts and passwords" job,
  this handoff.
- Deviations from the literal assignment text (not gaps, recorded decisions):
  1. Added `src/features/shared/announcements/{validation.ts,server.ts,server.test.ts}` (new
     directory, no CODEOWNERS entry today, so it falls to the repo's default owner): the reader
     projection (`listPublishedAnnouncements`) is read by both the Student and the Lecturer
     dashboards, so it is implemented once, in a role-neutral location, rather than duplicated
     under `src/features/student/` and `src/features/lecturer/` (which Joseph/Jordan own) or
     folded into `src/features/admin/` (which would make a Student/Lecturer page import from the
     admin feature's own folder). `src/components/announcements-card.tsx` is the one shared UI
     component both dashboards render, per the task's explicit requirement.
  2. The create/update RPC success JSON uses `announcementKind` rather than the spec's literal
     `kind` for the announcement's own category field, inside the single-item mutate response
     only. The spec's own API-contract shape (`{id, kind, title, body, isPublished, createdAt,
updatedAt}`) collides with this codebase's universal `{kind: "success" | "validation_error" |
...}` result-discriminant convention (used by every other admin RPC/action already, e.g.
     `createCourseResultSchema`): a flat object cannot hold two different values under one
     `kind` key. Resolved by keeping the discriminant named `kind` (house convention, needed for
     `z.discriminatedUnion`) and renaming only the colliding domain field in this one response
     shape; the admin list and reader projection are unaffected since their own `kind` field sits
     one level deeper, inside array items, never beside the outer `"success"` tag. The Server
     Action input field stays named `kind`, matching the spec exactly.
  3. `supabase/migrations/20261021200000_admin_announcements.sql`'s table grant uses `revoke all
... then grant select ... to authenticated` (not `anon`), mirroring `in_app_notifications`/
     `lecturer_ai_briefings`'s exact precedent -- `anon` is refused at the grant layer before RLS
     ever runs, which is a stricter (not weaker) version of the spec's described "signed-out
     caller matches no policy" boundary.
  4. Added `.github/workflows/ci.yml`'s new line and `package.json`'s new script, exactly
     mirroring what ADM-02/ADM-04's own developer rounds did for their equivalent integration
     suites in the same "Accounts and passwords" job.

## Changes

- `supabase/migrations/20261021200000_admin_announcements.sql`: new append-only migration.
  - `public.announcements` table: `kind`/`title`/`body` check constraints exactly matching
    ADM-03-R1's bounds; `is_published boolean not null default false`; `created_by`/`updated_by`
    reference `profiles` `on delete restrict`; two indexes for the admin-list and reader-cap read
    patterns.
  - RLS: `"announcements: admin reads all"` and `"announcements: active users read published"`,
    the exact two policies the spec specifies, mirroring `profiles`' own shape. `revoke all` then
    `grant select ... to authenticated` (ADM-03-R6; see deviation 3).
  - `admin_create_announcement`/`admin_update_announcement`/`admin_set_announcement_published`:
    `security definer`, `set search_path = ''`, `current_app_role() = 'admin'` check first,
    `execute` revoked from `public`/`anon`/`authenticated` then granted to `authenticated` only --
    the exact ADM-02 RPC pattern. No RPC is ever added for the admin list or the reader
    projection (ADM-03-R4/R5/R9): both read the table directly.
- `supabase/tests/admin_announcements.test.sql`: new pgTAP suite (30 assertions): RPC existence,
  ADM-03-AC10's full table/function privilege matrix (insert/update/delete revoked from both
  roles; select granted only to authenticated; execute granted only to authenticated), ADM-03-AC7
  (a draft is invisible to a lecturer/student's direct select; the admin sees it), ADM-03-AC15 (a
  deactivated user's direct select sees nothing, draft or published), ADM-03-AC9 (non-admin/
  signed-out direct RPC calls refused, no mutation), ADM-03-AC5 (unpublish preserves the row).
- `src/features/admin/announcements/{validation,server,presentation}.ts` (+ matching
  `.test.ts`): zod `.strict()` schemas (mirroring `src/features/admin/courses/validation.ts`'s
  `safeText`/`text(max)`/`boundedInput` helpers exactly); `createAnnouncement`/
  `updateAnnouncement`/`setAnnouncementPublished`/`listAnnouncementsForAdmin`, each
  `requireRole("admin")` first; `announcementStatusLabel`/`announcementKindLabel`/
  `truncatedAnnouncementBody` presentation helpers.
- `src/features/shared/announcements/{validation,server}.ts` (+ `server.test.ts`):
  `listPublishedAnnouncements`, `requireUser()` first (any active role), two direct
  RLS-protected reads (guidelines unlimited, announcements capped at 5), both newest-first,
  explicitly filtering `is_published = true` itself too (not only relying on RLS) so this
  function's own published-only contract holds even for an admin caller.
- `src/components/announcements-card.tsx`: the one shared `AnnouncementsCard` server component
  rendered on both `/student` and `/lecturer`. Title/body render as plain text with
  `whitespace-pre-wrap`, never through React's raw-HTML-injection prop or a Markdown renderer
  (ADM-03-R8); empty state uses the existing `EmptyState` component.
- `src/app/admin/announcements/*`: `/admin/announcements` page mirroring `/admin/courses` --
  `CreateAnnouncementDialog`/`CreateAnnouncementForm` (kind select, title, body, inline
  field-level validation errors); `EditAnnouncementDialog`/`EditAnnouncementForm` (pre-filled,
  per the spec's explicit "Edit opens a Dialog" requirement, unlike courses' inline-row edit);
  `AnnouncementsList`/`AnnouncementTableRow`/`AnnouncementRow`/`use-announcement-row.ts` (the
  `Table` at `>= md` / `Card` below it pattern, SH-07-R14); `actions.ts` re-checking
  `requireRole("admin")` before each delegated `server.ts` call.
- `src/components/app-nav.ts`: new "Communications" nav group (between "Teaching" and
  "Insights") with one "Announcements" item, `Megaphone` icon, pointing at
  `/admin/announcements`.
- `src/app/student/page.tsx` / `src/app/lecturer/page.tsx`: each adds one
  `<AnnouncementsCard />` to its existing dashboard JSX (owned by Joseph/Jordan respectively per
  `.github/CODEOWNERS` -- flagged for their required review below).
- `tests/integration/admin-announcements.test.ts` + `.vitest.config.mts` +
  `package.json`'s `test:admin-announcements:integration`: 11 live-DB tests covering AC1, AC3,
  AC4, AC5, AC6, AC7, AC8, AC9, AC11, AC13, AC15.
- `tests/e2e/admin-announcements.spec.ts`: three Playwright specs (picked up automatically by
  `admin.playwright.config.ts`'s existing `admin-*.spec.ts` `testMatch`, no config change
  needed) covering AC1/AC3/AC5/AC6 (create/edit/publish/unpublish via the UI), AC2 (field-level
  validation error), and AC14 (published content on both the Student and Lecturer dashboard
  cards). Cleans up its own fixture rows in `afterAll` via the local secret key (never printed).
- `.github/workflows/ci.yml`: added `npm run test:admin-announcements:integration` to the
  "Accounts and passwords" job, same line ADM-02/ADM-04 added for their own suites.

## Decisions and assumptions

All implementation decisions were already authorized by the spec (owner decisions 1-5 in its
Document control section: title/body bounds and default-draft-on-create; the RLS-only read path
for both the admin list and the reader projection; the reader's exact content/ordering rule; the
Lecturer-dashboard extension; the "Communications" nav group). The only choices made beyond the
spec's explicit prose are the three deviations recorded above (all presentational/structural, not
behavioral) and are reversible without touching any RPC/RLS contract.

## Evidence

See the `verification` array in the HANDOFF JSON block above for every command and its actual,
re-confirmed result (every check was re-run at least once after a mid-task connection interruption
and produced the identical result both times), including the two genuine failures (the
pre-existing ADM-01 seed-state issue, and the pre-existing Turbopack-build/Base-UI-dialog
environment issues) and the full diagnostic trail that root-causes each to this session's own
infrastructure rather than to this feature's code.

## Changes outside the owner's area

- `supabase/migrations/20261021200000_admin_announcements.sql` (new, append-only; no existing
  migration edited) and `.github/workflows/ci.yml` (one new line) both fall under
  `supabase/migrations/`/`.github/`'s shared-review requirement per `AGENTS.md`, and this spec's
  own Security requirements section explicitly asks for independent human review before merge
  (new table, new RLS policies, new RPCs).
- `src/app/student/page.tsx` and `src/app/lecturer/page.tsx` are owned by `@josephkwok001` and
  `@JordanGoh4` respectively per `.github/CODEOWNERS`; each change is a single one-line
  `<AnnouncementsCard />` addition, but both still need that owner's review before merge, per the
  spec's own R10 note.
- `src/features/shared/announcements/**` has no `.github/CODEOWNERS` entry (falls to the default
  `*` owner); flagged in case the coordinator wants to add Joseph/Jordan as co-owners, mirroring
  `/src/lib/`'s existing three-owner pattern, since this directory's whole purpose is to be read
  by their own dashboards.

## Findings and open questions

| #   | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                     | Status                                                                 |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Resolved | `npm run verify -- --profile=app`'s "application build" step (Turbopack) fails in this worktree: `node_modules` is a symlink to the reports worktree's, and Turbopack's hermetic workspace-root check refuses to resolve `next` through it. Confirmed not a code defect: `next build --webpack` compiles every route, including the new one, cleanly, twice.                                | Resolved: coordinator replaced the symlink with `npm ci`; build passes |
| 2   | Resolved | The admin Playwright e2e suite's dialog-based specs (mine and the pre-existing, unmodified admin-courses.spec.ts/admin-accounts.spec.ts) all fail identically in this session: a Base UI dialog backdrop (`data-base-ui-inert`) never stops intercepting pointer events, reproduced under both dev and production builds. ADM-03-AC14 could not be click-through-verified here as a result. | Resolved: 26/26 e2e pass with a real install                           |
| 3   | Medium   | `tests/integration/admin-accounts-verification.test.ts`'s `[ADM-01-AC14]` test fails on this shared stack today: its hardcoded seed profile ids no longer have matching rows (confirmed by direct query). Pre-existing, outside this task's scope.                                                                                                                                          | Local only: CI resets the database                                     |
| 4   | Info     | Applying this migration required `--include-all` because `20261021000000_lecturer_ai_briefings.sql` (pre-existing on this branch) had never been applied to the shared stack; applied it to reach this task's own migration, per the explicit "Apply with `npx supabase migration up --local`" instruction.                                                                                 | Resolved, flagged for visibility                                       |
| 5   | Info     | `npx supabase status -o json` prints a benign one-line CLI notice ("Stopped services: [...imgproxy, ...pooler]") on every invocation, in this session, including when piped through the mandated no-print path; no key/secret value is ever included, and `docker ps` confirms every core service stayed healthy throughout.                                                                | Resolved, flagged for transparency                                     |

## Coordinator verification addendum

The developer session was interrupted by a connection error and then stopped by the coordinator
before it committed. The coordinator reviewed the migration, replaced the worktree's symlinked
`node_modules` (a coordinator shortcut that caused findings 1 and 2) with a real `npm ci`, and
re-ran every check: verify app 10/10, verify database passed, announcements integration 11/11,
courses 12/12, reports 7/7, SH-06 11/11, accounts 25/26 (local seed only), admin + UI-shell e2e
26/26, and 0 leftover fixture rows.

## Next action

Coordinator/tester_verifier: independently review the new migration and RLS policies (explicitly
flagged as security-sensitive in the spec), the `.github/workflows/ci.yml` change, and ask
Joseph/Jordan to review their one-line dashboard additions. Separately: decide whether finding #1
(Turbopack/symlinked-node_modules) and finding #2 (Base UI dialog e2e interaction) need an
infra/environment fix before this or any other in-flight feature's e2e suite can run in this
worktree, and whether finding #3 (ADM-01's stale seed ids) needs a reseed. All ADM-03 code-level
and database-level checks already pass; only the e2e click-through of AC14 and the Turbopack build
step are blocked by the above, pre-existing environment issues.

Handoff evidence: workflow/handoffs/adm-03/2026-10-21-adm-03-developer.md
