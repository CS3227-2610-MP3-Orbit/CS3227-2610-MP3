# Security review: ADM-03 (guidelines and announcements)

<!--
Keep this JSON block valid. The completion hook validates structure, not truth or approval.
Use [] for no changed files or no unresolved issues. "blocked" and "not-run" are honest results.
-->
<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-03",
"requirementIds": ["ADM-03-R1", "ADM-03-R2", "ADM-03-R3", "ADM-03-R4", "ADM-03-R5", "ADM-03-R6", "ADM-03-R7", "ADM-03-R8", "ADM-03-R9", "ADM-03-R10"],
"status": "passed",
"changedFiles": [],
"verification": [
{"check": "npm run lint", "result": "passed", "evidence": "eslint: no output, zero errors/warnings"},
{"check": "npm run typecheck", "result": "passed", "evidence": "next typegen + tsc --noEmit clean"},
{"check": "npx supabase test db (full pgTAP suite, rolled back)", "result": "passed", "evidence": "Files=13 Tests=226 Result: PASS, incl. supabase/tests/admin_announcements.test.sql and rls_enabled.test.sql"},
{"check": "npx vitest run --exclude 'workflow/**' (full unit suite, mocked)", "result": "passed", "evidence": "Test Files 36 passed; Tests 268 passed"},
{"check": "npm run check:spec", "result": "passed", "evidence": "no ADM-03 errors; grep for ADM-03/error/FAIL on the output found nothing"},
{"check": "grep for dangerouslySetInnerHTML across src/", "result": "passed", "evidence": "zero live usages; only test files asserting its absence"},
{"check": "static review of 20261021200000_admin_announcements.sql", "result": "passed", "evidence": "see Findings/Checks below"},
{"check": "static review of src/features/admin/announcements/**, src/features/shared/announcements/**, src/components/announcements-card.tsx, src/app/admin/announcements/**, src/app/student/page.tsx, src/app/lecturer/page.tsx", "result": "passed", "evidence": "see Findings/Checks below"}
],
"unresolvedIssues": [
"src/app/student/page.tsx and src/app/lecturer/page.tsx (one-line <AnnouncementsCard /> addition each) are owned by @josephkwok001 and @JordanGoh4 per .github/CODEOWNERS and still need their review; this security review does not substitute for that CODEOWNERS gate.",
"e2e click-through (admin-announcements.spec.ts, incl. AC14's dashboard-card assertion) was not re-run by this review, per the assignment's instruction to avoid the shared integration/e2e suites; the developer and coordinator already reported 26/26 passing in a real install."
]
}
<!-- HANDOFF:END -->

## Status

passed — no blocking findings. One Info-level note recorded below; no Critical/High/Medium findings.

## Scope and effective restrictions

- Role: `security_reviewer`, operating on `feature/admin-announcements` at commit
  `72b6e363b17d9c83009f6bbc3da69d20d5bd6698` (clean working tree, verified via `git status --short`).
- Task/requirement IDs: `TASK-ADM-03` (issues #25, #9), `ADM-03-R1`..`R10`, `ADM-03-AC1`..`AC15`.
- Spec: `workflow/specs/admin/ADM-03-guidelines-and-announcements.md` (`status: approved`, owner
  Johannsen, 2026-10-21). Developer handoff read for context:
  `workflow/handoffs/adm-03/2026-10-21-adm-03-developer.md`.
- Files reviewed: `supabase/migrations/20261021200000_admin_announcements.sql`,
  `supabase/tests/admin_announcements.test.sql`,
  `src/features/admin/announcements/{validation,server}.ts`,
  `src/features/shared/announcements/{validation,server}.ts`,
  `src/components/announcements-card.tsx`, `src/app/admin/announcements/{actions,page}.tsx`,
  `src/app/admin/announcements/announcement-{row,table-row}.tsx`, `src/app/student/page.tsx`,
  `src/app/lecturer/page.tsx`, `src/lib/auth/session.ts`, `.github/CODEOWNERS`.
- Effective restriction: this session carries the coordinator's full Claude Code toolset, not the
  restricted Read/Grep/Glob set `.claude/agents/security-reviewer.md` describes for a genuine
  read-only subagent, so "read-only" here is behavioral/instructional except for the three
  handoff files this task explicitly directed me to write. No product code, migration, or test
  file was created, edited, or deleted. No destructive, state-changing, or push/commit/deploy
  command was run. No `.env` file was read; no secret was printed. The only commands executed
  were `git rev-parse`/`git log`/`git status`, `npm run lint`, `npm run typecheck`,
  `npx supabase test db` (pgTAP, every file wraps in `begin ... rollback`), `npx vitest run`
  (mocked unit tests), `npm run check:spec`, and a source-tree `grep` — all read-only, leaving
  zero rows behind.

## Threat model / attack surfaces considered

1. Stored XSS: an admin-entered `title`/`body` containing `<script>`/HTML markup, rendered later
   to every Student/Lecturer/Admin reader.
2. Draft disclosure: a Student, Lecturer, or signed-out caller reading an unpublished item, either
   through the app or a direct PostgREST `select` against `public.announcements`.
3. A deactivated account retaining read access to previously visible content.
4. A non-admin or signed-out caller invoking an `admin_*` write RPC or Server Action directly.
5. Length-bound bypass (oversized `title`/`body`) at either the app or database layer.
6. Privilege escalation via `createAdminClient`/service-role use, or a caller-supplied
   `isPublished`/`createdBy`/`updatedBy` on create.
7. The reader projection (`listPublishedAnnouncements`) accidentally surfacing a draft to a
   non-admin, including when the caller is itself an admin reusing the same function.

## Checks performed, with evidence

| Area                                                     | Check                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Result           | Evidence                                                                                                                                                                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization order                                      | `admin_create_announcement`, `admin_update_announcement`, `admin_set_announcement_published` each check `current_app_role() = 'admin'` as the first statement.                                                                                                                                                                                                                                                                                                                   | passed           | `20261021200000_admin_announcements.sql:74,141,213`                                                                                                                                                                |
| Authorization order (app layer)                          | `src/app/admin/layout.tsx` guards every `/admin/announcements/*` page; `src/app/admin/announcements/actions.ts` re-checks `requireRole("admin")` before delegating; `listAnnouncementsForAdmin` checks it again in `server.ts`. The reader path calls `requireUser()` (role-agnostic, active-only) first.                                                                                                                                                                        | passed           | `src/app/admin/announcements/actions.ts:15,20,25`; `src/features/admin/announcements/server.ts:40,62,87,112`; `src/features/shared/announcements/server.ts:50`                                                     |
| `createAdminClient`/service role                         | Not used anywhere in this feature.                                                                                                                                                                                                                                                                                                                                                                                                                                               | passed           | no `createAdminClient` import in either `server.ts`                                                                                                                                                                |
| No caller-supplied `isPublished`/`createdBy`/`updatedBy` | `admin_create_announcement` always inserts `is_published = false` and sets `created_by`/`updated_by` from `auth.uid()`, never from a parameter; the Zod input schemas for create/update do not accept these fields at all (`.strict()` on `{kind, title, body}` / `{id, kind, title, body}`).                                                                                                                                                                                    | passed           | `20261021200000_admin_announcements.sql:77,100-101`; `src/features/admin/announcements/validation.ts:52-60`                                                                                                        |
| `search_path` / security-definer hardening               | All three functions `security definer`, `set search_path = ''`, with `lock_timeout`/`statement_timeout`.                                                                                                                                                                                                                                                                                                                                                                         | passed           | `20261021200000_admin_announcements.sql:61-64,129-132,206-208`                                                                                                                                                     |
| Grants                                                   | `execute` revoked from `public`/`anon`/`authenticated`, granted to `authenticated` only, for all three functions; table-level `insert`/`update`/`delete` revoked from `anon`/`authenticated` as defense-in-depth beyond the RLS default-deny (no insert/update/delete policy exists at all).                                                                                                                                                                                     | passed           | `20261021200000_admin_announcements.sql:241-247,38-39`; pgTAP `admin_announcements.test.sql:27-58`                                                                                                                 |
| RLS: draft invisible to non-admin                        | `"announcements: active users read published"` requires `is_published`; `"announcements: admin reads all"` is the only policy that doesn't. A direct `select` by a lecturer/student against a draft row returns 0 rows at the database layer, independent of app code.                                                                                                                                                                                                           | passed           | migration lines 42-51; pgTAP `[ADM-03-AC7]` assertions (lecturer and student both see 0 rows against the draft, 1 against the published row)                                                                       |
| RLS: deactivated user sees nothing                       | `current_app_role()` returns null for an inactive profile, matching neither `select` policy.                                                                                                                                                                                                                                                                                                                                                                                     | passed           | pgTAP `[ADM-03-AC15]`: deactivated user's direct select on both the draft and the published row returns 0                                                                                                          |
| RLS: `anon` has no `select` either                       | Defense-in-depth beyond RLS: `anon` holds no table-level `select` privilege at all, so even a hypothetical future `anon`-targeted policy could not leak a row.                                                                                                                                                                                                                                                                                                                   | passed           | pgTAP: `not has_table_privilege('anon', 'public.announcements', 'select')` passes                                                                                                                                  |
| Non-admin/signed-out direct RPC calls                    | A student/lecturer caller gets `forbidden_or_not_found` with no mutation (checked for all three RPCs); `anon` is refused before the function body ever runs (`42501`, no execute grant).                                                                                                                                                                                                                                                                                         | passed           | pgTAP `[ADM-03-AC9]` block (student refused by create, lecturer refused by update and by unpublish, no row created/changed; anon's calls raise `42501`)                                                            |
| No hard delete                                           | No `delete` statement anywhere in the three RPCs, the admin-list read, or the reader read; no `delete` grant/policy exists on the table.                                                                                                                                                                                                                                                                                                                                         | passed           | migration file (no `delete` keyword outside comments); pgTAP `[ADM-03-AC5]`: unpublish preserves `created_by` and the row                                                                                          |
| Input validation (server)                                | `kind in ('guideline','announcement')`; `title`/`body` trimmed length bounds 1-120/1-2000, enforced both by the RPC and by a table `check` constraint (belt-and-suspenders — even a hypothetical future direct-insert bypass of the RPC could not violate the bound).                                                                                                                                                                                                            | passed           | `20261021200000_admin_announcements.sql:13-15` (table checks), `79-98`, `150-169` (RPC checks)                                                                                                                     |
| Input validation (app)                                   | Zod `.strict()` schemas duplicate the same bounds; `safeText` rejects an embedded NUL byte and an unpaired UTF-16 surrogate for both `title` and `body`; `boundedInput` rejects unknown/duplicate form fields and caps total payload at 16 KiB.                                                                                                                                                                                                                                  | passed           | `src/features/admin/announcements/validation.ts:11-21,46-50`                                                                                                                                                       |
| Stored XSS / plain-text rendering                        | `AnnouncementRow`, `AnnouncementTableRow` (admin list) and `AnnouncementsCard` (reader) all interpolate `{item.title}`/`{item.body}` as ordinary JSX text, with `whitespace-pre-wrap`/`break-words` classes only; a repo-wide grep for `dangerouslySetInnerHTML` found zero usages (only test assertions that it is absent). React escapes JSX text interpolation by default, so an admin-entered `<script>` tag renders as inert literal text everywhere this content is shown. | passed           | `src/app/admin/announcements/announcement-row.tsx:31,33`; `announcement-table-row.tsx:32,34`; `src/components/announcements-card.tsx:40-43`; grep (see JSON block)                                                 |
| Reader projection draft safety                           | `listPublishedAnnouncements` filters `is_published = true` itself in the query, in addition to relying on RLS — explicitly so that an admin caller (whose separate "admin reads all" RLS policy would otherwise also make a draft visible through the same query) still only ever sees published rows through this function.                                                                                                                                                     | passed           | `src/features/shared/announcements/server.ts:44-47,58,66` (the author's own in-code rationale, confirmed correct by reading the query)                                                                             |
| Reader cap (R9)                                          | Guidelines query has no `.limit()` (unbounded, matching "no cap" for guidelines); announcements query has `.limit(ANNOUNCEMENT_READER_CAP)` = 5, both ordered newest-first by `created_at desc, id desc`.                                                                                                                                                                                                                                                                        | passed           | `src/features/shared/announcements/server.ts:15,54-70`                                                                                                                                                             |
| No raw error leakage                                     | Every RPC/action path returns a typed `kind`; handled exceptions map to `temporarily_unavailable` with a `correlationId`, never a raw SQLSTATE/message.                                                                                                                                                                                                                                                                                                                          | passed           | `20261021200000_admin_announcements.sql:114-117,189-192,235-238`; `src/features/admin/announcements/server.ts` (repeated per function)                                                                             |
| No-AI boundary (R7)                                      | No import of `@/lib/ai/*`, no prompt construction, no `ai_usage` write anywhere in the announcements feature directories.                                                                                                                                                                                                                                                                                                                                                        | passed           | grep for `ai/client`, `generateText`, `ai_usage` under `src/features/admin/announcements`, `src/features/shared/announcements`, `src/app/admin/announcements`, `src/components/announcements-card.tsx`: no matches |
| CODEOWNERS routing                                       | `src/app/student/**` and `src/app/lecturer/**` are owned by `@josephkwok001`/`@JordanGoh4` respectively; the developer's one-line `<AnnouncementsCard />` addition to each is correctly flagged as needing that owner's review. `src/features/shared/announcements/**` has no explicit entry and falls to the default `*` owner — flagged by the developer, not a defect, but worth the coordinator's attention.                                                                 | passed (flagged) | `.github/CODEOWNERS`                                                                                                                                                                                               |
| Static analysis                                          | `npm run lint`, `npm run typecheck`                                                                                                                                                                                                                                                                                                                                                                                                                                              | passed           | see JSON block                                                                                                                                                                                                     |
| Database rules                                           | `npx supabase test db` (full suite, rolled back)                                                                                                                                                                                                                                                                                                                                                                                                                                 | passed           | Files=13 Tests=226, PASS                                                                                                                                                                                           |
| Unit tests                                               | `npx vitest run --exclude 'workflow/**'`                                                                                                                                                                                                                                                                                                                                                                                                                                         | passed           | Test Files 36 passed; Tests 268 passed                                                                                                                                                                             |
| Spec traceability                                        | `npm run check:spec`                                                                                                                                                                                                                                                                                                                                                                                                                                                             | passed           | no ADM-03 warnings/errors in output                                                                                                                                                                                |

## Findings

1. **Info** — `src/features/shared/announcements/**` has no explicit `.github/CODEOWNERS` entry
   and falls to the repository-wide `*` default owner (`@JohannsenLum`), even though its only
   purpose is to be read by the Student and Lecturer dashboards. Not a security defect — it is
   still reviewed before merge by the default owner — but the developer's own handoff already
   flagged this and suggested adding Joseph/Jordan as co-owners, mirroring `src/lib/`'s existing
   three-owner pattern. No action required from this review beyond surfacing it for the
   coordinator's CODEOWNERS decision.

No Critical, High, or Medium findings. The stored-XSS boundary (R8), the draft-invisibility
boundary (R5), and the admin-only mutation boundary (R6) are each independently enforced at more
than one layer (database `check` constraint + RPC validation; RLS policy + table-grant
defense-in-depth; `requireRole`/`requireUser` + RPC-internal role check), so a single-layer defect
would not by itself create an exploitable gap.

## Approval-gate assessment

Enforced outside model/agent output: the two RLS `select` policies (`current_app_role()` is the
authority, not app code), the table-grant revoke/grant matrix, `security definer` with
`set search_path = ''` on every new function, `requireRole("admin")`/`requireUser()` at the app
layer, and React's default JSX-text escaping (no `dangerouslySetInnerHTML`/Markdown renderer
exists in this feature to opt back into raw-HTML rendering). This spec's own Security
requirements section explicitly calls for independent human review before merge (new table, new
RLS policies, new RPCs); that has not yet happened and this report does not substitute for it.
CODEOWNERS correctly routes the two one-line dashboard changes to Joseph/Jordan — confirmed by
reading `.github/CODEOWNERS`, not yet confirmed as actually having happened (that is a GitHub PR
state, outside this review's access).

## Limitations and unresolved questions

- Static plus read-only automated checks only (lint, typecheck, pgTAP, unit tests, check:spec);
  the live-DB integration suite (`test:admin-announcements:integration`) and the e2e suite
  (`admin-announcements.spec.ts`, including `AC14`'s dashboard-card assertion) were read but not
  re-executed, per the assignment's instruction to avoid the shared integration/e2e suites that
  `tester_verifier` is running concurrently in this worktree.
- I cannot grant human/PR approval or confirm that Joseph's/Jordan's CODEOWNERS review has
  actually occurred on a pull request; that is tracked outside this repository checkout.
- I did not independently re-verify the pre-existing `in_app_notifications`/`lecturer_ai_briefings`
  precedent this migration cites for its grant shape; I confirmed the grant shape in this
  migration directly instead, which is sufficient for this review's scope.

## Next action

Coordinator: route this feature (new table, new RLS policies, new RPCs — flagged
security-sensitive by the spec itself) to an independent human reviewer before merge, and confirm
Joseph's and Jordan's CODEOWNERS review lands on the actual pull request for the two dashboard
changes. No code changes are required from this review; the one Info note above is optional and
non-blocking.

Handoff evidence: workflow/handoffs/adm-03/2026-10-21-adm-03-security-reviewer.md
