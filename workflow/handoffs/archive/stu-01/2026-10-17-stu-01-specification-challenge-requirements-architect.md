# Handoff: STU-01 specification challenge — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "STU-01-SPEC-CHALLENGE",
"requirementIds": [
"STU-01-R1",
"STU-01-R2",
"STU-01-R3",
"STU-01-R4",
"STU-01-R5",
"STU-01-R6",
"STU-01-R7",
"STU-01-R8",
"STU-01-AC1",
"STU-01-AC22"
],
"status": "passed",
"changedFiles": [
"workflow/reviews/stu-01/2026-10-17-stu-01-specification-challenge.md",
"workflow/handoffs/archive/stu-01/2026-10-17-stu-01-specification-challenge-requirements-architect.md"
],
"verification": [
{
"check": "independent repository and specification review",
"result": "passed",
"evidence": "Reviewed digest 13fb2e0693210f4a97e75b395b167d2cf3f3d4f8 independently against the original request, umbrella/shared drafts, policies, current auth/schema/source, and existing tests; no canonical spec or implementation file was edited."
},
{
"check": "pre-edit formatting and spec traceability",
"result": "passed",
"evidence": "Prettier check reported both inspected Markdown files formatted; check:spec exited 0 with expected uncovered-test warnings for draft acceptance criteria."
},
{
"check": "owned-artifact validation",
"result": "passed",
"evidence": "After formatting only the two owned files, Prettier check and structured handoff validation passed; secret scanning and scoped git diff whitespace validation exited 0."
}
],
"unresolvedIssues": [
"The source specification is not ready: five high-severity findings require human product/security decisions.",
"The source remains draft with no human approver; SH-01 is draft and SH-02/SH-03 are not approved implementation dependencies.",
"Medium findings remain for cursor staleness, bounded input, direct-boundary outcomes, filter options, verification mapping, accessibility, and retry/logging behavior."
]
}

<!-- HANDOFF:END -->

- Date: 2026-10-17
- Task ID: `STU-01-SPEC-CHALLENGE`
- Requirement / acceptance-criterion IDs: `STU-01-R1` through `STU-01-R8` and
  `STU-01-AC1` through `STU-01-AC22`
- Specification: `workflow/specs/student/STU-01-browse-available-slots.md`
- Specification version or commit: content digest
  `13fb2e0693210f4a97e75b395b167d2cf3f3d4f8`; repository commit `9dae2a0`
- Specification status and human approver: `draft`; none recorded
- Latest source handoff: `workflow/handoffs/archive/stu-01/2026-10-17-stu-01-requirements-architect.md`
- Allowed edit scope: this challenge record and this handoff only
- Review type: independent challenge by a separately assigned requirements architect

## Decisions and assumptions

### Confirmed

- The user requested a read-only Student slot-browsing/filtering specification and explicitly
  prohibited implementation.
- Current code and schema do not implement the feature or its course/assignment/slot/booking model.
- Browsing has no permitted AI action.

### Proposed

- All clarifications in the challenge record are proposals for the coordinator/spec author; this
  reviewer selected no product rule.

### Open human decisions

- Course-enrolment visibility, database projection design, completed-booking semantics, permitted
  availability inference, and lecturer-course assignment lifecycle.
- Timezone/date behavior, filter options, pagination/stale cursors, measurable resource limits,
  transport-specific refusal behavior, accessibility/browser targets, and recovery behavior.

## Artifacts

- `workflow/reviews/stu-01/2026-10-17-stu-01-specification-challenge.md`: independently derived scenarios,
  13 findings, criteria counterexamples, checklist, and `not ready` recommendation.
- `workflow/handoffs/archive/stu-01/2026-10-17-stu-01-specification-challenge-requirements-architect.md`: structured
  evidence and coordinator handoff.

No canonical specification, application source, test, migration, CI, policy, deployment, or log file
was changed.

## Evidence

| Command or check                                                                                                                          | Actual outcome                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Read skill, challenge template, source spec, and latest source handoff                                                                    | Passed; confirmed assigned operation, source digest, draft status, and open decisions.                                                      |
| Read `AGENTS.md`, umbrella/shared specifications, policies, current auth/schema/source, and existing tests                                | Passed; found no feature implementation and identified cross-document conflicts and missing dependencies.                                   |
| `git hash-object workflow/specs/student/STU-01-browse-available-slots.md`                                                                 | Passed; returned `13fb2e0693210f4a97e75b395b167d2cf3f3d4f8`.                                                                                |
| `npx prettier --check workflow/specs/student/STU-01-browse-available-slots.md workflow/templates/specification-challenge.md` before edits | Passed; both inspected files used Prettier style.                                                                                           |
| `npm run check:spec` before edits                                                                                                         | Passed with warnings; exit 0, 12 specs, 92 criteria, 13 covered, and expected warnings for draft criteria including all 22 STU-01 criteria. |
| `npx prettier --check` on both owned review/handoff files after formatting                                                                | Passed; both files use Prettier style.                                                                                                      |
| `node workflow/scripts/check-handoff.mjs` on this handoff                                                                                 | Passed; handoff schema valid with status `passed`.                                                                                          |
| `npm run check:secrets`                                                                                                                   | Passed; exited 0 with no reported finding.                                                                                                  |
| `git diff --check --` scoped to both owned files                                                                                          | Passed; exited 0 with no whitespace error.                                                                                                  |

## Risks and unresolved questions

1. **High:** Student course visibility is unresolved and changes authorization, schema, and RLS.
2. **High:** The database projection boundary is not selected; table RLS alone does not enforce
   field-level minimization.
3. **High:** Completed-booking availability language conflicts across drafts.
4. **High:** The permitted inference from slot availability is undefined, making part of the privacy
   requirement impossible to verify as written.
5. **High:** “Current” lecturer-course assignment has no lifecycle semantics.
6. **Medium:** Cursor staleness, input/resource bounds, direct boundary outcomes, filter-option data,
   accessibility, retry/logging, and per-criterion verification need clarification.

## Next action

The coordinator should review the challenge, obtain the material human decisions, and assign a
requirements-only revision of the draft. Implementation remains blocked until the revised spec and
its shared dependencies have human approval recorded against a reviewed digest.

Handoff evidence: workflow/handoffs/archive/stu-01/2026-10-17-stu-01-specification-challenge-requirements-architect.md
