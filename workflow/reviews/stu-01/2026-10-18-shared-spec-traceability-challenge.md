# Specification challenge record: shared-spec traceability split

- Feature and requirement IDs: `SH-02-R1`, `SH-02-R3–R6`, `SH-02-R9–R12`,
  `SH-02-AC1/AC4/AC5/AC7/AC8/AC12–AC17`; `SH-03-R1/R2/R5–R7/R10–R17`,
  `SH-03-AC1–AC3/AC8–AC12/AC16–AC30`; `SH-04-R1–R6/AC1–AC9`;
  `SH-05-R1–R9/AC1–AC13`
- Draft spec paths: `workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md`,
  `workflow/specs/shared/SH-03-slots-bookings-and-availability.md`,
  `workflow/specs/shared/SH-04-course-and-assignment-management.md`, and
  `workflow/specs/shared/SH-05-slot-and-booking-mutations.md`
- Draft content digests: SH-02 `68d84ac12cc9cb9a0370a6b7a983323a3b703027`; SH-03
  `a2531c77ce28b3dc8fcba0d733744658a9835b08`; SH-04
  `88edb191bd7603767b585add3d4a85dcbd6c922b`; SH-05
  `d6674dcefca792fb8e68a483b0c1de24fb2b662e`
- Original request/reference: coordinator task `TASK-SPEC-TRACEABILITY-SPLIT-CHALLENGE` and change
  task `TASK-SPEC-TRACEABILITY-SPLIT`
- Shared constraints reviewed: `AGENTS.md`, feature-specification skill, development-security and
  approval-gate policies, prior team-reported approval handoff, change-impact record, approved
  `STU-01`, current implementation/migration/tests, tester/coordinator handoffs, and the prior SH-02 and
  SH-03 behavior digests
- Review type: `independent`
- Reviewer or agent: requirements architect `/root/traceability_split_challenge`
- Date: 2026-10-18

This is challenge evidence, not human approval. The split correctly resets all four specifications to
`draft` and explicitly invalidates the prior SH-02/SH-03 approval. The ID map is mechanically complete:
no old SH-02/SH-03 requirement or acceptance-criterion ID is left without a retained, moved, or split
mapping, and no new criterion ID is duplicated. Those strengths do not resolve the blockers below.

## Independently derived scenarios

- Happy path: an active Student receives no more than 20 future eligible slots plus represented safe
  filter options; the read changes no row and makes no AI call.
- Invalid input: repeated, array, unknown, malformed, and oversized filter/cursor input reaches no slot
  query and returns only the safe validation shape.
- Role/ownership: signed-out, inactive, Lecturer, and Administrator callers cannot obtain the Student
  RPC result; Student credentials cannot read protected feature or profile fields directly.
- Lifecycle edge: an assignment is validly created and then its course or lecturer becomes inactive
  without the assignment row being made non-current.
- Projection edge: the RPC returns `courseId` and `lecturerId`; all SH-03 criteria pass while STU-01-AC8
  still fails because STU-01-R1 does not allow those IDs in each returned slot.
- Resource edge: one million represented course/lecturer options accompany a 20-row page; the page-size
  and set-based-plan criteria pass while the response is not bounded.
- Dependency failure: database failure after prior successful results clears stale rows, retains only
  validated filters, and exposes neither raw database detail nor private values in logs.
- Concurrency: same-slot and overlapping-Student booking races remain deferred to SH-05 and cannot be
  inferred as implemented merely because browse hides an already reserved slot.
- Retention edge: a slot has only rejected/cancelled history and a Lecturer deletes it; SH-05-R2 says
  terminal history is preserved while SH-05-R6 says its treatment is unresolved.
- AI-abuse: stored display text containing prompt-like instructions remains plain text and reaches no
  model, prompt, tool, or AI-usage record.

## Findings

| #   | Severity | Affected requirement/AC                                                                   | Counterexample or question                                                                                                                                                                                                                                                                                                                                                                                                                | Why it matters                                                                                                                                                                                                                 | Proposed clarification                                                                                                                                                                                                                | Human input needed                                                                                                                                              | Disposition                                                                                           |
| --- | -------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | High     | `SH-03-R11`, `SH-03-AC18`, `STU-01-R1`, `STU-01-AC8`                                      | SH-03 requires every slot to contain course and lecturer IDs, while STU-01 allows only course code/name, lecturer display name, times, and slot ID. The current RPC and server schema return both extra IDs. `SH-03-AC18` can pass while `STU-01-AC8` fails.                                                                                                                                                                              | The shared API contract and its approved consumer disagree about permitted disclosure; the split calls the conflict separate but still asks for SH-03 approval.                                                                | **Proposal:** resolve the consumer projection first, then revise either STU-01 or SH-03 through a material change record and test the exact allowlist.                                                                                | Product/data owner must decide whether per-slot course and lecturer IDs are permitted.                                                                          | Open; blocks SH-03 approval.                                                                          |
| 2   | High     | `SH-02-R9`, `SH-03-R11`, `SH-03-AC19`, `STU-01-R4`, `STU-01-AC21`, `SH-01` profile policy | An authenticated Student can select staff `profiles.created_at` under the existing “active users read staff” policy. The feature-table privilege assertion can pass and the RPC can be narrow while protected profile audit fields remain directly readable; the independent pgTAP assertion already demonstrates this failure.                                                                                                           | The revised browse boundary prohibits audit/contact disclosure but neither resolves the existing shared policy nor makes profile-table coverage explicit enough to prevent a narrow interpretation of “underlying tables.”     | **Proposal:** explicitly include the `profiles` direct-read boundary in SH-03-R11/AC19, then separately revise SH-01/RLS or approve a least-field profile projection.                                                                 | Shared auth/security owner must choose the authorized staff-profile surface.                                                                                    | Open; blocks SH-02/SH-03 security acceptance.                                                         |
| 3   | High     | Retained SH-02/SH-03 ACs and `npm run check:spec` lifecycle                               | With only SH-02 and SH-03 treated as approved, 17 of their 34 retained criteria have no real test: SH-02 AC1/5/7/8/13/14/17 and SH-03 AC1/2/3/8/9/11/12/20/23/28.                                                                                                                                                                                                                                                                         | Renewed approval would correctly turn all 17 draft warnings into errors. The split improves the count but does not make traceability green; current checker failure also retains SH-01-AC6/AC7.                                | **Proposal:** describe approval as specification approval only, keep implementation/merge acceptance incomplete, and assign real tests for all 17 retained criteria immediately after exact-digest approval.                          | Coordinator/human must accept the deliberate red interval or require test preparation in the same reviewed change without treating tests as approval authority. | Open; not a reason to fake coverage, but blocks any claim that approval restores a passing lifecycle. |
| 4   | Medium   | `SH-02-R3`, `SH-02-AC4`, `SH-03-R6`, `SH-04-R1/R3`                                        | A valid current assignment is created, then its course is deactivated without changing the assignment row. AC4 still passes. Revised R3 now states that a current assignment links an active course/lecturer as an ongoing invariant, whereas the prior R3 limited endpoint validation to creation/reactivation.                                                                                                                          | This is a semantic strengthening hidden inside a “retained” ID, and the current trigger enforces only insert/update of the assignment. Browse still hides the slot through separate joins, so tests may miss the R3 violation. | **Proposal:** state whether “current” is a stored flag whose endpoints are validated only on create/reactivate, or a derived eligibility concept that becomes false when an endpoint is inactive; map the lifecycle test accordingly. | Shared data owner must choose the invariant and required deactivation behavior.                                                                                 | Open; blocks treating SH-02-R3 as unchanged.                                                          |
| 5   | Medium   | `SH-02-R6/R12`, `SH-02-AC8/AC17`, `SH-03-R17`, `SH-03-AC30`                               | A response can contain 20 slots and an unbounded number of represented course/lecturer options. AC30 and a set-based query-plan inspection pass even if the response contains one million options; the current RPC aggregates every qualifying option.                                                                                                                                                                                    | “Bounded option retrieval” and “bounded disclosure” are not measurable while exact catalogue capacity is unresolved. This leaves availability scraping and response amplification undefined.                                   | **Proposal:** approve a maximum option/result envelope or a measurable catalogue bound, or explicitly classify option volume as unresolved and remove the claim that the full response is bounded.                                    | Product/operations owner must choose the bound or accept an explicitly unbounded catalogue projection.                                                          | Open; blocks full implementation readiness of the browse boundary.                                    |
| 6   | Medium   | `SH-03-R1/R11`, `SH-03-AC1/AC2/AC18`, `STU-01` timestamp contract                         | The revised API references `AvailableSlot[]` but no longer defines `AvailableSlot`; R1 requires `timestamptz` instants but no retained AC verifies the approved ISO-8601 serialization. A locale-dependent timestamp string could satisfy the date-bound and browser-clock criteria.                                                                                                                                                      | The main browse response is not a complete internal API contract, and a retained observable serialization requirement is orphaned from acceptance evidence.                                                                    | **Proposal:** define or normatively reference the exact slot shape and instant serialization, then add an acceptance assertion for it.                                                                                                | Data/API consumer and shared owner must confirm the canonical wire shape.                                                                                       | Open; blocks SH-03 implementation-ready status.                                                       |
| 7   | Medium   | `SH-04-R1/R5`, `SH-05-R2/R6`, `SH-05-AC8`                                                 | Old SH-02 proposed refusing hard deletion after dependent history; SH-04 now makes hard deletion wholly unresolved. Old SH-03 proposed preserving rejected/cancelled history even if a slot is not reused; SH-05-R2 still confirms preserved history while R6 makes its treatment unresolved. AC8 says only a valid unbooked edit/delete succeeds but no longer enumerates stale, overlap, completed-history, and terminal-history cases. | These are changed or internally ambiguous retention semantics, not a lossless move. The broad AC8 can pass with only one “booked” fixture while material old cases remain untested.                                            | **Proposal:** record the classification changes explicitly in the impact table, reconcile R2/R6, and restore enumerated edit/delete cases after the retention decision.                                                               | Human product/data owner must decide deletion and terminal-history retention; SH-04/SH-05 must remain draft meanwhile.                                          | Open; does not block read-only browse by itself, but disproves a fully lossless future-behavior move. |
| 8   | Medium   | `SH-04` no-AI boundary and traceability                                                   | SH-04 states “No AI is used or permitted” for management but has no normative no-AI requirement or linked acceptance criterion. SH-02-R11/AC16 now cover browsing/filter options only. Course/assignment mutations or Lecturer assignment lookup could call a model while every SH-02 and SH-04 AC passes.                                                                                                                                | A security boundary from the broad course/assignment contract is orphaned when management moves out.                                                                                                                           | **Proposal:** add a future SH-04 no-AI requirement/criterion, or explicitly map why the prior no-AI rule never applied to management/own-assignment projection.                                                                       | Human reviewer must confirm the intended no-AI scope; no product behavior should be invented by this challenge.                                                 | Open; blocks claiming complete future-scope traceability.                                             |

## Challenge checklist

- [x] Scope, non-goals, dependencies, and source-of-truth hierarchy are unambiguous.
- [x] Confirmed requirements, proposed assumptions, and unresolved decisions are distinct.
- [ ] Requirements are observable, internally consistent, and testable.
- [ ] Actor, role, ownership, authorization order, and data visibility boundaries are complete.
- [x] Inputs, outputs, trust boundaries, validation, and safe logging are defined, except for the
      incomplete `AvailableSlot` wire shape in finding 6.
- [ ] Empty, invalid, conflict, concurrency, dependency, quota, and recovery paths are covered.
- [ ] Resource bounds and abuse cases are proportionate and measurable.
- [x] AI context, injection, output, disclosure, capability, and side-effect boundaries are covered for
      SH-02/SH-03/SH-05; SH-04 remains incomplete under finding 8.
- [ ] Acceptance criteria could not pass while a material part of user intent is violated.
- [x] Verification methods distinguish deterministic tests, manual checks, and live-model evaluations.
- [x] The read/mutation split is proportionate; unresolved future APIs correctly remain outside browse.
- [x] Material open findings and required renewed approvals are explicit.

## Readiness recommendation

- Recommendation: `not ready`
- Blocking findings: findings 1–6 block approval or implementation-ready treatment of revised SH-02/
  SH-03; findings 7–8 block a claim that SH-04/SH-05 received every future behavior without semantic or
  traceability ambiguity.
- Residual risks: team-reported prior approval lacks independently authenticated external review;
  manual/cross-browser accessibility and controlled between-page behavior remain unverified; the current
  migration is uncommitted and sensitive.
- Required human decisions: per-slot ID projection, authorized staff-profile surface, assignment-current
  semantics after endpoint deactivation, option/capacity bound, exact slot wire shape, and future
  deletion/history/no-AI scope.
- Next review step: revise the impact/spec drafts to disposition findings 1–8, preserve all four as
  `draft`, then rerun an independent challenge of the new exact digests before teammate approval.
