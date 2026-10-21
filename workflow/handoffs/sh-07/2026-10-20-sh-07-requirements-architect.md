# Handoff: SH-07 / SH-07-R1..R8, AC1..AC11 — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-SH-07",
"requirementIds": ["SH-07-R1", "SH-07-R2", "SH-07-R3", "SH-07-R4", "SH-07-R5", "SH-07-R6", "SH-07-R7", "SH-07-R8"],
"status": "incomplete",
"changedFiles": ["workflow/specs/shared/SH-07-ui-design-system.md", "workflow/handoffs/sh-07/2026-10-20-sh-07-requirements-architect.md"],
"verification": [
{"check": "Read AGENTS.md, .codex/agents/requirements_architect.toml, workflow/specs/_TEMPLATE.md, workflow/specs/admin/ADM-01-manage-accounts.md and SH-06 for house style before drafting", "result": "passed", "evidence": "templates and two existing approved specs read in full"},
{"check": "Inspected current code before specifying scope: src/components/role-shell.tsx (header-only, no sidebar yet), src/app/*/layout.tsx (all three already share RoleShell), src/app/globals.css (two hard-coded hex tokens, no shadcn setup), no components.json/src/components/ui present, .github/CODEOWNERS, and e2e test selector style (getByRole/getByLabel/role=\"status\")", "result": "passed", "evidence": "see Document control digests; grounded R2 (shell already shared, just needs a sidebar), R5 (accessible-name preservation is testable against real selectors), R8 (no CODEOWNERS entry for src/components/)"},
{"check": "Drafted SH-07 with all 8 confirmed owner decisions as confirmed requirements, 3 explicitly flagged proposed sub-items (collapse mechanism, font hosting, lint mechanism), status draft", "result": "passed", "evidence": "workflow/specs/shared/SH-07-ui-design-system.md, Document control and R1-R8"},
{"check": "Acceptance criteria written as required bullets `- **SH-07-ACn** (Rx; verification; mocked/live) text`, 11 ACs covering: full test-suite pass, per-role nav isolation, dark-mode tokens, visible focus, no hard-coded colour outside src/components/ui, accessible-name preservation, lint/typecheck/build, status/alert preservation, sidebar keyboard collapse, no new fetch/storage, CODEOWNERS review", "result": "passed", "evidence": "'Acceptance criteria and verification' section, AC1-AC11"},
{"check": "Kept spec to _TEMPLATE.md headings, brief sections, target ~120-160 lines", "result": "passed", "evidence": "wc -l workflow/specs/shared/SH-07-ui-design-system.md -> 151"},
{"check": "git hash-object on the new spec", "result": "passed", "evidence": "0130c43501f76b32ea6d36b74d9310cf8a4a900e"},
{"check": "Confirmed on branch feature/admin-courses and did not touch the concurrent ADM-02 work", "result": "passed", "evidence": "git branch --show-current -> feature/admin-courses; git status --porcelain shows workflow/handoffs/adm-02/ and workflow/specs/admin/ADM-02-manage-courses-and-assignments.md as untouched untracked files from the other architect, only SH-07's two files are this agent's"},
{"check": "npm run check:spec / lint / typecheck / build / tests", "result": "not-run", "evidence": "out of role scope; no application code, migration, or test file created — this is a spec-only draft"}
],
"unresolvedIssues": ["Sidebar-collapse breakpoint/mechanism is proposed, not decided", "Whether to keep the system-font stack or adopt a self-hosted next/font is proposed, not decided", "The concrete lint/grep implementation behind SH-07-AC5 is proposed, not decided", "Spec status is draft; needs owner approval, then independent teammate review on the implementation PR per workflow/policies/approval-gates.md"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-20
- Task ID: `TASK-SH-07`
- Requirement / acceptance-criterion IDs: SH-07-R1..R8, SH-07-AC1..AC11
- Specification: `workflow/specs/shared/SH-07-ui-design-system.md`
- Specification version: content digest `0130c43501f76b32ea6d36b74d9310cf8a4a900e` (`git hash-object`); first draft, no prior approval to supersede.
- Specification status and human approver: `draft`; not yet approved by any human.
- Context files read this round: `AGENTS.md`; `.codex/agents/requirements_architect.toml`; `workflow/specs/_TEMPLATE.md`; `workflow/specs/admin/ADM-01-manage-accounts.md`; `workflow/specs/shared/SH-06-change-own-password.md`; `.github/CODEOWNERS`; `src/components/role-shell.tsx`; `src/app/globals.css`; `src/app/{student,lecturer,admin}/layout.tsx`; `package.json`; `tests/e2e/change-password.spec.ts` (selector style sample); `src/app` tree listing.
- Allowed edit scope this round: `workflow/specs/shared/SH-07-ui-design-system.md` and this handoff only, per the coordinator's assignment. Did not touch `workflow/specs/admin/ADM-02-*` or any other path.

## Decisions and assumptions

Owner decisions (Johannsen, 2026-10-20, relayed by the coordinator), recorded as `confirmed`: a
committed shadcn/ui kit in `src/components/ui/` (Tailwind v4, minimal set the current pages need);
light SaaS-dashboard visual direction with a left sidebar, neutral palette plus one accent, rounded
cards, clear tables; light-default theme with automatic dark mode via `prefers-color-scheme` using
shadcn CSS-variable tokens, no hard-coded hex in components; one shared shell (extending the
already-shared `RoleShell`) used by all three roles, with per-role nav defined once; restyle of every
existing page; strictly presentation-only, preserving behaviour, data access, validation,
`requireRole`/`requireUser` placement, routes, and every accessible name/role/label an existing test
queries by; ownership review for `src/app/student/**`/`src/app/lecturer/**` unchanged (existing
CODEOWNERS already covers it).

Proposed, not yet confirmed: the sidebar's exact collapse breakpoint/mechanism; keeping the current
system-font stack vs. a self-hosted `next/font`; the concrete lint/grep check behind `SH-07-AC5`.
None of these block drafting — they are implementation choices flagged for the developer/owner to
resolve, not missing requirements.

## Changes

- `workflow/specs/shared/SH-07-ui-design-system.md` (new, `draft`): full spec per `_TEMPLATE.md`
  headings — product description; in/out of scope; roles table; `SH-07-R1`–`R8` (kit, shared sidebar
  shell, theming, full-page restyle, presentation-only/test-preservation, accessibility, no new
  runtime fetch/storage, CODEOWNERS ownership); non-functional, UI description, 3 use cases; technical
  constraints; empty data-model/API sections (none changed); security requirements; "no AI" section;
  4-row edge-case table; `SH-07-AC1`–`AC11` in the required bullet form; review evidence; open
  questions; change log.
- `workflow/handoffs/sh-07/2026-10-20-sh-07-requirements-architect.md` (new): this handoff.

## Evidence

| Command or check                                                  | Result  | Evidence                                                                                                                                                                                                               |
| ----------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git hash-object workflow/specs/shared/SH-07-ui-design-system.md` | passed  | `0130c43501f76b32ea6d36b74d9310cf8a4a900e`                                                                                                                                                                             |
| `wc -l workflow/specs/shared/SH-07-ui-design-system.md`           | passed  | `151` (within the ~120-160 target)                                                                                                                                                                                     |
| Frontmatter `status:` field                                       | passed  | `draft` (new spec; correctly not self-approved)                                                                                                                                                                        |
| `git branch --show-current`                                       | passed  | `feature/admin-courses`                                                                                                                                                                                                |
| `git status --porcelain`                                          | passed  | only `workflow/specs/shared/SH-07-ui-design-system.md` and this handoff are this agent's changes; `workflow/handoffs/adm-02/` and `workflow/specs/admin/ADM-02-*` are untouched, belonging to the concurrent architect |
| Application build/lint/typecheck/test/migration                   | not-run | out of role scope; spec-only task, no code/migration/test file touched                                                                                                                                                 |

## Changes outside the owner's area

None. No application code, test, migration, CI, or security-configuration file was read for editing
or modified; `src/components/role-shell.tsx`, `src/app/globals.css`, and `.github/CODEOWNERS` were
read only, to ground the spec's digests and requirements, never written.

## Findings and open questions

| #   | Severity | Finding                                                                                                                                                                                                                                    | Status                      |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| 1   | Info     | Sidebar-collapse breakpoint and mechanism are left proposed; needs an owner/developer decision before `SH-07-R2`/`AC9` are implementation-ready.                                                                                           | Open, flagged in spec       |
| 2   | Info     | Font strategy (keep system stack vs. self-hosted `next/font`) is left proposed per the owner's own conditional wording ("unless self-hosted via next/font (Proposed)").                                                                    | Open, flagged in spec       |
| 3   | Low      | `SH-07-AC5`'s lint/grep mechanism for "no hard-coded colour outside `src/components/ui/`" is not yet specified as a concrete script/rule; a `workflow/scripts/*` check or an ESLint rule both fit the existing `check:*` pattern.          | Open, flagged for developer |
| 4   | Info     | No CODEOWNERS change is needed — `src/components/ui/` and `role-shell.tsx` already fall under the catch-all `@JohannsenLum` owner; `SH-07-R8` only restates the existing student/lecturer rule for restyled pages under those directories. | Confirmed, non-blocking     |

## Next action

Owner review and approval of `workflow/specs/shared/SH-07-ui-design-system.md` (status `draft`),
then resolve the three proposed items above; after approval, route to `developer` for the shadcn
kit, shell, and page restyle, followed by `tester_verifier` running the full existing suite
unchanged (`SH-07-AC1`) and `security_reviewer` for the CODEOWNERS-sensitive
`src/app/student/**`/`src/app/lecturer/**` edits.

Handoff evidence: workflow/handoffs/sh-07/2026-10-20-sh-07-requirements-architect.md
