# Specification challenge record: shared-spec decisions exact drafts

- Feature and requirement IDs: `SH-01-AC8`; `STU-01-R1–R8`, `STU-01-AC1–AC22`;
  `SH-02-R1/R3–R6/R9–R12`, `SH-02-AC1/AC4/AC5/AC7/AC8/AC12–AC17`;
  `SH-03-R1/R2/R5–R7/R10–R17`, `SH-03-AC1–AC3/AC8–AC12/AC16–AC30`;
  `SH-04-R1–R7`, `SH-04-AC1–AC10`; `SH-05-R1–R9`, `SH-05-AC1–AC13`
- Draft spec paths: `workflow/specs/shared/SH-01-foundation.md`,
  `workflow/specs/student/STU-01-browse-available-slots.md`, and `workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md`
  through `workflow/specs/shared/SH-05-slot-and-booking-mutations.md`
- Draft content digests: SH-01 `bcd180c1ea97bf5aedb71773759e14c11d5faf6c`; STU-01
  `41ff821970520bc15428ca4aaa9acc22d512f529`; SH-02
  `c81830167afe8dbef185934357d0e3043e27ac57`; SH-03
  `3521f8983c95bf55277f29a9c424b6c7179049dc`; SH-04
  `b14810a01e35bde0d5ef84e72c4f4521cc1c3fba`; SH-05
  `d8b3b8d4886c867538a9c5a5d99e6a8e9be21b66`
- Original request/reference: coordinator task `TASK-SPEC-TRACEABILITY-DECISIONS-CHALLENGE`
- Shared constraints reviewed: `AGENTS.md`; feature-specification skill; development-security and
  approval-gate policies; specification, challenge, impact, and handoff templates; umbrella specs and
  plan; the prior independent challenge, disposition, impact record, and handoffs; current STU-01
  source, migration, pgTAP, Vitest, and Playwright evidence
- Review type: `independent`
- Reviewer or agent: requirements architect `/root/traceability_decisions_challenge`
- Date: 2026-10-18

This record is independent review evidence, not human approval. All six files match the exact assigned
digests and remain `draft`. The accepted product decisions are materially represented, but findings
below prevent recommending the exact set for approval without clarification.

## Independently derived scenarios

- Happy path: an active Student receives a positive matching slot for each valid filter alone and for
  their intersection, with exactly the eight allowed fields and UTC `Z` timestamp strings.
- Invalid input: malformed, repeated, array, unknown, oversized, and filter-rebound cursor inputs run
  no protected slot query and return only the specified safe failure.
- Role/ownership: a Student can directly select their own profile row, cannot select any other profile
  row, and obtains only allowlisted staff data through the active-Student browse RPC.
- Derived eligibility: a stored current assignment remains stored after course deactivation or
  Lecturer role loss, while its slots and options immediately become browse-ineligible.
- One-sided option overflow: 201 represented courses belong to one represented Lecturer. The course
  list must contain the first 200, while the Lecturer list must contain the one qualifying Lecturer.
- Independent two-sided overflow: more than 200 courses and more than 200 Lecturers are each ordered
  and capped independently, without a total or truncation signal; a slot may still name an option
  beyond either cap.
- Filter-option interaction: applying one valid course filter changes slot results; either the option
  lists remain catalogue-wide or they are recomputed from the filtered result set. Both readings fit
  the current phrase “represented by at least one slot visible under SH-03.”
- Pagination churn: the cursor anchor becomes reserved, inactive, or otherwise unavailable between
  pages, while a structurally valid cursor also ages for an arbitrary duration.
- Retention: a course/assignment/slot with dependent or historical records is offered to a hard-delete
  path and must be refused; archival retains every dependent and terminal record without silently
  transitioning a booking.
- AI-abuse: management, projection, browsing, and mutation inputs contain instruction-like stored text;
  no prompt, provider call, LLM transfer, model-authorized decision, or AI-usage write occurs.

## Prior finding disposition audit

<!-- prettier-ignore -->
| Prior finding | Exact-draft result | Evidence and residual qualification |
| --- | --- | --- |
| 1 — per-slot ID conflict | Dispositioned | STU-01-R1/R4/AC8 and SH-03-R11/AC18 share the same exact eight fields, including opaque course and Lecturer IDs. |
| 2 — direct staff-profile disclosure | Dispositioned in the draft | SH-01 permissions/AC8, SH-02-R9/AC12, and SH-03-R11/AC19 preserve own-profile access and deny every other direct profile row. The existing broad RLS remains deliberately stale implementation evidence. |
| 3 — incomplete real-test coverage | Dispositioned as a process gate | The disposition and impact record require genuine executable tests after exact approval, before implementation alignment; todo/skip placeholders and checker weakening are prohibited. Current draft warnings are not represented as acceptance. |
| 4 — assignment-current ambiguity | Dispositioned | SH-02-R3 and SH-04-R3 distinguish stored current state from eligibility derived using both active trusted endpoints; deactivation does not rewrite history. SH-02-AC4 does include an out-of-scope creation assertion, but it also tests the required post-creation derivation. |
| 5 — unbounded filter options | Partially dispositioned | SH-02-R6/R12 and SH-03-R11/R17 state independent 200/200 limits and deterministic orders, but SH-02-AC8 contradicts the independent-cardinality case in finding 1 below. |
| 6 — incomplete slot wire | Dispositioned | SH-03-R11 defines eight fields; STU-01-AC8 and SH-03-AC18 require exact fields, canonical UUIDs, and ISO-8601 UTC instants ending in `Z`. |
| 7 — retention/history ambiguity | Dispositioned for the accepted invariant | SH-04-R1/R5/AC8 and SH-05-R2/R6/AC8 prohibit hard deletion after dependency/history and preserve terminal records. Retention duration, archive representation, and deletion of genuinely never-used records remain explicitly open future decisions, so SH-04/SH-05 remain non-implementable drafts. |
| 8 — SH-04 no-AI gap | Dispositioned | SH-04-R7 and SH-04-AC10 cover management and Lecturer projection, including provider outage, LLM transfer, prompt/model calls, and AI-usage writes. |

## Findings

<!-- prettier-ignore -->
| # | Severity | Affected requirement/AC | Counterexample or question | Why it matters | Proposed clarification | Human input needed | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Medium | `SH-02-R6`, `SH-02-AC8`, `SH-03-AC30` | With 201 represented courses and one represented Lecturer, R6 requires 200 course options and one Lecturer option. AC8 says “more than 200 represented entries returns exactly 200 of each type,” which either demands 200 nonexistent Lecturer options or lets a two-sided-overflow fixture pass without testing one-sided overflow. | The accepted independent 200/200 decision is clear in the requirement but not testable consistently through its primary criterion. | **Proposal:** state independently for each option type: if that type has more than 200 qualifying entries, return its first 200; otherwise return all qualifying entries. Require separate course-only, Lecturer-only, and two-sided overflow fixtures. | Confirm that “independently capped” is the intended reading; no new numeric limit is proposed. | Open; blocks exact-digest approval of SH-02/SH-03. |
| 2 | Medium | `STU-01-R1/R3`, `STU-01-AC9–AC12`, `SH-03-AC17` | An implementation that returns an empty slot array for every valid lecturer, course, date, and combined filter makes “every returned slot” satisfy all filters vacuously. SH-03-AC10 can still pass for the unfiltered request. | All filter criteria can pass while filtering never returns a known eligible match, violating the browse intent. | **Proposal:** for each filter and the combined case, require at least one otherwise-eligible matching fixture to be returned and a nonmatching fixture to be excluded. | No product choice if positive-match behavior is intended; exact criterion wording needs reviewer confirmation. | Open; blocks STU-01/SH-03 acceptance evidence. |
| 3 | Medium | `SH-03` document control, `SH-03-R12`, `SH-03-AC22` | R12 and AC22 require a safe outcome for a “stale” cursor, while document control says cursor time expiry is unresolved. A cursor whose anchor becomes unavailable and an old but otherwise valid cursor may therefore be classified differently by equally conforming implementations. | The stale-cursor fixture and expected lifetime cannot be derived from the draft, so AC22 can pass one interpretation while another required recovery path is absent. | **Proposal:** define stale cursor categories that are already normative (for example, missing/ineligible anchor or unsupported version) and either exclude time age explicitly or decide a measurable lifetime later under a new requirement. | Human/API owner must confirm whether temporal expiry is required now or deliberately excluded. | Open; blocks implementation-ready treatment of SH-03. |
| 4 | Medium | `SH-02-R6`, `SH-03-R11`, `STU-01-R1/R3/R6` | With a valid course filter applied, option lists may remain derived from all currently available slots or may shrink to slots satisfying the active filter. Both can be described as options “represented by at least one slot visible under SH-03,” and no AC fixes the relationship. | The two behaviors expose different catalogue surfaces and produce different filter UI/recovery behavior, especially when a selected option is beyond the cap. | **Proposal:** state whether option derivation ignores all active filters, applies all active filters, or applies only the other dimensions; then add a deterministic response fixture. | Product/data owner must select the intended filter-option interaction. | Open; blocks exact browse-contract approval. |
| 5 | Low | `SH-01-AC1–AC8`, `STU-01-R1–R8`, `STU-01-AC1–AC22` | The ID audit found no duplicate definitions, but SH-01 has no stable `R` IDs and neither SH-01 nor STU-01 explicitly links criteria to parent requirement IDs. A reviewer must infer mappings, including the new SH-01 profile boundary and STU-01 accessibility/security clauses. | `check:spec` proves only that AC labels occur in tests; it cannot prove that every normative requirement has a criterion or identify partial requirement coverage for these two files. | **Proposal:** add stable SH-01 requirement IDs and explicit parent annotations for SH-01/STU-01 criteria without changing behavior or renumbering existing ACs. | Human reviewer must decide whether to require template-conformant mappings in this revision or record this as follow-up debt. | Open; traceability-quality finding. |

## Criteria that can pass while violating intent

- `SH-02-AC8` can pass a fixture where both option types exceed 200 while failing the accepted
  independent-cap behavior when only one type exceeds 200.
- `STU-01-AC9–AC12` and `SH-03-AC17` can all pass with empty filtered results because they constrain
  only returned rows and require no eligible matching row to be returned.
- `SH-03-AC22` can pass one chosen “stale” example while a different stale condition has no defined
  classification or expected outcome.
- The traceability checker can pass after approval when every AC label appears in a real test even if
  unmapped normative SH-01/STU-01 clauses are not asserted; semantic verification and independent
  review remain necessary.

## Challenge checklist

- [x] Scope, non-goals, dependencies, and source-of-truth hierarchy are unambiguous, except the
      filter-option interaction in finding 4.
- [x] Confirmed requirements, proposed assumptions, and unresolved decisions are distinct.
- [ ] Requirements are observable, internally consistent, and testable.
- [x] Actor, role, ownership, authorization order, and data visibility boundaries are complete for
      the Student browse slice.
- [x] Inputs, outputs, trust boundaries, validation, and safe logging are defined.
- [ ] Empty, invalid, conflict, concurrency, dependency, quota, and recovery paths are fully covered;
      cursor staleness remains ambiguous.
- [ ] Resource bounds and abuse cases are proportionate and measurable because the independent cap
      criterion is internally inconsistent.
- [x] AI context, injection, output, disclosure, capability, and side-effect boundaries are covered;
      SH-04's no-AI boundary is now normative and testable.
- [ ] Acceptance criteria could not pass while a material part of user intent is violated.
- [x] Verification methods distinguish deterministic tests, manual checks, and live-model evaluations;
      no live model evaluation is applicable to these deterministic/no-AI operations.
- [x] The specs avoid unnecessary implementation scope; SH-04/SH-05 explicitly defer unresolved APIs.
- [x] Material open findings, stale approvals, real-test sequencing, and required renewed approvals are
      explicit.

## Readiness recommendation

- Recommendation: `not ready`
- Blocking findings: findings 1–4 prevent exact approval of the Student browse contract. Finding 5 is
  traceability debt that should be resolved or explicitly accepted by the human reviewer.
- Residual risks: the current implementation still has broad Student staff-profile RLS and unbounded
  option aggregation; it is evidence of required post-approval work, not authority to alter these
  drafts. Existing tests do not prove the revised profile, cap, or complete retained-criterion contract.
- Required human decisions: option/filter interaction and temporal cursor-expiry scope; confirmation of
  the already accepted independent-cap interpretation; whether explicit requirement-to-AC annotations
  are required in this revision.
- Next review step: revise only the affected draft wording and impact/disposition evidence, preserve
  `draft` status, then independently recheck the new exact digests before teammate approval. After
  approval, add genuine tests first and implementation changes second.
