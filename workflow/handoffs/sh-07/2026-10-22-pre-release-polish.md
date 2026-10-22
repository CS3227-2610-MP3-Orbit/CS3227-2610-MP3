# Handoff: pre-release audit fixes (shell, admin, sign-in) — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-PRE-RELEASE-POLISH",
"requirementIds": ["SH-07-R16", "SH-07-R17", "SH-07-R18", "SH-07-AC19", "SH-07-AC21", "SH-07-AC22", "ADM-01-R11", "ADM-01-AC26"],
"status": "passed",
"changedFiles": ["workflow/specs/shared/SH-07-ui-design-system.md", "workflow/specs/admin/ADM-01-manage-accounts.md", "src/components/role-shell.tsx", "src/components/stat-tile.tsx", "src/app/not-found.tsx", "src/app/admin/reports/page.tsx", "src/app/login/actions.ts", "src/app/login/actions.test.ts", "src/lib/sh07-contrast.test.ts", "tests/e2e/ui-shell.spec.ts", "workflow/handoffs/sh-07/2026-10-22-pre-release-polish.md"],
"verification": [
{"check": "npm run typecheck", "result": "passed", "evidence": "clean"},
{"check": "npm run lint", "result": "passed", "evidence": "0 problems"},
{"check": "npx prettier --check .", "result": "passed", "evidence": "All matched files use Prettier code style"},
{"check": "npm test (Vitest)", "result": "passed", "evidence": "37 files, 278 tests (269 before: +3 ADM-01-AC26, +6 stat-tile contrast)"},
{"check": "npm run test:workflow", "result": "passed", "evidence": "hooks and workflow scripts pass"},
{"check": "npm run check:spec", "result": "passed", "evidence": "exit 0; 379 criteria, 252 covered (+3); remaining warnings are draft specs only"},
{"check": "npm run check:secrets", "result": "passed", "evidence": "clean"},
{"check": "npm run check:sensitive", "result": "passed (flag raised, expected)", "evidence": "src/app/login/actions.ts and its test flagged as authentication: needs teammate review before merge"},
{"check": "npx playwright test --config tests/e2e/admin.playwright.config.ts tests/e2e/ui-shell.spec.ts (port 3104, shared local stack, read-only)", "result": "passed", "evidence": "17/17 including new SH-07-AC21 and SH-07-AC22"}
],
"unresolvedIssues": ["The deactivated-account sign-in message (ADM-01-AC26) is covered by a mocked unit test only; it was not exercised in a browser against a deactivated account.", "The lecturer dashboard (src/app/lecturer/page.tsx:40, owned by Jordan) still renders its own <main>, so SH-07-AC22 covers the student and admin dashboards only until that line becomes a <div>.", "The student request form's AI helper text (src/app/student/slots/[slotId]/request/request-form.tsx:283, owned by Joseph) uses the same muted-on-muted pairing that axe flagged; not changed here."]
}

<!-- HANDOFF:END -->

- Date: 2026-10-22
- Source: pre-release audit of `develop` at `5a05f87` (UI/accessibility review with axe, live QA).
- Spec changes: `SH-07-R17`/`R18` with `AC21`–`AC22`, `ADM-01-R11` with `AC26`; both specs stay
  `approved`, with the owner's 22 Oct approval recorded in each change log.

## What changed

| Finding                                                                            | Fix                                                                                   |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Every role page had two `<main>` landmarks (axe `landmark-no-duplicate-main`)      | `RoleShell` wraps content in a `<div>`; `SidebarInset` keeps the single `<main>`      |
| Stat-tile labels below 4.5:1 on the tinted tile (axe `color-contrast`)             | Label uses `text-foreground/75`; a blended-contrast unit test checks every tone/theme |
| Signed-in users got the bare Next.js 404                                           | Branded `src/app/not-found.tsx` with a "Go to your dashboard" link to `/`             |
| "Back to dashboard" link left on `/admin/reports` (SH-07-R16 removed it elsewhere) | Removed                                                                               |
| A deactivated user with the right password was silently bounced to `/login`        | Sign-in signs them out again and says the account is deactivated                      |

## Next decision

A teammate reviews the pull request, in particular the `src/app/login/actions.ts` change (flagged as
authentication by `check:sensitive`).
