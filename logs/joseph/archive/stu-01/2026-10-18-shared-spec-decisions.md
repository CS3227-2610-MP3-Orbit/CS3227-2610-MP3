# Shared specification decision revision log

- Date: 2026-10-18
- Owner: Joseph
- Task: `TASK-SPEC-TRACEABILITY-DECISIONS`
- Role: requirements architect
- Generated summary status: awaiting independent exact-digest challenge and teammate approval
- Repository baseline: `e5893b28a6d898bdfb698dcb7f48e293ab373e7b` with pre-existing uncommitted
  application, test, migration, specification, and workflow changes preserved
- Commit/PR/merge/deploy: none created or attempted

## Confirmed input and scope

Joseph explicitly accepted all eight recommendations: per-slot course/Lecturer IDs; narrow Student staff
projections; derived assignment eligibility; 200 course and 200 Lecturer option caps; the exact UTC slot
wire shape; archive-over-delete after dependent/history records; a no-AI course/assignment-management
boundary; and real post-approval test coverage without placeholder tests or checker weakening.

This task revised specifications and review evidence only. It did not edit application code, tests,
migrations, plans, the traceability checker, CI, policies, hooks, or deployment configuration. Decision
acceptance confirms product intent but is not recorded as approval of the exact generated diff.

## Current implementation versus planned work

Current-state inspection found an uncommitted Student browse page, server boundary, RPC/migration, unit
tests, pgTAP tests, and Playwright coverage. The implementation already returns the accepted eight slot
fields and uses derived endpoint joins. It does not cap option lists at 200, and the existing broad
staff-profile RLS policy permits direct Student reads that conflict with the confirmed narrow boundary.

After exact specification approval, planned work is to add real acceptance/security coverage first,
then add a new append-only migration and bounded implementation changes. The existing initial migration
must not be edited. SH-04/SH-05 mutation implementation remains out of scope until their separate open
role/API decisions are resolved and approved.

## Artifacts and exact review digests

| Artifact                                                                                      | Draft digest or purpose                                                                                               |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `workflow/specs/shared/SH-01-foundation.md`                                                   | `bcd180c1ea97bf5aedb71773759e14c11d5faf6c`; resets prior approval and defines Student own-profile/narrow-RPC boundary |
| `workflow/specs/student/STU-01-browse-available-slots.md`                                     | `41ff821970520bc15428ca4aaa9acc22d512f529`; resets prior approval and permits the exact eight-field slot projection   |
| `workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md`                             | `c81830167afe8dbef185934357d0e3043e27ac57`; derived eligibility and bounded safe options                              |
| `workflow/specs/shared/SH-03-slots-bookings-and-availability.md`                              | `3521f8983c95bf55277f29a9c424b6c7179049dc`; exact wire/profile boundary and 20/200/200 envelope                       |
| `workflow/specs/shared/SH-04-course-and-assignment-management.md`                             | `b14810a01e35bde0d5ef84e72c4f4521cc1c3fba`; archive/history and new no-AI requirement/criterion                       |
| `workflow/specs/shared/SH-05-slot-and-booking-mutations.md`                                   | `d8b3b8d4886c867538a9c5a5d99e6a8e9be21b66`; booking/slot history preservation                                         |
| `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-impact.md`                       | Updated behavior, evidence, migration, test, and approval impact                                                      |
| `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-disposition.md`                  | Disposes all eight independent challenge findings without claiming approval                                           |
| `workflow/handoffs/archive/stu-01/2026-10-18-shared-spec-decisions-requirements-architect.md` | Structured role handoff and actual verification evidence                                                              |

All six canonical specifications are `draft`. Prior approved behavior/canonical digests remain recorded
in their document control or the impact record.

## Actual checks

| Check                                              | Actual result                                                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial scoped `prettier --check` before edits     | Passed for all seven then-existing authorized specification/review paths                                                                                |
| Scoped Prettier write                              | Completed only on the eight authorized changed/new specification and review paths                                                                       |
| First ad hoc ID/link audit                         | Failed before evaluating content because its inline regular expression was malformed                                                                    |
| Corrected ID/link audit                            | Passed: 133 unique requirement/criterion definitions; every SH-02–SH-05 requirement has an AC parent link; all referenced workflow Markdown paths exist |
| `npm run check:spec`                               | Passed: 16 specs, 150 criteria, 52 covered; uncovered draft criteria remain warnings, including SH-01-AC6/AC7/AC8 and retained SH-02/SH-03 work         |
| Scoped `git diff --check` before final log/handoff | Passed with no whitespace errors                                                                                                                        |

No application, unit, database, or end-to-end test suite was run because this task changed only draft
specifications and review evidence. The final scoped formatting and diff checks are recorded in the role
handoff.

## Approval and next action

Assign a fresh independent requirements challenge for the six exact digests above, focusing approval on
SH-01/STU-01/SH-02/SH-03 for the Student browse slice. After teammate exact-digest approval, revise tests
before code. Do not treat a passing draft-only traceability check as implementation acceptance.
