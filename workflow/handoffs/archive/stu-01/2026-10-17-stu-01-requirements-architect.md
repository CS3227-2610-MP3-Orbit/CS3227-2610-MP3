# Handoff: STU-01-SPEC — requirements_architect → coordinator and human reviewer

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "STU-01-SPEC",
"requirementIds": [
"STU-01",
"PRD-01-AC10",
"INT-01-AC3",
"INT-01-AC5",
"INT-01-AC6",
"SHR-01-AC1",
"SHR-01-AC2",
"SHR-01-AC3",
"PLN-01-AC1"
],
"status": "passed",
"changedFiles": [
"workflow/specs/student/STU-01-browse-available-slots.md",
"workflow/handoffs/archive/stu-01/2026-10-17-stu-01-requirements-architect.md"
],
"verification": [
{
"check": "repository inspection",
"result": "passed",
"evidence": "Inspected AGENTS.md, the five umbrella specs, SH-01, spec and handoff templates, readiness review, initial migration, Student/auth source, existing tests, CODEOWNERS, branch and working-tree state."
},
{
"check": "implementation-state comparison",
"result": "passed",
"evidence": "Confirmed Student browsing and the course/slot/booking data model are not implemented; only the protected Student placeholder and shared foundation exist."
},
{
"check": "format and specification traceability",
"result": "passed",
"evidence": "Prettier formatted both owned files; check:spec exited 0 with expected uncovered-criterion warnings for draft specs; the handoff validator passed; git diff --check passed."
}
],
"unresolvedIssues": [
"Human decisions are required for timezone, availability treatment of inactive references and completed bookings, date semantics, pagination, filter-option population, course-enrolment visibility, and accessibility target.",
"SH-01, planned SH-02, and planned SH-03 dependencies are not approved; STU-01 implementation must not begin yet."
]
}
<!-- HANDOFF:END -->

- Date: 2026-10-17
- Task ID: `STU-01-SPEC`
- Requirement / acceptance-criterion IDs: `STU-01-R1` through `STU-01-R8` and
  `STU-01-AC1` through `STU-01-AC22`, linked to the parent IDs in the JSON record
- Specification: `workflow/specs/student/STU-01-browse-available-slots.md`
- Specification version or commit: version `0.1-draft`; inspected repository commit `9dae2a0`
- Specification status and human approver: `draft`; no human approval recorded
- Relevant context files: `AGENTS.md`, all five umbrella specs, `SH-01-foundation.md`, spec/handoff
  templates, the readiness review, initial migration, Student/auth source, existing tests, and
  `.github/CODEOWNERS`
- Allowed edit scope: this specification and this handoff only
- Agent session log: not assigned

## Decisions and assumptions

### Confirmed from repository evidence

- STU-01 is planned under `PLN-01/P3` but has not been implemented.
- The Student dashboard is a protected placeholder; it has no browsing or filtering behavior.
- The current database has `profiles` and `ai_usage`, but no course, assignment, slot, or booking
  tables.
- The parent specs require future available slots, optional lecturer/course/date filters, minimal
  returned fields, server authorization, RLS, typed failures, and bounded queries.
- Browsing has no legitimate AI operation.

### Proposed decisions requiring human approval

- Singapore display/date timezone, strict future start, active course/lecturer/assignment checks,
  start-date matching, 20-item cursor pages, deterministic ordering, and enumeration-resistant
  filter errors.
- Rejected/cancelled booking history does not hide a slot; completed records never make a future
  slot reusable.

### Open human decisions

- The eight questions under “Open questions blocking approval” in the specification.
- Approval and exact contracts for the shared `SH-01`, `SH-02`, and `SH-03` dependencies.

## Changes

- `workflow/specs/student/STU-01-browse-available-slots.md`: detailed draft user behavior,
  availability/filter contract, permissions, data minimization, failure behavior, no-AI boundary,
  abuse cases, atomic acceptance criteria, validation plan, ownership, and open decisions.
- `workflow/handoffs/archive/stu-01/2026-10-17-stu-01-requirements-architect.md`: requirements handoff and truthful
  evidence record.

No application source, tests, migrations, CI, policies, deployment files, or existing specs changed.

## Evidence

| Command or check                                                                                                       | Result: passed / failed / blocked / unexecuted | Evidence                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `rg --files` scoped to specs, templates, handoffs, source, migrations, and tests                                       | passed                                         | Located current requirements and implementation artifacts.                                                                 |
| Read all five umbrella specs, `SH-01`, templates, readiness review, relevant source/tests/migration, and CODEOWNERS    | passed                                         | Parent constraints, missing shared model, ownership, and unresolved availability decisions are represented in the draft.   |
| `git rev-parse --short HEAD`; `git branch --show-current`; `git status --short`                                        | passed                                         | Baseline `9dae2a0` on `student-browse-consultation`; working tree was clean before these two files were added.             |
| `npx prettier --write` on both owned files                                                                             | passed                                         | Both Markdown files formatted successfully.                                                                                |
| `npm run check:spec`                                                                                                   | passed with warnings                           | Exit 0: 12 specs, 92 criteria, 13 covered; STU-01's 22 draft criteria correctly warn because tests are not yet authorized. |
| `node workflow/scripts/check-handoff.mjs workflow/handoffs/archive/stu-01/2026-10-17-stu-01-requirements-architect.md` | passed                                         | Handoff schema reported valid with status `passed`.                                                                        |
| `npm run check:secrets`                                                                                                | passed                                         | Secretlint completed with exit 0 and reported no finding.                                                                  |
| `git diff --check`                                                                                                     | passed                                         | No whitespace errors reported.                                                                                             |

## Changes outside the owner's area

- This handoff is required workflow evidence. No application/shared-area file changed.

## Findings and open questions

| #   | Severity | Finding                                                                                       | Status                                       |
| --- | -------- | --------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | High     | Course-enrolment visibility can change the data model and RLS boundary.                       | Human decision required.                     |
| 2   | High     | `SH-01`, `SH-02`, and `SH-03` are unapproved/missing dependencies for implementation.         | Must be approved before code.                |
| 3   | Medium   | Timezone, availability edge cases, date semantics, and pagination choices alter test results. | Proposed behavior awaits human confirmation. |
| 4   | Medium   | Filter-option population and accessibility/browser targets remain unspecified.                | Human decision required before approval.     |

## Next action

A human teammate should review the eight open decisions, request any changes, and record an approval
only after the dependent shared contracts are sufficiently precise. Do not assign implementation
while this specification remains `draft`.

## Human review

- Reviewed by:
- Decision: approved / changes requested
- Notes:
