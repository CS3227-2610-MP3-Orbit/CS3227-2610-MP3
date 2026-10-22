# Shared specification traceability revision log

- Date: 2026-10-18
- Owner: Joseph
- Task: `TASK-SPEC-TRACEABILITY-SPLIT`
- Role: requirements architect
- Generated summary status: awaiting independent human verification and approval
- Repository baseline: `e5893b28a6d898bdfb698dcb7f48e293ab373e7b` with pre-existing uncommitted
  STU-01/spec/workflow changes preserved
- Commit/PR/merge/deploy: none created or attempted

## Purpose

Correct the structural cause of `npm run check:spec` without inserting empty tests, relabelling unrelated
tests, weakening the checker, or silently removing approved behavior. The prior approved SH-02/SH-03
documents mixed the current Student browse slice with future course management, Lecturer slot mutation,
and booking state/concurrency work.

## Artifacts

| Artifact                                                                                         | Result                                                                  |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md`                                | Reset to draft; narrowed to Student course/assignment browse read model |
| `workflow/specs/shared/SH-03-slots-bookings-and-availability.md`                                 | Reset to draft; narrowed to Student available-slot browse/read contract |
| `workflow/specs/shared/SH-04-course-and-assignment-management.md`                                | New draft preserving future course/assignment management behavior       |
| `workflow/specs/shared/SH-05-slot-and-booking-mutations.md`                                      | New draft preserving future slot/booking mutation behavior              |
| `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-impact.md`                          | Old-to-new ID/evidence/test/approval impact map                         |
| `workflow/handoffs/archive/stu-01/2026-10-18-shared-spec-traceability-requirements-architect.md` | Role handoff and actual verification evidence                           |

Final spec digests prepared for review:

- SH-02: `68d84ac12cc9cb9a0370a6b7a983323a3b703027`
- SH-03: `a2531c77ce28b3dc8fcba0d733744658a9835b08`
- SH-04: `88edb191bd7603767b585add3d4a85dcbd6c922b`
- SH-05: `d6674dcefca792fb8e68a483b0c1de24fb2b662e`

## Traceability evidence

Before the revision, `npm run check:spec` reported 14 specs, 139 criteria, 52 covered, and 32 approved
criteria errors: SH-01-AC6/AC7 plus 30 uncovered broad SH-02/SH-03 criteria.

After the revision, it reported 16 specs, 148 criteria, 52 covered, and only two approved-criterion
errors: SH-01-AC6 and SH-01-AC7. Uncovered SH-02–SH-05 criteria are warnings because the materially
revised/new documents correctly remain draft pending review. This is not a fully passing result.

SH-01 was not changed by this task. `SH-01-AC6` appears only in four `it.todo` cases in
`src/lib/ai/quota.test.ts`; `SH-01-AC7` has no test reference. They require real developer/tester
coverage of quota reasons/retry timing and typed provider failures after the applicable test task is
approved.

## Decisions preserved and decisions still required

- Preserved: existing Student browse behavior and stable SH-02/SH-03 IDs where the concept remains in
  the current read slice.
- Proposed for review: the exact split and new SH-04/SH-05 identifiers.
- Not decided: staff-profile RLS versus browse data minimization; whether course/lecturer IDs belong in
  each slot projection; future bounds, retention, lifecycle workflows, and mutation contracts.
- Approval effect: prior SH-02/SH-03 approval is stale; this user request is not recorded as approval of
  the exact generated diff.

## Actual checks

| Check                                            | Actual result                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Initial scoped `prettier --check`                | Failed for the four drafted spec paths; Prettier was applied only to authorized changed paths |
| Final scoped `prettier --check`                  | Passed: all seven authorized artifacts matched Prettier                                       |
| `npm run check:spec`                             | Failed: two remaining approved errors, SH-01-AC6 and SH-01-AC7; broad-scope errors eliminated |
| Requirement/AC self-review                       | Passed: each normative requirement in SH-02–SH-05 has a linked acceptance criterion           |
| `git diff --check` on authorized artifacts       | Passed before final log/handoff creation; final result recorded in handoff                    |
| Application/unit/database/end-to-end test suites | Not run; specification-only task changed no application, test, migration, or runtime behavior |

The first ad hoc automated ID-audit command failed because its regular expression was malformed and
therefore produced no review result. The corrected audit passed with no unlinked requirement and no
duplicate criterion: SH-02 9 requirements/11 criteria; SH-03 13/23; SH-04 6/9; SH-05 9/13. The handoff
JSON also parsed successfully.

## Next action

Assign an independent requirements challenge, then obtain teammate approval of the exact SH-02/SH-03
digests. After approval, add genuine retained-criterion tests plus SH-01-AC6/AC7 tests; do not implement
SH-04/SH-05 until their open decisions and role contracts are separately approved.
