# Requirement change impact record: shared browse boundary split and accepted decisions

- Feature and requirement IDs: `SH-01-AC8`; `STU-01-R1/R4` and `STU-01-AC8/AC21`;
  `SH-02-R3/R6/R9/R12` and `SH-02-AC4/AC8/AC12/AC17`; `SH-03-R11/R17` and
  `SH-03-AC18/AC19/AC30`; `SH-04-R1/R3/R5/R7` and `SH-04-AC8/AC10`; `SH-05-R2/R6` and
  `SH-05-AC8`, plus the retained/moved IDs mapped below
- Specification paths: `workflow/specs/shared/SH-01-foundation.md`,
  `workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md`,
  `workflow/specs/shared/SH-03-slots-bookings-and-availability.md`,
  `workflow/specs/shared/SH-04-course-and-assignment-management.md`,
  `workflow/specs/shared/SH-05-slot-and-booking-mutations.md`, and
  `workflow/specs/student/STU-01-browse-available-slots.md`
- Previous team-reported approved behavior digests: SH-01
  `ba6eff99926a74423b8b41f58a7815cacab2a4a1`; STU-01
  `13fb2e0693210f4a97e75b395b167d2cf3f3d4f8`; SH-02
  `97c7288030a3aa1df604ce892cf4547497c75be9`; SH-03
  `3bc3f5cd29ea26040e8cedd71df71fa1f68d51c8`
- Previous approved canonical metadata digests: SH-01
  `451469df2a1f39233656b1c25d8aedccbd71702e`; STU-01
  `17248e77c0b9801810c3c190e925bfec62ab03b9`; SH-02
  `8e8f677d361a18a41e9b073ac189618a2b9b63b5`; SH-03
  `2f704fe55f177fe8d9a8320dc5c5ea71c91e1680`
- Independently challenged split-draft digests: SH-02
  `68d84ac12cc9cb9a0370a6b7a983323a3b703027`; SH-03
  `a2531c77ce28b3dc8fcba0d733744658a9835b08`; SH-04
  `88edb191bd7603767b585add3d4a85dcbd6c922b`; SH-05
  `d6674dcefca792fb8e68a483b0c1de24fb2b662e`
- Proposed revision digests after scoped formatting: SH-01
  `bcd180c1ea97bf5aedb71773759e14c11d5faf6c`; STU-01
  `41ff821970520bc15428ca4aaa9acc22d512f529`; SH-02
  `c81830167afe8dbef185934357d0e3043e27ac57`; SH-03
  `3521f8983c95bf55277f29a9c424b6c7179049dc`; SH-04
  `b14810a01e35bde0d5ef84e72c4f4521cc1c3fba`; SH-05
  `d8b3b8d4886c867538a9c5a5d99e6a8e9be21b66`.
- Change requester/reference: Joseph's `2026-10-18` explicit acceptance of all eight recommendations;
  coordinator task `TASK-SPEC-TRACEABILITY-DECISIONS`.
- Date: 2026-10-18
- Status: `draft`

An editable status does not authenticate approval. These material permission, projection, resource,
retention, and verification changes reset SH-01 and STU-01 to `draft`; SH-02 through SH-05 remain
`draft`. Joseph's acceptance confirms the product decisions but does not approve the generated exact
diff. Behavior-dependent test or implementation changes remain blocked until a teammate reviews the
exact revised digests.

## Behavior change

The earlier boundary split remains, but the accepted decisions also make the following material behavior
changes. Stable IDs are preserved where the same concept is clarified; `SH-01-AC8` and `SH-04-R7/AC10`
are new because the old criteria did not test those boundaries.

| Decision | Previous required or unresolved behavior                                     | Confirmed revised behavior                                                                                                                                   | Material impact                                                                             |
| -------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1        | STU-01 omitted per-slot course/Lecturer IDs while SH-03 included them        | Exact slot allowlist includes opaque `courseId` and `lecturerId`                                                                                             | STU-01 data contract and AC8 change; prior approval stale                                   |
| 2        | Active users could directly read full staff profile rows                     | Students read only their own profile row; staff discovery uses narrow active-Student RPC projections                                                         | SH-01 authorization/RLS contract changes; append-only migration and security tests required |
| 3        | “Current assignment” could be read as an ongoing endpoint invariant          | Eligibility is derived from stored current state plus active course plus active trusted Lecturer                                                             | Endpoint deactivation hides availability without rewriting assignment history               |
| 4        | Filter options were represented and deterministic but not measurably bounded | At most 200 courses and 200 Lecturers, deterministically ordered; omitted options reveal no count/existence signal                                           | RPC, validation, load, and abuse tests require revision                                     |
| 5        | `AvailableSlot` was referenced but undefined                                 | Exact eight-field slot shape with canonical UUIDs and ISO-8601 UTC timestamps ending in `Z`                                                                  | API contract and serialization acceptance evidence change                                   |
| 6        | Future retention/deletion semantics were internally unresolved               | Records with dependent/history data are archived rather than hard-deleted; terminal booking history is preserved                                             | SH-04/SH-05 retention requirements and future tests change                                  |
| 7        | SH-04 stated no AI only non-normatively                                      | Course/assignment management and Lecturer projection explicitly prohibit model calls, prompts, LLM data transfer, and AI-usage writes                        | New SH-04-R7 and SH-04-AC10                                                                 |
| 8        | Missing test coverage was merely a follow-up risk                            | Exact approval must be followed by real tests for every retained SH-02/SH-03 criterion and SH-01-AC6/AC7; placeholders/skips/checker weakening are forbidden | Approval does not make implementation or merge acceptance green                             |

### Requirement mapping

| Old ID    | Proposed mapping        | Disposition and reason                                                                   |
| --------- | ----------------------- | ---------------------------------------------------------------------------------------- |
| SH-02-R1  | SH-02-R1; SH-04-R1/R5   | Retain active browse facts; move lifecycle mutation/retention                            |
| SH-02-R2  | SH-04-R1/R6             | Move future canonical-code creation/concurrency                                          |
| SH-02-R3  | SH-02-R3; SH-04-R3      | Clarify stored current state versus derived endpoint eligibility; move mutation protocol |
| SH-02-R4  | SH-02-R4; SH-04-R3/R5   | Retain non-current read effect/preservation; move removal/retention workflow             |
| SH-02-R5  | SH-02-R5                | Retained unchanged Student catalogue eligibility                                         |
| SH-02-R6  | SH-02-R6                | Retain safe represented options and add deterministic 200-per-type caps                  |
| SH-02-R7  | SH-04-R2/R3             | Move future Administrator management                                                     |
| SH-02-R8  | SH-04-R4                | Move future Lecturer projection                                                          |
| SH-02-R9  | SH-02-R9; SH-01-AC8     | Retain Student browse boundary and explicitly deny other-profile direct reads            |
| SH-02-R10 | SH-02-R10               | Retained Student browse failures/disclosure                                              |
| SH-02-R11 | SH-02-R11               | Retained browse no-AI boundary                                                           |
| SH-02-R12 | SH-02-R12; SH-04-R6     | Split browse query bounds from management write integrity/capacity                       |
| SH-03-R1  | SH-03-R1                | Retained authoritative-time/read semantics                                               |
| SH-03-R2  | SH-03-R2; SH-05-R1      | Narrow retained read-side range invariant; move creation/overlap                         |
| SH-03-R3  | SH-05-R2                | Move future booking creation/ownership                                                   |
| SH-03-R4  | SH-05-R3                | Move future transition protocol                                                          |
| SH-03-R5  | SH-03-R5; SH-05-R4      | Retain visibility interpretation; move release/rebooking/completion mutations            |
| SH-03-R6  | SH-03-R6                | Retained availability predicate                                                          |
| SH-03-R7  | SH-03-R7; SH-05-R7      | Retain read effects/preservation; move operational resolution                            |
| SH-03-R8  | SH-05-R5                | Move future reservation/Student concurrency                                              |
| SH-03-R9  | SH-05-R6                | Move proposed slot edit/delete behavior                                                  |
| SH-03-R10 | SH-03-R10               | Retained browse input contract                                                           |
| SH-03-R11 | SH-03-R11; STU-01-R1/R4 | Define exact common slot projection and restricted profile authorization                 |
| SH-03-R12 | SH-03-R12               | Retained pagination/cursor behavior                                                      |
| SH-03-R13 | SH-03-R13               | Retained browse authorization/transport behavior                                         |
| SH-03-R14 | SH-03-R14               | Retained browse dependency failure/logging                                               |
| SH-03-R15 | SH-03-R15               | Retained browse accessibility/browser contract                                           |
| SH-03-R16 | SH-03-R16; SH-05-R9     | Split browse no-AI from mutation no-AI                                                   |
| SH-03-R17 | SH-03-R17               | Retain browse reliability and add 200-per-type option response caps                      |

### Acceptance-criterion mapping

| Old criteria    | Proposed mapping       | Disposition                                                                  |
| --------------- | ---------------------- | ---------------------------------------------------------------------------- |
| SH-02-AC1       | SH-02-AC1              | Retained                                                                     |
| SH-02-AC2       | SH-04-AC2              | Moved dependent-history preservation on deactivation                         |
| SH-02-AC3       | SH-04-AC1              | Moved canonical-code concurrency                                             |
| SH-02-AC4       | SH-02-AC4; SH-04-AC9   | Test derived eligibility/history preservation; future concurrency separately |
| SH-02-AC5       | SH-02-AC5; SH-04-AC4   | Split Student read effect from authorized removal                            |
| SH-02-AC6       | SH-04-AC5              | Moved removal-with-booking preservation                                      |
| SH-02-AC7/AC8   | SH-02-AC7/AC8          | Retain eligibility; AC8 adds deterministic 200-option cap behavior           |
| SH-02-AC9/AC10  | SH-04-AC3/AC6          | Moved Administrator mutation/refusal                                         |
| SH-02-AC11      | SH-04-AC7              | Moved Lecturer projection                                                    |
| SH-02-AC12–AC17 | SH-02-AC12–AC17        | Retained; AC12 adds profile denial and AC17 adds measurable option envelope  |
| SH-03-AC1/AC2   | SH-03-AC1/AC2          | Retained                                                                     |
| SH-03-AC3       | SH-03-AC3; SH-05-AC1   | Narrow read-side invalid-range criterion; move creation validation           |
| SH-03-AC4–AC7   | SH-05-AC2–AC5          | Move overlap, booking ownership, and transitions                             |
| SH-03-AC8       | SH-03-AC8; SH-05-AC9   | Split read eligibility from future rebooking mutation                        |
| SH-03-AC9       | SH-03-AC9; SH-05-AC10  | Split read hiding from completion/rebooking mutation                         |
| SH-03-AC10–AC12 | SH-03-AC10–AC12        | Retained                                                                     |
| SH-03-AC13–AC15 | SH-05-AC6–AC8          | Move future concurrency and slot edit/delete                                 |
| SH-03-AC16–AC28 | SH-03-AC16–AC28        | Retained; AC18/19 now prove exact wire shape and profile boundary            |
| SH-03-AC29      | SH-03-AC29; SH-05-AC13 | Split browse and mutation no-AI checks                                       |
| SH-03-AC30      | SH-03-AC30             | Retained with explicit 20/200/200 response envelope                          |

### Additional decision mappings

| Source or gap                     | Revised mapping                     | Disposition                                                                    |
| --------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| Prior SH-01 staff-read permission | SH-01 permissions and new SH-01-AC8 | Materially restrict Student direct profile access; preserve own-profile access |
| STU-01-R1/R4 and STU-01-AC8       | Same IDs                            | Add approved course/Lecturer IDs and exact shared wire allowlist               |
| SH-04 retention ambiguity         | SH-04-R1/R5 and SH-04-AC8           | Archive rather than hard-delete after dependency/history; preserve records     |
| SH-05 retention ambiguity         | SH-05-R2/R6 and SH-05-AC8           | Preserve every booking and any slot with booking history                       |
| SH-04 no-AI traceability gap      | New SH-04-R7 and SH-04-AC10         | Make management/projection no-AI behavior normative and testable               |

## Decisions and assumptions

- Confirmed by Joseph: all eight decisions in the behavior-change table, including no fake/empty/
  skipped coverage and no checker weakening.
- Confirmed evidence: STU-01 AC1–AC22 currently have test references, but materially revised AC8 must be
  re-evaluated against the final exact contract; a reference is not proof that a test passes.
- Confirmed evidence: SH-01-AC6 appears only in `it.todo`; SH-01-AC7 has no test. Both require real
  executable coverage after exact specification approval. New SH-01-AC8 also requires real security
  coverage before implementation acceptance.
- Proposed: exact physical schema/function names, archival representation, and indexes remain
  implementation proposals unless separately fixed by a requirement.
- Unresolved: future SH-04/SH-05 validation bounds, role APIs, retention duration, never-used deletion,
  lifecycle workflow, idempotency, capacity, and latency remain out of implementation authority.

## Impact map

| Area                            | Affected paths/contracts/IDs                                 | Required follow-up                                                                                                | Owner                | Status  |
| ------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------- | ------- |
| Application code                | Existing STU-01 browse implementation                        | Align exact projection and 200-option contract only after approval                                                | Developer            | blocked |
| Acceptance/unit tests           | Retained SH-02/SH-03 ACs; SH-01-AC6–AC8; revised STU-01-AC8  | Add/strengthen real executable tests; no todo/skip placeholders                                                   | Developer/tester     | blocked |
| Data model/migrations/integrity | Existing initial migration plus uncommitted STU-01 migration | Add a new append-only RLS migration after approval; preserve own-profile access and test derived eligibility/caps | Shared team/security | blocked |
| APIs/actions/providers          | Student browse RPC and exact wire contract                   | Cap/filter projections and validate exact fields/UTC serialization                                                | Developer/tester     | blocked |
| UI/content/accessibility        | `/student/slots`; SH-03-AC28                                 | Complete authenticated/manual/cross-browser verification                                                          | Tester/human         | pending |
| Security/privacy/AI boundaries  | SH-01 profile access; SH-02-R9–R11; SH-03-R11–R16; SH-04-R7  | Independent security review of RLS/projection and no-AI tests                                                     | Security/human       | blocked |
| Guides/logs/operations          | Specs, impact record, handoff, Joseph log                    | Review exact digests and record authenticated approval evidence                                                   | Coordinator/human    | pending |

## Current tests and real follow-up tests

Existing implementation tests reference SH-02 AC4/12/15/16 and SH-03 AC10/16–22/24–27/29/30. Those
references are evidence only; some combined assertions may not prove every full criterion and require
independent verification. After renewed approval, the developer/tester must add or strengthen real tests
for retained uncovered criteria, including:

- SH-02 active/inactive option visibility, non-current assignment behavior, no-enrolment equality,
  derived endpoint eligibility without history mutation, 200-option projection/order/non-disclosure,
  function metadata, indistinguishable failures, and query-plan review.
- SH-03 Singapore boundary/browser-clock authority, invalid stored ranges, rejected/cancelled/completed
  read semantics, lifecycle preservation, exact eight-field UTC wire serialization, 20/200/200 response
  envelope, metadata inspection, point-in-time page changes, wrong-role browser routing, and manual/
  cross-browser accessibility.
- SH-01-AC6: execute quota cases below/at each per-user-minute, per-user-day, and global-minute limit,
  asserting typed reason/retry time; `it.todo` is not coverage.
- SH-01-AC7: mock timeout, rate limit, and provider error from `generateText`, asserting typed failures
  and no thrown exception.
- SH-01-AC8/STU-01-AC21: prove own-profile access remains, all other Student profile-row reads are
  denied, the narrow RPC still works for an active Student, and protected fields remain unavailable.

SH-04/SH-05 tests wait until those future specs resolve open decisions and receive human approval.
When those features are selected, tests must also cover archival/history invariants and SH-04-AC10's
no-AI boundary.

## Invalidated evidence

- Team-reported SH-01, SH-02, SH-03, and STU-01 approval recorded in
  `workflow/handoffs/archive/stu-01/2026-10-18-team-spec-approval-requirements-architect.md` is stale for all four
  revised canonical specs and does not approve SH-04/SH-05.
- The prior SH-01/STU-01/SH-02/SH-03 review statements and digests in implementation handoffs/logs no
  longer establish current-spec approval.
- The transactional pgTAP failure for direct profile access remains factual evidence that current RLS
  conflicts with the confirmed decision; it is not evidence that a future migration passes.
- Existing STU-01 projection tests already expect course/Lecturer IDs, but they predate this exact
  revised spec and do not prove 200-option caps, new RLS, or complete retained-criterion coverage.
- All prior test results remain factual current-state evidence only and must be re-evaluated against the
  revised AC text after approval.

## Approval renewal

- Specification review required: independent challenge of these revisions and teammate approval of the
  exact SH-01/STU-01/SH-02/SH-03 digests; SH-04/SH-05 remain future drafts pending their other decisions.
- Sensitive-change review required: no sensitive implementation changed here; a later append-only RLS/
  function/migration change requires independent security and human/CODEOWNER review.
- Data/API consumer sign-off required: Student owner and shared/CODEOWNER review of the exact slot and
  option projections.
- Other human decision: none for challenge findings 1–8; remaining SH-04/SH-05 questions are explicitly
  out of the Student browse implementation slice.

## Ordered follow-up

1. Independently challenge the revised exact SH-01/STU-01/SH-02/SH-03 digests and record teammate
   approval or requested changes; do not treat Joseph's decision acceptance as exact-diff approval.
2. After exact approval, add real retained-criterion tests plus SH-01-AC6/AC7/AC8 coverage; do not use
   placeholder/todo/skip tests or weaken `check:spec`.
3. Then implement the append-only RLS repair and 200-option/exact-contract alignment under bounded
   developer scope, followed by independent functional and security verification.
4. Keep SH-04/SH-05 implementation blocked until their remaining role/API decisions and exact drafts
   are independently reviewed and approved.

Linked implementation task or PR: none; no commit or PR was created.
