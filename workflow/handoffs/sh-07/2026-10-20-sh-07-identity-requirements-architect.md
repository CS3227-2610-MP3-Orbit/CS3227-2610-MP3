# Handoff: SH-07 / SH-07-R9..R16, AC12..AC20 — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-SH-07B",
"requirementIds": ["SH-07-R9", "SH-07-R10", "SH-07-R11", "SH-07-R12", "SH-07-R13", "SH-07-R14", "SH-07-R15", "SH-07-R16"],
"status": "incomplete",
"changedFiles": ["workflow/specs/shared/SH-07-ui-design-system.md", "workflow/handoffs/sh-07/2026-10-20-sh-07-identity-requirements-architect.md"],
"verification": [
{"check": "Read .codex/agents/requirements_architect.toml and AGENTS.md before drafting", "result": "passed", "evidence": "developer_instructions and spec-first/material-change rules read in full"},
{"check": "Confirmed branch and allowed-path scope before editing", "result": "passed", "evidence": "git branch --show-current -> feature/ui-identity at 0f25d6c; git status --porcelain after edits shows only workflow/specs/shared/SH-07-ui-design-system.md modified"},
{"check": "Read the approved SH-07 spec in full and the current code it governs before amending: src/components/role-shell.tsx, app-nav.ts, app-sidebar.tsx, src/app/globals.css, src/components/ui/badge.tsx, admin/student/lecturer page.tsx files, admin/accounts and admin/courses server+validation modules, .github/CODEOWNERS", "result": "passed", "evidence": "grounded R9-R16 in the real current markup/behaviour, e.g. existing Badge variants, existing NAV_ITEMS, existing listAccounts/listCourses/listLecturerRequests/listMyBookings signatures"},
{"check": "Verified no existing test asserts the literal text \"Consultation Booking\" or \"Back to dashboard\" before authorizing their removal", "result": "passed", "evidence": "grep -rn \"Consultation Booking\" and \"Back to dashboard\" across tests/ returned no matches; both occur only in src/app/layout.tsx, src/components/app-sidebar.tsx, and five page.tsx files"},
{"check": "Checked whether the student \"available slots\" stat tile can be priced from an existing function without a new query", "result": "passed", "evidence": "src/features/student/slots/server.ts's databaseResponseSchema caps slots at .max(20) and supabase/migrations/20261018000000_student_browse_available_slots.sql uses `limit 21` (cursor pagination) -- an unfiltered total isn't cheaply available, so SH-07-R12 documents the tile as omitted rather than adding a query"},
{"check": "Checked listAccounts/listCourses/listLecturerRequests/listMyBookings result schemas and their RPC SQL for any row cap that would make a .length count inaccurate", "result": "passed", "evidence": "no .max() on the accounts/courses/bookings arrays in src/features/admin/accounts/validation.ts, src/features/admin/courses/validation.ts, src/features/student/bookings/manage-validation.ts, and no LIMIT in supabase/migrations/20261020110000_admin_list_accounts.sql / 20261020140000_admin_courses.sql, so a full-length count is accurate and already cheap"},
{"check": "Read every tests/e2e/*.spec.ts file to find presentational-selector candidates the amendment would break", "result": "passed", "evidence": "found and documented in SH-07-R13/R14 and the edge-case table: page.locator(\"li\") row locators in admin-accounts.spec.ts and admin-courses.spec.ts (DOM-tag, not role/label); admin-courses.spec.ts's two create tests fill the form inline with no dialog-open step; getByText(\"Status: pending\", {exact:true}) etc. in student-manage-bookings.spec.ts, which the spec requires stays intact by nesting the Badge inside the existing literal \"Status: \" text node"},
{"check": "Set frontmatter status to draft, kept the original approval line marked SUPERSEDED (not deleted), added a Material revision document-control line and a new change-log row", "result": "passed", "evidence": "workflow/specs/shared/SH-07-ui-design-system.md lines 1-38 and the Change log table's final row"},
{"check": "Added SH-07-R9..R16 continuing numbering after R8, and SH-07-AC12..AC20 in the required bullet form continuing after AC11", "result": "passed", "evidence": "'Functional requirements' and 'Acceptance criteria and verification' sections"},
{"check": "Kept the whole spec within the ~230-line budget", "result": "passed", "evidence": "wc -l workflow/specs/shared/SH-07-ui-design-system.md -> 222"},
{"check": "git hash-object on the amended spec", "result": "passed", "evidence": "c7efac2e980a9f5c8bf38d77dca3f6673896374f"},
{"check": "npm run check:spec", "result": "passed", "evidence": "exit code 0; only pre-existing 'no test yet' warnings for draft ACs (including the new SH-07-AC12..AC20, expected since this spec is draft and no test references them yet) -- no error"},
{"check": "npm run lint / typecheck / build / test / test:e2e", "result": "not-run", "evidence": "out of role scope; no application code, test, or migration file was touched -- spec-only amendment"}
],
"unresolvedIssues": ["Exact SGT greeting-boundary hours (SH-07-R12/AC14) are proposed (05:00/12:00/18:00), not owner-confirmed", "Three proposed items carried over from the original approval (sidebar-collapse breakpoint/mechanism, font-hosting choice, SH-07-AC5 lint/grep mechanism) remain unresolved", "This material revision needs fresh owner re-approval before routing to developer; Joseph/Jordan still owe PR review for any src/app/student/** or src/app/lecturer/** edit per SH-07-R8", "admin-courses.spec.ts's two create tests and admin-accounts.spec.ts/admin-courses.spec.ts's page.locator(\"li\") row locators will need developer/tester updates when SH-07-R14 lands -- documented in the spec's edge-case table, not yet changed"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-20
- Task ID: `TASK-SH-07B`
- Requirement / acceptance-criterion IDs: `SH-07-R9..R16`, `SH-07-AC12..AC20` (amendment to the already-approved `SH-07-R1..R8`/`AC1..AC11`)
- Specification: `workflow/specs/shared/SH-07-ui-design-system.md`
- Specification version: content digest `c7efac2e980a9f5c8bf38d77dca3f6673896374f` (`git hash-object`); supersedes the approved digest from `2026-10-20-sh-07-requirements-architect.md` for the amended scope only — `R1`–`R8`/`AC1`–`AC11` are carried forward unchanged.
- Specification status and human approver: `draft` (reset from `approved`); not yet approved by any human for this amendment.
- Context files read this round: `.codex/agents/requirements_architect.toml`; `AGENTS.md`; the full prior `workflow/specs/shared/SH-07-ui-design-system.md`; its earlier handoffs in `workflow/handoffs/sh-07/`; `.github/CODEOWNERS`; `src/components/{role-shell,app-sidebar}.tsx`, `app-nav.ts`, `src/app/globals.css`, `src/components/ui/badge.tsx`; `src/app/{admin,student,lecturer}/page.tsx`, `src/app/admin/{accounts,courses}/page.tsx`; `src/features/admin/{accounts,courses}/{server,validation}.ts`; `src/features/lecturer/requests-server.ts`; `src/features/student/{bookings/manage-server,manage-validation,slots/server}.ts`; the matching `supabase/migrations/*` for row-limit checks; every file under `tests/e2e/*.spec.ts`.
- Allowed edit scope this round: `workflow/specs/shared/SH-07-ui-design-system.md` and this new handoff only, per the coordinator's assignment. No other path was written.

## Decisions and assumptions

Owner decisions (Johannsen, `TASK-SH-07B`, 2026-10-20, relayed by the coordinator), recorded as
`confirmed` in the amended `SH-07-R9..R16`: product name "Orbit" (sidebar wordmark + inline-SVG orbit
mark, page `<title>`); a SuperCane-style deep teal/navy sidebar with icons per nav item, uppercase
letter-spaced group labels, white/neutral content, Geist Mono for eyebrow/numeric text, dark mode kept
working; a per-role greeting ("Good morning/afternoon/evening, {fullName}", SGT, server-computed) plus
a stat-tile row sourced only from existing server functions; coloured `Badge` status pills for
account/course/booking status and role everywhere they render; accounts/courses as tables `≥ md` /
cards `< md` with create moved into a `Dialog`; friendlier empty states (icon + existing text + action
where one exists); removal of the redundant "Back to dashboard" links. Calendar views stay out of
scope. The original `SH-07-R1..R8` decisions are unchanged and carried forward.

Proposed, not yet confirmed: the exact SGT greeting-boundary hours backing `SH-07-R12`/`AC14` — the
owner confirmed the greeting text and the Singapore-time basis but not specific cut-off hours, so the
spec proposes 05:00/12:00/18:00 and flags it as needing sign-off before implementation (a material
detail I did not invent as confirmed, per the role's "do not invent a material requirement" rule).
The three items left proposed in the original approval (sidebar-collapse breakpoint/mechanism, font
hosting, `SH-07-AC5`'s lint/grep mechanism) remain open and are carried forward, not resolved here.

One tile the owner asked for could not be included: student "available slots count". The underlying
`browseAvailableSlots`/`browse_available_slots` function is cursor-paginated (`limit 21` in
`supabase/migrations/20261018000000_student_browse_available_slots.sql`, `slots` array capped at
`.max(20)` in the Zod schema) and cannot cheaply return an unfiltered total — getting a correct count
would need a new query, which `TASK-SH-07B`'s own constraint forbids. Per the owner's own fallback
rule ("omit the tile rather than add a query"), `SH-07-R12` records this tile as omitted, with the
reason, rather than silently dropping it or silently adding a query.

## Changes

- `workflow/specs/shared/SH-07-ui-design-system.md` (amended, `approved` → `draft`): kept the original
  approval line (marked superseded, not deleted) and added a "Material revision" document-control
  line, updated reviewed-HEAD/digests, and a new `TASK-SH-07B` "Confirmed" bullet; extended
  "Scope, non-goals, and dependencies"; added `SH-07-R9`–`R16` (identity, nav visual language, mono
  styling, greeting + stat tiles, semantic status pills, responsive lists + dialog create, empty
  states, removed nav links); extended non-functional/UI-description/use-cases/technical-constraints/
  data-model/API/security/AI sections with one or two sentences each to cover the new requirements
  without duplicating prose; added five new edge-case rows covering the dialog-open test gap, the
  `li`-locator candidates, the "Status: pending" exact-text preservation, icon `aria-hidden`
  preservation, and the narrow-viewport card view; added `SH-07-AC12`–`AC20` in the required bullet
  form; updated "Review evidence"/"Open questions blocking approval"; appended one change-log row.
- `workflow/handoffs/sh-07/2026-10-20-sh-07-identity-requirements-architect.md` (new): this handoff.

## Evidence

| Command or check                                                                                                                                       | Result  | Evidence                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `git branch --show-current`                                                                                                                            | passed  | `feature/ui-identity`                                                                                                       |
| `git rev-parse HEAD`                                                                                                                                   | passed  | `0f25d6c` (matches the coordinator's stated branch tip)                                                                     |
| `git status --porcelain` (after edits)                                                                                                                 | passed  | only `workflow/specs/shared/SH-07-ui-design-system.md` modified; this handoff is a new untracked file; nothing else touched |
| `grep -rn "Consultation Booking" tests/`                                                                                                               | passed  | no matches — safe to change per `SH-07-R9`                                                                                  |
| `grep -rn "Back to dashboard" tests/`                                                                                                                  | passed  | no matches — safe to remove per `SH-07-R16`                                                                                 |
| `grep -n "\.max(20)" src/features/student/slots/server.ts`; `grep -n "limit 21" supabase/migrations/20261018000000_student_browse_available_slots.sql` | passed  | confirms the paginated cap behind the "available slots" tile's documented omission                                          |
| `grep -n "\.max(" src/features/admin/accounts/validation.ts src/features/admin/courses/validation.ts` + `grep -n LIMIT` on the matching migrations     | passed  | no array cap / no SQL `LIMIT`, so `listAccounts`/`listCourses` counts are accurate                                          |
| `grep -rn "page.locator(\"li\")" tests/e2e/*.spec.ts`                                                                                                  | passed  | 4 matches in `admin-accounts.spec.ts`/`admin-courses.spec.ts`, documented as presentational-selector candidates             |
| `grep -n "Status: pending" tests/e2e/*.spec.ts`                                                                                                        | passed  | exact-text assertions found; spec requires the Badge nest inside the existing "Status: " text node to avoid breaking them   |
| `wc -l workflow/specs/shared/SH-07-ui-design-system.md`                                                                                                | passed  | `222` (within the ~230-line budget)                                                                                         |
| `git hash-object workflow/specs/shared/SH-07-ui-design-system.md`                                                                                      | passed  | `c7efac2e980a9f5c8bf38d77dca3f6673896374f`                                                                                  |
| `npm run check:spec`                                                                                                                                   | passed  | exit code `0`; only expected "draft AC has no test yet" warnings, including for the new `SH-07-AC12..AC20`                  |
| Application build/lint/typecheck/test/e2e                                                                                                              | not-run | out of role scope; no application code, test, or migration file was touched                                                 |

## Changes outside the owner's area

None. No application code, test, migration, CI, or security-configuration file was modified; all
`src/**` and `supabase/migrations/**` files above were read-only, to ground digests, requirements,
and the presentational-selector findings.

## Findings and open questions

| #   | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                               | Status                                                                                                  |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Medium   | `admin-courses.spec.ts`'s two create tests ("creates a course..." and "invalid code shows a field-level validation error") fill the form inline today with no step that opens anything; moving create into a `Dialog` (`SH-07-R14`) means both tests need a new "open the dialog" step before they can fill the Code/Name fields. Not a bare selector swap.                           | Open, documented in `SH-07-R14` and the edge-case table; developer/tester to update                     |
| 2   | Low      | `page.locator("li")` row locators in `admin-accounts.spec.ts` (×2) and `admin-courses.spec.ts` (×2) are DOM-tag, not role/label, selectors; they won't reliably match once rows can render as `<table>` rows or cards. Candidates for a justified presentational-selector update.                                                                                                     | Open, documented in the edge-case table                                                                 |
| 3   | Low      | `getByText("Status: pending"/"Status: approved"/"Status: cancelled", {exact: true})` in `student-manage-bookings.spec.ts` would break if the status word were pulled out of its surrounding "Status: " text into a separate element with no shared text node; `SH-07-R13` requires the Badge be nested inline after the literal label text instead, so no test change is needed here. | Resolved by requirement wording, not a test change                                                      |
| 4   | Info     | Student "available slots count" stat tile (owner-requested) is omitted — `browseAvailableSlots` is cursor-paginated and can't cheaply return an unfiltered total; adding one would violate `TASK-SH-07B`'s "no new query" constraint.                                                                                                                                                 | Confirmed per owner's own fallback rule; needs owner sign-off that the omission itself is acceptable    |
| 5   | Info     | Exact SGT greeting-boundary hours are proposed (05:00/12:00/18:00), not confirmed by the owner.                                                                                                                                                                                                                                                                                       | Open, flagged in the spec; needs owner decision before `SH-07-AC14`'s unit test is implementation-ready |
| 6   | Info     | Three items proposed in the original approval (sidebar-collapse breakpoint/mechanism, font-hosting choice, `SH-07-AC5` lint/grep mechanism) remain unresolved; this amendment did not touch them.                                                                                                                                                                                     | Open, carried forward                                                                                   |

## Next action

Owner re-approval of `workflow/specs/shared/SH-07-ui-design-system.md` (status `draft`) is required
before implementation, since this is a material revision of a previously approved spec; the owner
should also confirm the proposed SGT greeting-boundary hours (`SH-07-R12`) and the student
"available-slots" tile omission. After approval, route to `developer` for `SH-07-R9..R16`, then
`tester_verifier` to update the three documented test-selector/step gaps (`admin-courses.spec.ts`
dialog-open step, the two specs' `li` row locators) alongside the full existing suite, and
`security_reviewer`/Joseph/Jordan for any edit inside `src/app/student/**`/`src/app/lecturer/**` per
`SH-07-R8`.

Handoff evidence: workflow/handoffs/sh-07/2026-10-20-sh-07-identity-requirements-architect.md
