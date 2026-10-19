# Handoff: SH-02 / SH-03 specification drafts — requirements architect → coordinator and human reviewer

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "SH-02-SH-03-SPEC-DRAFT",
"requirementIds": [
"SH-02-R1–R12",
"SH-02-AC1–AC17",
"SH-03-R1–R17",
"SH-03-AC1–AC30"
],
"status": "passed",
"changedFiles": [
"workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md",
"workflow/specs/shared/SH-03-slots-bookings-and-availability.md",
"workflow/handoffs/archive/stu-01/2026-10-17-sh-02-sh-03-requirements-architect.md"
],
"verification": [
{
"check": "initial npx prettier --check on the two new specifications",
"result": "failed",
"evidence": "Both new draft files required formatting; Prettier was then applied only to the two owned specification paths."
},
{
"check": "npx prettier --check workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md workflow/specs/shared/SH-03-slots-bookings-and-availability.md",
"result": "passed",
"evidence": "All matched files use Prettier code style after the scoped formatting pass."
},
{
"check": "npm run check:spec",
"result": "passed",
"evidence": "14 specs, 139 criteria, 13 covered; all 47 new SH-02/SH-03 criteria were detected and produced expected no-test warnings because both specs are draft."
},
{
"check": "git diff --check -- owned specification and handoff paths",
"result": "passed",
"evidence": "No whitespace errors in the owned files."
},
{
"check": "npm run check:secrets",
"result": "passed",
"evidence": "Secret scanning completed successfully with no finding."
},
{
"check": "requirements and acceptance-criterion ID/link validation",
"result": "passed",
"evidence": "SH-02 has 12 requirements and 17 unique linked criteria; SH-03 has 17 requirements and 30 unique linked criteria."
},
{
"check": "application, database, and end-to-end tests",
"result": "not-run",
"evidence": "Requirements-only task; no application code, test, migration, or runtime behavior changed."
}
],
"unresolvedIssues": [
"Course/string bounds, canonical course-code normalization, and post-use code changes need human decisions.",
"Slot duration, creation horizon, consultation-text bounds, and cancellation cutoff need human decisions.",
"Retention and physical deletion rules for courses, assignments, slots, and bookings are unresolved.",
"The authorized workflow for pending/approved bookings after assignment removal or course/lecturer deactivation is unresolved.",
"Catalogue/browse capacity, latency, rate limits, and cursor time expiry are unresolved.",
"The later account-management spec must settle administrator self-role/deactivation behavior."
]
}
<!-- HANDOFF:END -->

- Date: 2026-10-17
- Task ID: `SH-02-SH-03-SPEC-DRAFT`
- Requirement / acceptance-criterion IDs: `SH-02-R1–R12`, `SH-02-AC1–AC17`,
  `SH-03-R1–R17`, `SH-03-AC1–AC30`
- Specifications:
  - `workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md`
  - `workflow/specs/shared/SH-03-slots-bookings-and-availability.md`
- Specification versions/content digests:
  - SH-02: `97c7288030a3aa1df604ce892cf4547497c75be9`
  - SH-03: `3bc3f5cd29ea26040e8cedd71df71fa1f68d51c8`
- Specification status and human approver: both `draft`; no human approval recorded.
- Reviewed repository baseline: `9dae2a00342f159c4211c056ab297fae715451fb`
- Source STU-01 digest: `13fb2e0693210f4a97e75b395b167d2cf3f3d4f8`
- Relevant context files: `AGENTS.md`, `workflow/specs/_TEMPLATE.md`, umbrella/shared specs,
  `workflow/specs/student/STU-01-browse-available-slots.md`, its two handoffs and independent challenge,
  `workflow/specs/PLAN.md`, `workflow/plans/2026-10-17-first-vertical-slice.md`, policies, current source,
  initial migration/database tests, and `.github/CODEOWNERS`.
- Allowed edit scope: the two specification paths and this handoff only.
- Agent session log: not created; no task-owned log path was assigned.

## Decisions and assumptions

### Confirmed inputs recorded

- All active Students may browse active-course availability; Student enrolment is out of scope.
- Singapore display/date semantics with UTC `timestamptz` storage and database/server time authority.
- Shared availability, assignment-removal, completed-history, permitted-inference, safe-projection,
  cursor/resource, transport-error, accessibility/browser, and no-AI decisions accepted by the user.
- Database enforcement for lecturer/Student overlap and one active reservation per slot.

### Proposed for human review

- Logical table/function names and safe response shapes.
- Archival rather than hard deletion after dependent history exists.
- Administrator course/assignment operations and Lecturer own-assignment projection.
- Slot edit/delete constraints and integrity-protected/versioned cursor design.

### Open questions

The unresolved issues in the structured handoff and each specification's “Open questions blocking
approval” section require human decisions. No choice was silently treated as approved.

## Changes

- `SH-02` defines course/assignment lifecycle, permissions, safe filter projections, RLS/function
  boundaries, abuse cases, 12 requirements, and 17 acceptance criteria.
- `SH-03` defines slots/bookings, state transitions, availability, concurrency, safe Student browse RPC,
  pagination/resources/errors/accessibility, abuse cases, 17 requirements, and 30 acceptance criteria.
- This handoff records provenance, actual checks, unresolved decisions, and approval status.

Observed implementation was recorded separately in the specs: the current schema contains only
`profiles` and `ai_usage`; no course, assignment, slot, booking, or browse function currently exists.

## Evidence

| Command or check                                                          | Result  | Evidence                                                              |
| ------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------- |
| `git rev-parse HEAD`                                                      | passed  | Baseline `9dae2a00342f159c4211c056ab297fae715451fb`                   |
| `git hash-object workflow/specs/student/STU-01-browse-available-slots.md` | passed  | Source digest remained `13fb2e0693210f4a97e75b395b167d2cf3f3d4f8`     |
| Initial scoped `prettier --check`                                         | failed  | Both new files needed formatting; no unrelated file was formatted     |
| Scoped `prettier --write`, then scoped `prettier --check`                 | passed  | Both new specification files match Prettier style                     |
| `npm run check:spec`                                                      | passed  | 14 specs / 139 criteria / 13 covered; expected draft no-test warnings |
| `git diff --check -- <three owned paths>`                                 | passed  | No whitespace errors                                                  |
| `npm run check:secrets`                                                   | passed  | Completed with no finding                                             |
| Requirements/AC ID and link validation                                    | passed  | SH-02: 12/17; SH-03: 17/30; IDs unique and linked                     |
| Application/database/e2e tests                                            | not-run | No implementation, migration, or test changed                         |

## Changes outside the owner's area

None. No application code, tests, migration, CI, security configuration, or deployment file was edited.

## Findings and open questions

| #   | Severity | Finding                                                                                                 | Status                       |
| --- | -------- | ------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | High     | Exact course and booking-text validation bounds/normalization remain undefined                          | Open; blocks approval        |
| 2   | High     | Operational handling for already-booked consultations after lifecycle removal/deactivation is undefined | Open; blocks approval        |
| 3   | Medium   | Duration/horizon/cancellation timing and retention/deletion rules remain undefined                      | Open; blocks approval        |
| 4   | Medium   | Capacity, latency, non-AI rate limits, and optional cursor expiry remain undefined                      | Open; blocks approval        |
| 5   | Medium   | Administrator self-management belongs to a later account spec and cannot be inferred here               | Open dependency              |
| 6   | High     | Both specs and all parent documents are drafts; no human approval exists                                | Open; implementation blocked |

## Next action

The coordinator should obtain the listed human decisions, then assign an independent read-only
requirements challenge of both drafts. After revisions, a teammate other than the author must review and
approve the exact content digests before tests or implementation begin.

## Human review

- Reviewed by: not yet reviewed
- Decision: pending
- Notes: An agent-authored draft/handoff is not human approval.
