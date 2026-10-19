# Handoff: SPEC-READINESS-01 — requirements_architect → coordinator and human reviewers

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "SPEC-READINESS-01",
"requirementIds": [
"PRD-01",
"TEC-01",
"SHR-01",
"INT-01",
"PLN-01",
"SH-01"
],
"status": "passed",
"changedFiles": [
"workflow/reviews/project-setup/2026-10-17-spec-readiness-review.md",
"workflow/plans/2026-10-17-first-vertical-slice.md",
"workflow/handoffs/project-setup/2026-10-17-spec-readiness-requirements-architect.md"
],
"verification": [
{
"check": "npm run check:spec",
"result": "passed",
"evidence": "6 specs, 41 criteria, and 5 covered; 36 uncovered draft criteria were warnings"
},
{
"check": "npm test and npm run lint",
"result": "blocked",
"evidence": "dependencies were not installed in that checkout"
}
],
"unresolvedIssues": [
"The reviewed specification set was not ready for implementation and remained draft.",
"Human product decisions and approval were still required."
]
}

<!-- HANDOFF:END -->

- Date: 2026-10-17
- Task ID: `SPEC-READINESS-01`
- Requirement / acceptance-criterion IDs: `PRD-01`, `TEC-01`, `SHR-01`, `INT-01`, `PLN-01`, `SH-01`; proposed first slice links `PRD-01-AC10`, `INT-01-AC3/AC5/AC6`, `SHR-01-AC1/AC2/AC3`, and `PLN-01-AC1/AC3`
- Specification version: repository commit `87a8951` on `AI-workflow-initalization`
- Specification status and human approver: all inspected specs are `draft`; no approver recorded
- Relevant context: all files under `workflow/specs/`, current `src/`, tests, migrations, workflow rules, CODEOWNERS, CI/deployment workflows, and project documentation
- Allowed edit scope: this handoff, `workflow/reviews/project-setup/2026-10-17-spec-readiness-review.md`, and `workflow/plans/2026-10-17-first-vertical-slice.md`
- Agent session log: not provided in the assignment

## Status

**passed** — the bounded review and proposed plan are complete. The specification set itself is not
ready for feature implementation and remains subject to human decisions and approval.

## Scope

Inspected the complete current specification set against source, tests, the initial migration,
workflow rules, ownership, CI/deployment definitions, and documentation. Distinguished implemented,
partial, and planned behavior; assessed completeness, consistency, testability, permissions, failure
cases, security boundaries, data contracts, and spec-to-code mismatches. Proposed one bounded first
vertical slice without changing any existing spec or application artifact.

No application code, test, migration, CI, deployment, or existing specification was modified.

## Proposed decisions and assumptions

### Confirmed from repository evidence

- The product feature layer is unimplemented; the repository currently contains foundation
  scaffolding and placeholder dashboards.
- All six specifications are draft, with no approved detailed role feature spec.
- `decideQuota` is unimplemented and can break the AI gateway's no-throw contract.
- Courses, slots, bookings, and announcements have no current schema or application files.
- Announcement publication/read (`PLN-01/P11`) is the smallest useful non-AI cross-role slice with
  few dependencies on unresolved booking behavior.

### Working assumptions used only to bound the proposal

- The slice remains non-AI and does not use the RLS-bypassing admin client.
- Deletion, scheduling, targeting, rich text, and notification behavior are excluded unless a human
  adds them to the approved detailed spec.
- Existing authentication/profile infrastructure will be corrected/approved before or together with
  the slice as required by `PLN-01`.

### Open human decisions

- announcement versus guideline representation, publication model, role visibility, admin edit
  ownership, deletion, field bounds, ordering/list bounds, stale edits, and retention;
- whether to separate the auth/RLS and AI portions of `SH-01` for approval;
- broader high-impact choices documented in the review: account provisioning/course eligibility,
  timezone/cancellation cutoff, request course source, admin self-management, admin booking privacy,
  data retention, and AI quota/output contracts.

## Artifacts

- `workflow/reviews/project-setup/2026-10-17-spec-readiness-review.md` — evidence-based readiness assessment,
  mismatches, missing requirements, ambiguities, and proposed first slice.
- `workflow/plans/2026-10-17-first-vertical-slice.md` — bounded spec-first implementation and
  validation plan, requirement links, boundaries, sequencing, test matrix, dependencies, and exact
  future agent edit paths.
- `workflow/handoffs/project-setup/2026-10-17-spec-readiness-requirements-architect.md` — this role handoff.

## Evidence

| Command or check                                                                                                  | Result               | Evidence                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Read `.codex/agents/requirements_architect.toml` in full                                                          | passed               | Role scope and required output were applied before repository review.                                                                |
| Enumerate specs, source, tests, migrations, workflow, CI, and docs with `rg --files`                              | passed               | Six actual specs and the current foundation/product file inventory were identified.                                                  |
| Read all six specs, template, relevant source/tests/migration, workflow rules, ownership, CI/deployment, and docs | passed               | Findings and file-level evidence are recorded in the readiness review.                                                               |
| `git rev-parse --short HEAD`; `git branch --show-current`                                                         | passed               | Baseline `87a8951`, branch `AI-workflow-initalization`.                                                                              |
| `npm run check:spec`                                                                                              | passed with warnings | `Specs: 6  Criteria: 41  Covered: 5`; 36 uncovered draft criteria were warnings.                                                     |
| `npm test`                                                                                                        | blocked              | Shell reported `vitest: command not found`; dependencies are not installed in this checkout.                                         |
| `npm run lint`                                                                                                    | blocked              | Shell reported `eslint: command not found`; dependencies are not installed in this checkout.                                         |
| Database and Playwright suites                                                                                    | unexecuted           | Local Supabase/application services and installed dependencies were not available; no service was started for this read/review task. |

## Risks and unresolved questions

1. **High — governance:** existing foundation code predates approval of its draft spec. Human must
   decide whether to revise/approve it, split it, or treat it as unaccepted implementation needing
   revalidation.
2. **High — AI correctness:** quota logic throws and quota/output rules are unresolved. Do not build
   role AI features until a corrected approved shared AI contract and tests exist.
3. **High — access control:** inactive users can still select their own profile under current RLS,
   conflicting with the broad product denial. Human must choose the intended minimal inactive-user
   access and align the policy/spec.
4. **High — booking readiness:** eligibility, authoritative course source, timezone, cancellation,
   field bounds, admin privacy, and physical concurrency contracts block booking child specs.
5. **High — first slice:** ten announcement decisions in the readiness review block a precise
   `ADM-03` spec; no implementation assignment should be issued before they are answered.
6. **Medium — verification:** only traceability executed. Dependencies and local services must be
   installed/started before runtime claims can be validated.

## Next action

Human reviewers should answer the ten announcement decisions and decide how to regularize/split
`SH-01`. Then assign `requirements_architect` the exact paths in the plan to draft `ADM-03`; stop
again for named human approval before invoking tester or developer.

## Human review

- Reviewed by:
- Decision: approved / changes requested
- Notes:
