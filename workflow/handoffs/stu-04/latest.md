# STU-04 — draft specification handoff

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "STU-04-SPEC",
"requirementIds": ["STU-04-R1", "STU-04-R2", "STU-04-R3", "STU-04-R4", "STU-04-R5", "STU-04-R6", "STU-04-R7", "STU-04-R8", "STU-04-R9", "STU-04-R10"],
"status": "incomplete",
"changedFiles": ["workflow/specs/student/STU-04-manage-my-bookings.md", "workflow/plans/stu-04-manage-my-bookings.md", "workflow/reviews/stu-04/specification-challenge.md", "workflow/handoffs/stu-04/latest.md", "logs/joseph/stu-04.md"],
"verification": [
{"check": "npm run check:spec", "result": "passed", "evidence": "18 specs, 181 criteria, 72 referenced; STU-04 draft criteria correctly report coverage warnings."},
{"check": "Targeted Prettier, handoff validation, and git diff --check", "result": "passed", "evidence": "Formatting initially identified four assigned files and passed after targeted formatting; handoff is valid; no whitespace errors."},
{"check": "Draft self-review", "result": "passed", "evidence": "Challenge records five findings; it is not independent review or human approval."}
,{"check": "Approved-spec traceability", "result": "failed", "evidence": "npm run check:spec correctly requires tests for STU-04-AC1 through AC12 after status changed to approved; no tests were added in this spec-only task."}
],
"unresolvedIssues": ["Human/team approval of revised exact digest", "Proposed ordering/truncation/key encoding and real Lecturer-transition fixture"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-18
- Task ID: `STU-04-SPEC`
- Requirement / acceptance-criterion IDs: `STU-04-R1`–`R10`, `STU-04-AC1`–`AC12`
- Specification: `workflow/specs/student/STU-04-manage-my-bookings.md`
- Specification version or commit: uncommitted draft on `student-manage-bookings`
- Specification status and human approver: `approved`; Joseph reported whole-team approval on 2026-10-18
- Exact approved specification digest: `9eafaec3a8a4a83ebd11beca09ecfd88ca7463b2`
- Relevant context files: `AGENTS.md`, `STU-02`, `SH-01/02/03/05`, predecessor handoff
- Allowed edit scope: STU-04 spec, plan, challenge, handoff, and Joseph log only
- Agent session log: `logs/joseph/stu-04.md`

## Decisions and assumptions

Joseph reported the whole team reviewed and approved the revised specification for implementation.
Individual reviewers and remote PR approval are not independently verified. This product approval does
not approve merge, deployment, or sensitive changes.

Confirmed: list summary/detail/no pagination; both-field pending edits including after start; idempotency
key plus expected version; first-valid cancel/Lecturer-decision transition wins. Proposed: ordering,
summary truncation, key/version encoding, text bounds, and wording. Human review remains required.

## Changes

- Created the draft spec, bounded plan, self-review challenge, this handoff, and a factual log.
- No application code, tests, migrations, CI, auth configuration, commit, merge, or deployment changed.

## Evidence

| Command or check                                          | Result  | Evidence                                                                                      |
| --------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| Repository/spec/policy/migration inspection               | passed  | Sources recorded in the draft document control and log.                                       |
| `npm run check:spec`                                      | failed  | Correctly requires tests for approved STU-04-AC1–AC12; no tests added in this spec-only task. |
| Targeted Prettier; handoff validation; `git diff --check` | passed  | Formatting passed after targeted correction; handoff valid; no whitespace errors.             |
| Application/database/browser checks                       | not-run | Spec-only task; required before implementation verification.                                  |

## Changes outside the owner's area

None.

## Findings and open questions

| #   | Severity | Finding                                                             | Status                                  |
| --- | -------- | ------------------------------------------------------------------- | --------------------------------------- |
| 1   | Medium   | Exact ordering/summary truncation/key encoding remain proposed.     | Human reviewer confirmation             |
| 2   | Medium   | A real Lecturer transition fixture is needed for race verification. | Coordinator/tester setup after approval |

## Next action

Implementation is now present in the uncommitted worktree and requires independent teammate/CODEOWNER
review before merge because it includes a migration and authorization boundary. Before accepting it,
add/run the remaining dedicated STU-04 browser and concurrency coverage; the real Lecturer transition
race remains deferred until that feature exists. No merge or deployment is approved.

## Implementation-cycle reconciliation — 2026-10-18

- Implementation source: HEAD `378e4218b052639030d858697432bd26e1669f50` plus final uncommitted
  content fingerprint `56620bda44f212bdee64a5cdbbcdbe5bcdbd68a9` recorded by the read-only security
  reviewer. See `developer.md`, `tester.md`, and the coordinator-owned Joseph log.
- Round 1 security finding `SEC-04-01` was fixed and independently rechecked: an unknown edit/cancel
  outcome now retains and retries its original idempotency key/version/payload rather than creating a
  new intent.
- Passed: focused developer units 2/2; isolated STU-04 pgTAP 8/8 and targeted authenticated database
  checks; project unit suite 42 passed (4 todo); lint with no errors; typecheck; check:spec 84 referenced;
  workflow tests; secret scan; whitespace check.
- Not run: STU-04 browser execution/accessibility, simulated lost-response UI automation, GET/cross-origin,
  timeout, real multi-connection races, and actual Lecturer transition race. The first attempted tester
  disposable reset targeted normal local state, so its results were discarded; later isolated results use
  a separately identified temporary project. No remote/production system was touched.

## Human review

- Reviewed by: not yet recorded
- Decision: pending
- Notes: agent-authored draft/self-review is not approval.
