# Handoff: TASK-SH-07-ADM02 / SH-07-R1,R4,R5,R6 — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-SH-07-ADM02",
"requirementIds": ["SH-07-R1", "SH-07-R4", "SH-07-R5", "SH-07-R6", "SH-07-AC1", "SH-07-AC5", "SH-07-AC6", "SH-07-AC7", "SH-07-AC8"],
"status": "passed",
"changedFiles": [
"src/app/admin/courses/page.tsx",
"src/app/admin/courses/course-row.tsx",
"src/app/admin/courses/create-course-form.tsx"
],
"verification": [
{"check": "npm run check:colors", "result": "passed", "evidence": "Scanned 97 files outside src/components/ui; none flagged"},
{"check": "npm run lint", "result": "passed", "evidence": "eslint, 0 problems"},
{"check": "npm run typecheck", "result": "passed", "evidence": "next typegen + tsc --noEmit clean"},
{"check": "npm test", "result": "passed", "evidence": "20 files/141 tests passed, 1 skipped, 4 todo (pre-existing)"},
{"check": "npm run format:check (after npx prettier --write on the 3 changed files)", "result": "passed", "evidence": "All matched files use Prettier code style!"},
{"check": "npm run check:spec", "result": "passed", "evidence": "0 errors; Specs: 28 Criteria: 307 Covered: 185 (only pre-existing draft-spec warnings, unrelated to this change)"},
{"check": "npm run test:admin-courses:integration", "result": "passed", "evidence": "1 file, 12 tests passed"},
{"check": "npx playwright test --config tests/e2e/admin.playwright.config.ts (port 3104)", "result": "passed", "evidence": "13/13: admin-accounts.spec.ts (1) + admin-courses.spec.ts (2) + ui-shell.spec.ts (10), all passing"}
],
"unresolvedIssues": []
}
<!-- HANDOFF:END -->

- Date: 2026-10-20
- Task ID: `TASK-SH-07-ADM02`
- Requirement / acceptance-criterion IDs: `SH-07-R1`, `SH-07-R4`, `SH-07-R5`, `SH-07-R6`, `SH-07-AC1`, `SH-07-AC5`, `SH-07-AC6`, `SH-07-AC7`, `SH-07-AC8`
- Specification: `workflow/specs/shared/SH-07-ui-design-system.md`, status `approved`, approved by Johannsen 2026-10-20
- Reference handoff: `workflow/handoffs/sh-07/2026-10-20-sh-07-developer.md` (ADM-01 restyle, same patterns reused here)
- Allowed edit scope: `src/app/admin/courses/**` only (+ `src/components/app-nav.ts` if the Courses entry were missing — it was already present from SH-07's ADM-01 round, so left untouched)

## Decisions and assumptions

- Restyled `src/app/admin/courses/page.tsx`, `course-row.tsx`, `create-course-form.tsx` onto the kit, mirroring `src/app/admin/accounts/page.tsx` / `account-row.tsx` / `create-account-form.tsx` exactly: `Label`/`Input`/`Button`/`Card`/`Badge` from `@/components/ui/*`, `buttonVariants` for raw submit `<button>`s, `bg-card`/`border-destructive`/`text-muted-foreground` tokens in place of `bg-black`/`text-white`/`border-amber-600`/`border-red-700`/`text-gray-600`/`border-green-700`.
- Native `<select>` elements (status filter, assign-lecturer picker) kept native with kit-matching Tailwind tokens, not swapped for the kit's `<Select>` — same deliberate deviation already documented in the SH-07 ADM-01 handoff, to avoid changing GET-form serialization or `getByLabel`/keyboard semantics.
- Course status pill changed from a raw `<span>` to the kit `Badge` (`variant="default"` for Active, `variant="outline"` for Deactivated) — same text (`courseStatusLabel`), same `role`-free presentational element, no accessible-name change.
- Search form's filter grid changed from `sm:grid-cols-4` to `sm:grid-cols-3` (2 fields instead of accounts' 3) — purely a layout fit, no test depends on the grid class count.
- No change to `actions.ts`, `requireRole` placement, Server Actions, validation, routes, or any form field `name`. Every label/button/role text the e2e/integration suites query by (`Code`, `Name`, `Create course`, `Active`/`Deactivated` exact, `Assign lecturer`, `Assign`, `Remove`, `Deactivate`/`Reactivate`, `Lecturer assigned.`, `Assignment removed.`, `Course activated.`/`Course deactivated.`, `No lecturer currently assigned.`, `role="status"`/`role="alert"` containers) kept its exact text/placement.
- `src/components/app-nav.ts` already lists `{ label: "Courses", href: "/admin/courses" }` under `admin` (added in the prior SH-07 developer round, ahead of this route landing) — confirmed, not edited.

## Changes

- `src/app/admin/courses/page.tsx`: kit `Label`/`Input`/`buttonVariants` for the search form; `Alert`-style `border-destructive`/`bg-card` tokens for the three error states; grid narrowed to `sm:grid-cols-3`.
- `src/app/admin/courses/course-row.tsx`: kit `Label`/`Input`/`Button`(`variant="outline" size="sm"`)/`Badge` replace the local `control`/`button` class-string constants and raw status `<span>`; native assign-lecturer `<select>` restyled with kit border/ring tokens.
- `src/app/admin/courses/create-course-form.tsx`: wrapped in `Card`/`CardHeader`/`CardContent`, kit `Label`/`Input`/`Button`, same field order, help text, and status/validation/success copy.

## Evidence

All commands run from the repo root with local Supabase already running (not reset).

| Command                                                                                                                                                                   | Result  | Evidence                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check:colors`                                                                                                                                                    | passed  | 97 files scanned outside `src/components/ui`, none flagged                                                                                                                                |
| `npm run lint`                                                                                                                                                            | passed  | eslint, 0 problems                                                                                                                                                                        |
| `npm run typecheck`                                                                                                                                                       | passed  | `next typegen && tsc --noEmit` clean                                                                                                                                                      |
| `npm test`                                                                                                                                                                | passed  | 20 files/141 tests passed, 1 skipped, 4 todo (pre-existing)                                                                                                                               |
| `npm run format:check`                                                                                                                                                    | passed  | after `npx prettier --write` on the 3 changed files                                                                                                                                       |
| `npm run check:spec`                                                                                                                                                      | passed  | 0 errors; `Specs: 28 Criteria: 307 Covered: 185`; remaining output is only pre-existing draft-spec warnings (`SH-02..05`, `WFG-*`), unrelated to this change                              |
| `npm run test:admin-courses:integration`                                                                                                                                  | passed  | 1 file, 12 tests                                                                                                                                                                          |
| `eval "$(npx supabase status -o json \| node tests/integration/local-supabase-env.mjs)" && npx playwright test --config tests/e2e/admin.playwright.config.ts` (port 3104) | passed  | 13/13: `admin-accounts.spec.ts` (1, pre-existing/unchanged), `admin-courses.spec.ts` (2, `ADM-02-AC1/AC3/AC6/AC7/AC8/AC12/AC14`), `ui-shell.spec.ts` (10, `SH-07-AC1..AC4/AC6/AC8..AC10`) |
| Dev server on port 3104                                                                                                                                                   | stopped | Playwright's own `webServer` lifecycle started and tore it down automatically; confirmed `lsof -i :3104` empty afterward                                                                  |

## Findings and unresolved questions

None.

## Next action

Route to `tester_verifier` for independent verification of the evidence above; no outstanding blocker.

## Human review

- Reviewed by:
- Decision: approved / changes requested
- Notes:
