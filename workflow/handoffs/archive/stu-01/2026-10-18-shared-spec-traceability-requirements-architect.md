# Handoff: shared-spec traceability split — requirements architect → coordinator/human reviewer

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-SPEC-TRACEABILITY-SPLIT",
"requirementIds": [
"SH-02-R1",
"SH-02-R3",
"SH-02-R4",
"SH-02-R5",
"SH-02-R6",
"SH-02-R9",
"SH-02-R10",
"SH-02-R11",
"SH-02-R12",
"SH-03-R1",
"SH-03-R2",
"SH-03-R5",
"SH-03-R6",
"SH-03-R7",
"SH-03-R10",
"SH-03-R11",
"SH-03-R12",
"SH-03-R13",
"SH-03-R14",
"SH-03-R15",
"SH-03-R16",
"SH-03-R17",
"SH-04-R1–R6",
"SH-05-R1–R9"
],
"status": "passed",
"changedFiles": [
"workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md",
"workflow/specs/shared/SH-03-slots-bookings-and-availability.md",
"workflow/specs/shared/SH-04-course-and-assignment-management.md",
"workflow/specs/shared/SH-05-slot-and-booking-mutations.md",
"workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-impact.md",
"logs/joseph/archive/stu-01/2026-10-18-shared-spec-traceability-revision.md",
"workflow/handoffs/archive/stu-01/2026-10-18-shared-spec-traceability-requirements-architect.md"
],
"verification": [
{
"check": "pre-change npx prettier --check on SH-02/SH-03",
"result": "passed",
"evidence": "Both prior approved canonical specs matched Prettier before editing."
},
{
"check": "post-draft scoped prettier check/write/check",
"result": "passed",
"evidence": "Initial check found formatting differences; Prettier was applied only to authorized artifacts and final check passed."
},
{
"check": "npm run check:spec",
"result": "failed",
"evidence": "16 specs, 148 criteria, 52 covered; only approved SH-01-AC6 and SH-01-AC7 remain errors. Revised/new SH-02–SH-05 are draft warnings pending approval and tests."
},
{
"check": "requirement and acceptance-criterion self-review",
"result": "passed",
"evidence": "Every normative SH-02–SH-05 requirement has at least one linked criterion; retained/moved/split IDs are mapped in the impact record."
},
{
"check": "git diff --check on authorized artifacts",
"result": "passed",
"evidence": "No whitespace errors after final formatting."
},
{
"check": "application, unit, database, and end-to-end tests",
"result": "not-run",
"evidence": "Specification-only task; no application code, tests, migrations, checker, CI, or runtime behavior changed."
}
],
"unresolvedIssues": [
"Material SH-02/SH-03 revision requires independent challenge and renewed teammate approval of exact digests.",
"SH-01-AC6 is only todo and SH-01-AC7 has no test; real coverage is still required, so check:spec truthfully fails.",
"Staff-profile RLS and slot course/lecturer ID projection conflicts need separate human requirement decisions.",
"SH-04/SH-05 future management/mutation specs contain unresolved product/API decisions and remain draft."
]
}

<!-- HANDOFF:END -->

- Date: 2026-10-18
- Task ID: `TASK-SPEC-TRACEABILITY-SPLIT`
- Reviewed baseline: `e5893b28a6d898bdfb698dcb7f48e293ab373e7b` plus preserved working-tree
  implementation/spec changes
- Prior approved evidence invalidated: SH-02 behavior digest
  `97c7288030a3aa1df604ce892cf4547497c75be9`; SH-03
  `3bc3f5cd29ea26040e8cedd71df71fa1f68d51c8`
- Proposed digests: SH-02 `68d84ac12cc9cb9a0370a6b7a983323a3b703027`; SH-03
  `a2531c77ce28b3dc8fcba0d733744658a9835b08`; SH-04
  `88edb191bd7603767b585add3d4a85dcbd6c922b`; SH-05
  `d6674dcefca792fb8e68a483b0c1de24fb2b662e`
- Specification status: all four are `draft`; no human approval is claimed.

## Proposed decisions and assumptions

### Confirmed

- Keep the implemented Student browse/read behavior and stable SH-02/SH-03 IDs for unchanged concepts.
- Do not add fake tests, weaken traceability, or edit SH-01/STU-01/code/tests/migrations/checker.
- SH-01-AC6/AC7 need real tests; they are not a justification to rewrite SH-01.

### Proposed

- SH-02 becomes the course/assignment Student browse read model.
- SH-03 becomes the Student available-slot read model and browse database boundary.
- SH-04 holds future course/assignment management and Lecturer projection.
- SH-05 holds future slot/booking mutation, transition, and concurrency behavior.

### Open

- Exact split approval, profile RLS, slot ID projection, and all future management/mutation decisions
  listed in SH-04/SH-05.

## Evidence and limitations

The impact record provides the complete old-to-retained/moved/split ID map, current test references,
invalidated approvals, and exact post-approval tests needed. Traceability improvement is real but not a
pass: errors fell from 32 approved criteria to two, both in unchanged SH-01. Draft warnings are expected
and do not prove implementation correctness.

An initial ad hoc ID-audit command failed because its regular expression was malformed and produced no
review result. The corrected audit passed: every SH-02–SH-05 requirement has a linked criterion, no
criterion is duplicated, and the structured handoff JSON parses.

No application/database/e2e suite was run because no code/test/runtime artifact changed. No commit, PR,
push, merge, database push, secret access, production access, or deployment occurred.

## Risks and unresolved questions

1. High — approving exact revised SH-02/SH-03 without independent challenge would bypass the material
   spec-change gate.
2. High — profile RLS may expose fields prohibited by the browse specs; human security/product decision
   required.
3. Medium — STU-01 and SH-03 disagree about course/lecturer IDs in each slot; human contract decision
   required.
4. Medium — approving revised SH-02/SH-03 before adding real retained-AC tests will make those uncovered
   warnings become CI errors, as designed.

## Next action

Coordinator assigns an independent read-only requirements challenge of the exact four draft digests and
impact map, then presents SH-02/SH-03 for teammate approval. Only after approval should developer/tester
add real retained-AC and SH-01-AC6/AC7 coverage.
