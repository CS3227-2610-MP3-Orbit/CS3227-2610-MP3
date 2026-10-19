# Specification challenge disposition: shared-spec traceability decisions

- Task: `TASK-SPEC-TRACEABILITY-DECISIONS`
- Date: 2026-10-18
- Decision authority: Joseph explicitly accepted all eight coordinator recommendations in the project
  conversation.
- Source challenge: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-challenge.md`
- Change-impact record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-impact.md`
- Reviewed baseline: `e5893b28a6d898bdfb698dcb7f48e293ab373e7b` plus the preserved uncommitted
  implementation/specification work identified in the prior coordinator handoff.
- Revised specification digests after scoped formatting: SH-01
  `bcd180c1ea97bf5aedb71773759e14c11d5faf6c`; STU-01
  `41ff821970520bc15428ca4aaa9acc22d512f529`; SH-02
  `c81830167afe8dbef185934357d0e3043e27ac57`; SH-03
  `3521f8983c95bf55277f29a9c424b6c7179049dc`; SH-04
  `b14810a01e35bde0d5ef84e72c4f4521cc1c3fba`; SH-05
  `d8b3b8d4886c867538a9c5a5d99e6a8e9be21b66`.
- Status: `draft`

This record explains how each independent finding was handled. Joseph's acceptance confirms the eight
product/process decisions; it does not authenticate or approve the exact generated specification diff.
SH-01, STU-01, SH-02, and SH-03 require a fresh independent exact-digest challenge and teammate approval
before tests or implementation change. SH-04 and SH-05 remain future drafts with additional open role/API
decisions.

## Finding dispositions

| Finding                               | Severity | Accepted decision                                                                                                                                       | Specification disposition                                                                                                                                | Evidence impact                                                                                                                                                        | Status                                                             |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1 — per-slot ID conflict              | High     | Permit opaque `courseId` and `lecturerId` in each slot                                                                                                  | STU-01-R1/R4 and AC8 now use the same exact eight-field allowlist as SH-03-R11/AC18                                                                      | Prior STU-01 approval is stale; existing projection tests must be re-evaluated against the revised exact contract                                                      | Resolved in draft; exact-digest review pending                     |
| 2 — direct staff-profile disclosure   | High     | Students directly read only their own profile; staff discovery uses narrow safe RPC projections                                                         | SH-01 adds the Student profile boundary and AC8; SH-02-R9/AC12 and SH-03-R11/AC19 cover other-profile denial and narrow projection                       | Existing broad profile RLS and its passing auth evidence are stale for Student staff reads; a new append-only migration and security tests are required after approval | Resolved in draft; sensitive implementation blocked                |
| 3 — incomplete approved-spec coverage | High     | After exact approval, use real tests for every retained SH-02/SH-03 criterion and SH-01-AC6/AC7; no placeholder/todo/skip coverage or checker weakening | Recorded as an approval/implementation gate rather than fabricated product tests; new SH-01-AC8 and revised STU-01-AC8 also require genuine verification | Current `check:spec` failure remains truthful; approval alone cannot make implementation or merge acceptance green                                                     | Resolved as process decision; test work blocked pending approval   |
| 4 — assignment-current ambiguity      | Medium   | Eligibility is derived from stored current assignment plus active course plus active trusted Lecturer                                                   | SH-02-R3/AC4 and SH-04-R3 distinguish stored state, query-time eligibility, and history preservation                                                     | Existing creation-time endpoint trigger is not evidence of ongoing eligibility integrity; read/lifecycle tests must cover deactivation without assignment mutation     | Resolved in draft; exact-digest review pending                     |
| 5 — unbounded filter options          | Medium   | Cap courses at 200 and Lecturers at 200 with deterministic ordering                                                                                     | SH-02-R6/R12/AC8/AC17 and SH-03-R11/R17/AC30 define order, caps, and omission without counts/truncation/existence signals                                | Current RPC aggregates all represented options and requires later bounded implementation/test change                                                                   | Resolved in draft; implementation blocked pending approval         |
| 6 — incomplete slot wire contract     | Medium   | Use the existing exact eight-field slot shape with ISO-8601 UTC timestamps                                                                              | SH-03-R11 defines `AvailableSlot`; SH-03-AC18 and STU-01-AC8 verify exact fields, canonical UUIDs, and UTC strings ending in `Z`                         | Locale-dependent or extra-field responses cannot satisfy the revised criteria; existing tests require exact-contract review                                            | Resolved in draft; exact-digest review pending                     |
| 7 — retention/history ambiguity       | Medium   | Archive rather than hard-delete after dependent/history records exist; preserve terminal history                                                        | SH-04-R1/R5/AC8 and SH-05-R2/R6/AC8 preserve dependent records, all bookings, and slots with booking history                                             | Prior broad delete/edit evidence is stale; never-used deletion and retention duration remain future explicit questions                                                 | Resolved for history cases; future API decisions remain open       |
| 8 — SH-04 no-AI gap                   | Medium   | Prohibit AI/model calls and AI-usage writes for course/assignment management and Lecturer projection                                                    | New SH-04-R7/AC10 makes the boundary normative and testable                                                                                              | Future SH-04 implementation requires deterministic no-provider and no-usage evidence                                                                                   | Resolved in draft; SH-04 approval still blocked by other questions |

## Confirmed security and data boundaries

- Student identity and role come from trusted session/database state, never client fields.
- A Student keeps direct access to their own profile row only; the decision does not invent Lecturer or
  Administrator profile permissions.
- Narrow Student RPCs return only approved feature projections and cannot be used as a general profile,
  course, assignment, slot, or booking reader.
- Omitted filter options do not expose totals, truncation, existence, or a different failure shape.
- Browsing, course/assignment management, and their projections make no model call, prompt, LLM data
  transfer, model-authorized decision, or AI-usage write.
- Any RLS, function, grant, or migration repair is sensitive and must use a new append-only migration
  with independent security and human review.

## Remaining questions outside the Student browse slice

1. SH-04 still needs field bounds/normalization, used-code rename rules, retention duration, never-used
   deletion, exact Administrator/Lecturer APIs, lifecycle workflow, capacity, and latency decisions.
2. SH-05 still needs slot/text bounds, cancellation cutoff, retention duration, archival representation,
   never-used-slot deletion, lifecycle workflow, exact role APIs, idempotency, capacity, and latency.
3. These questions keep SH-04/SH-05 in draft but do not reopen challenge findings 1–8 for the bounded
   Student browse contract.

## Approval gate

The next reviewer must inspect the exact revised digests, this disposition, the impact record, and the
original challenge. A teammate other than the spec author may approve or request changes. Only after
exact approval may tests change, followed by implementation; no application code, tests, migrations,
checker, CI, or policy files were modified in this task.
