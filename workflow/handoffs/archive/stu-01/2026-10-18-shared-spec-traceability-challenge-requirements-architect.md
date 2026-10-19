# Handoff: shared-spec traceability challenge — requirements architect → coordinator/human reviewer

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-SPEC-TRACEABILITY-SPLIT-CHALLENGE",
"requirementIds": [
"SH-02-R1",
"SH-02-R3–R6",
"SH-02-R9–R12",
"SH-03-R1–R2",
"SH-03-R5–R7",
"SH-03-R10–R17",
"SH-04-R1–R6",
"SH-05-R1–R9"
],
"status": "passed",
"changedFiles": [
"workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-challenge.md",
"workflow/handoffs/archive/stu-01/2026-10-18-shared-spec-traceability-challenge-requirements-architect.md"
],
"verification": [
{
"check": "git hash-object on SH-02, SH-03, SH-04, and SH-05",
"result": "passed",
"evidence": "Returned the four coordinator-named digests exactly: 68d84ac..., a2531c7..., 88edb19..., and d6674dc...."
},
{
"check": "npm run check:spec",
"result": "failed",
"evidence": "16 specs, 148 criteria, 52 covered; current errors are approved SH-01-AC6 and SH-01-AC7, while uncovered draft criteria are warnings."
},
{
"check": "approval simulation for revised SH-02 and SH-03",
"result": "failed",
"evidence": "17 of 34 retained criteria lack real tests: 7 in SH-02 and 10 in SH-03; approving both would correctly turn those warnings into errors."
},
{
"check": "independent behavior, mapping, security, API, and current-state challenge",
"result": "failed",
"evidence": "Eight open findings recorded; findings 1-6 block revised SH-02/SH-03 readiness and findings 7-8 prevent a lossless-future-scope claim."
},
{
"check": "scoped Prettier check, write, and recheck",
"result": "passed",
"evidence": "Initial check reported both authorized files needed formatting; Prettier wrote only those files and the final check passed."
},
{
"check": "handoff validation and scoped git diff --check",
"result": "passed",
"evidence": "Structured handoff JSON validated and no whitespace errors were reported."
}
],
"unresolvedIssues": [
"Per-slot course/lecturer IDs conflict between SH-03 and approved STU-01.",
"Existing profiles RLS exposes protected staff fields to Students.",
"Seventeen retained SH-02/SH-03 criteria remain uncovered.",
"Assignment endpoint lifecycle, option bounds, and the slot wire contract are ambiguous.",
"Future deletion/history and SH-04 no-AI behavior are not losslessly traceable."
]
}

<!-- HANDOFF:END -->

- Date: 2026-10-18
- Task ID: `TASK-SPEC-TRACEABILITY-SPLIT-CHALLENGE`
- Requirement / acceptance-criterion IDs: revised SH-02/SH-03 retained IDs and SH-04/SH-05 moved IDs
- Specification versions: SH-02 `68d84ac12cc9cb9a0370a6b7a983323a3b703027`; SH-03
  `a2531c77ce28b3dc8fcba0d733744658a9835b08`; SH-04
  `88edb191bd7603767b585add3d4a85dcbd6c922b`; SH-05
  `d6674dcefca792fb8e68a483b0c1de24fb2b662e`
- Specification status and human approver: all four are `draft`; no current human approval is claimed
- Relevant context files: `AGENTS.md`, feature-specification skill, workflow policies/templates,
  previous SH-02/SH-03 blobs, prior approval handoff, impact record, `STU-01`, current migration/tests/
  browse implementation, and coordinator/tester handoffs
- Allowed edit scope: this handoff and
  `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-challenge.md`
- Agent session log: none required for this read/review task

## Decisions and assumptions

Confirmed: the exact four digests match the coordinator assignment; the drafts reset approval; the
mapping has no mechanically orphaned old ID or duplicated new criterion; current traceability fails.

Assumption: repository implementation and prior handoffs are current-state evidence only, not authority
to resolve product conflicts.

Open: projection, profile visibility, assignment lifecycle meaning, resource bounds, wire serialization,
retention/deletion, and SH-04 no-AI coverage all require human disposition.

## Changes

- `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-challenge.md`: independent scenarios, eight
  findings, checklist, and not-ready recommendation.
- `workflow/handoffs/archive/stu-01/2026-10-18-shared-spec-traceability-challenge-requirements-architect.md`: bounded
  review evidence for coordinator/human handoff.

No canonical spec, plan, application code, test, migration, checker, CI, policy, approval, or existing
record was changed.

## Evidence

| Command or check                                    | Result | Evidence                                                                                 |
| --------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| `git hash-object` on all four draft specs           | passed | Exact assigned digests returned.                                                         |
| Prior-vs-current `git diff` and old blob inspection | passed | Retained/moved semantics compared against old SH-02 `97c7288...` and SH-03 `3bc3f5c...`. |
| Test-reference inventory                            | passed | 17 of 34 revised SH-02/SH-03 criteria covered and 17 uncovered.                          |
| `npm run check:spec`                                | failed | 16 specs, 148 criteria, 52 covered; SH-01-AC6/AC7 are current errors.                    |
| Spec challenge                                      | failed | Eight open findings; recommendation is `not ready`.                                      |
| Initial scoped `npx prettier --check`               | failed | Both authorized files required formatting.                                               |
| Scoped Prettier write and recheck                   | passed | Only the two authorized files were formatted; final check passed.                        |
| Handoff validator and scoped `git diff --check`     | passed | Structured JSON is valid; no whitespace errors.                                          |

## Changes outside the owner's area

None.

## Findings and open questions

| #   | Severity | Finding                                                                                        | Status                                        |
| --- | -------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1   | High     | SH-03 per-slot IDs conflict with approved STU-01 projection.                                   | Open; human product/data decision required.   |
| 2   | High     | Existing profile policy violates the asserted Student disclosure boundary.                     | Open; shared auth/security decision required. |
| 3   | High     | SH-02/SH-03 approval would create 17 legitimate missing-test errors.                           | Open; follow-on test sequencing required.     |
| 4–6 | Medium   | Assignment-current semantics, option bounds, and slot wire shape are not implementation-ready. | Open; shared/data/API decisions required.     |
| 7–8 | Medium   | Future retention semantics and SH-04 no-AI coverage were not moved losslessly.                 | Open; keep SH-04/SH-05 draft.                 |

## Next action

Coordinator returns the eight findings to the specification author and human owners for explicit
disposition, then requests a new independent challenge of revised exact digests before approval.

## Human review

- Reviewed by: pending
- Decision: changes requested
- Notes: this challenge recommends `not ready`; it is not human approval.
