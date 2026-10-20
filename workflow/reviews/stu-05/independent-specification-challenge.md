# Specification challenge record

- Feature and requirement IDs: `STU-05-R1`–`R8`, `STU-05-AC1`–`AC15`, `SH-01-R6`, `SH-01-AC6`, `SH-01-AC7`.
- Draft spec path: `workflow/specs/student/STU-05-improve-request.md`.
- Draft commit or content digest: approved digest reported by coordinator: `74eeb61f192e0073343fed708ad694b671268fbc`.
- Original request/reference: Student AI request improvement with explicitly approved quota/rate constraints.
- Shared constraints reviewed: `AGENTS.md`, `SH-01-foundation.md`, `PRODUCT-SPEC.md`, `TECHNICAL-SPEC.md`, `INTEGRATION-SPEC.md`, development-security and approval-gate policies, STU-02 request boundary, pre-code tester handoff/tests, AI gateway/quota code, and initial `ai_usage` migration.
- Review type: `independent`.
- Reviewer or agent: `requirements_architect`.
- Date: 2026-10-19.

This is independent agent review evidence, not human approval. The broader `SH-01` document remains
`draft`; the coordinator supplied only a team-reported approval for its STU-05 quota subset.

## Independently derived scenarios

- An active Student submits valid topic/questions and receives advisory text while the booking form is
  unchanged until the Student explicitly submits it through STU-02.
- A signed-out, inactive, Lecturer, or Administrator invokes the Server Action directly; authorization
  happens before quota/accounting/provider access and returns no usage or provider detail.
- A draft has valid individual STU-02 fields but their escaped/labelled combined gateway input exceeds
  4,000 characters; it fails before accounting or provider access and preserves the draft.
- Four requests from one Student, eleven application-wide requests, and concurrent tabs race against the
  per-minute limits; only admitted requests may reach the provider.
- Ten near-simultaneous requests are already pending when a Student or app-wide daily-success cap is
  almost exhausted; provider calls, successful responses, and daily credits cannot exceed the intended
  budget merely because finalization happens later.
- A request starts immediately before Singapore midnight and completes immediately after it; quota
  accounting has one deterministic day attribution and cannot bypass or double-count either day.
- Provider timeout, error, invalid output, database claim failure, finalization failure, and indeterminate
  network outcome leave no false success, automatic retry, booking mutation, prompt/output log, or unsafe
  ongoing reservation.
- Prompt input contains closing untrusted tags/instructions; model output contains HTML/script-like text;
  neither causes instruction execution, markup rendering, navigation, or a booking action.
- An old pending attempt is reconciled using trusted time without calling the provider, then a deliberate
  new request is permitted only under the selected quota semantics.

## Findings

| #   | Severity          | Affected requirement/AC                         | Counterexample or question                                                                                                                                                                                                                                                                                                                                                                            | Why it matters                                                                                                                                     | Proposed clarification                                                                                                                                                                                                                             | Human input needed                                                                                     | Disposition                                                                              |
| --- | ----------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 1   | High / resolved   | R4, R5, AC8, AC9, AC11, AC14; SH-01-R6/AC6/AC7  | Daily limits count only valid successful responses, but capacity is reserved before the provider call. If 10 requests are pending near a daily cap, a naive implementation can call the provider more than the remaining daily budget and then discard/reject valid outputs at finalization. A request spanning 00:00 SGT also has no defined daily attribution.                                      | This directly affects the user’s credit-saving goal and makes the concurrency/midnight criteria non-deterministic.                                 | Confirmed 2026-10-19: atomically reserve applicable daily capacity at admission; attribute a valid response to that admission's SGT day even after midnight; failures release the reservation; post-midnight admissions use the new day.           | Decision recorded by Joseph; no further product input for this finding.                                | Resolved by material spec revision; prior approval is stale pending renewed team review. |
| 2   | High              | AC1, AC2, AC3, AC5, AC6, AC11, AC12, AC13, AC14 | Current pre-code action tests largely assert only a broad returned `kind`, successful promise resolution, or two-result array length. They do not mock/assert authorization-before-call, exact gateway arguments, absence of a second provider call, usage-row contents, or failure release. Current E2E tests also navigate an authenticated-only UI without specifying authenticated storage state. | These tests could pass while core authorization, accounting, prompt-safety, and UI requirements are violated.                                      | Proposal: tester should replace broad contracts with isolated mocked action assertions and disposable authenticated E2E/database fixtures before accepting implementation evidence.                                                                | No product decision; coordinator should assign tester correction.                                      | Open verification gap; does not itself change product scope.                             |
| 3   | High              | R5, R7, AC12, AC13, AC14; SH-01-AC7             | Existing shared gateway inserts one undifferentiated `ai_usage` row before provider access and never releases it on timeout, unavailable, rate-limited, or empty-output paths. It also logs provider error objects with `console.error`. It cannot represent pending/success/failure/reconciliation states required by the approved feature.                                                          | A feature-only UI/action implementation would violate successful-response-only accounting and may expose provider-derived diagnostic data in logs. | Proposal: assign one shared-file owner to replace the gateway/accounting contract and add an append-only migration before wiring the UI; prohibit raw provider-error logging (log only reviewed, non-content classification if logging is needed). | No new product decision; sensitive implementation/review is required.                                  | Confirmed implementation gap; route to shared integration task.                          |
| 4   | Medium / resolved | R7, AC13, data model                            | The specification allows timestamps, user ID, feature and state, but supplies no retention/deletion rule for attempt metadata after it is no longer needed for minute/day windows and stale recovery.                                                                                                                                                                                                 | Indefinite per-user AI-use history is inconsistent with a data-minimization goal and makes cleanup/test expectations unclear.                      | Confirmed 2026-10-19: retain only user ID, feature, state/outcome and timestamps; delete every attempt row no later than 30 days after `created_at`; never retain prompt/output/provider response.                                                 | Decision recorded by Joseph; no further product input for this finding.                                | Resolved by material spec revision; tester must add deterministic deletion coverage.     |
| 5   | Medium            | R1, R3, AC1, AC4, AC5                           | STU-02 permits topic up to 200 characters and questions up to 2,000 characters, while STU-05 caps the final gateway input at 4,000 characters after labels/escaping. The intended field-specific response for a combined-over-limit draft is not stated.                                                                                                                                              | UI can give misleading feedback or tests can disagree whether this is a topic, questions, or request-level validation error.                       | Proposal: use the existing request-level validation outcome and explain that model improvement is unavailable until the combined draft is shortened; no booking validation rule changes.                                                           | No, unless product wording is important; implementation can use the existing `request` field category. | Non-blocking implementation detail.                                                      |

## Challenge checklist

- [x] Scope, non-goals, dependencies, and source-of-truth hierarchy are clear after the recorded daily reservation/midnight decision.
- [x] Confirmed requirements, proposed assumptions, and unresolved decisions are distinct.
- [x] Requirements are internally consistent and testable after the recorded admission-day/midnight decision.
- [x] Actor, role, ownership, authorization order, and data visibility boundaries are complete for STU-05.
- [x] Inputs, outputs, trust boundaries, validation, safe logging, and metadata retention are specified; implementation must remove the observed unsafe gateway logging.
- [x] Empty, invalid, conflict, concurrency, dependency, quota, and recovery paths are specified after the recorded admission-day reservation decision.
- [x] Resource bounds and abuse cases are proportionate and measurable.
- [x] AI context, injection, output, disclosure, capability, and side-effect boundaries are clear.
- [ ] Acceptance criteria could not pass while material intent is violated: current pre-code tests need strengthening (finding 2).
- [x] Verification methods distinguish deterministic tests, manual checks, and live-model evaluations.
- [x] The spec avoids unnecessary implementation detail and scope.
- [x] Material open findings and required renewed approvals are explicit in this review.

## Readiness recommendation

- Recommendation: `ready for human review`.
- Blocking findings: none after the two recorded decisions; the material revision has reset the approval gate.
- Residual risks: existing gateway behavior is incompatible with the feature’s accounting/logging contract;
  pre-code verification is presently too weak to prove key security behavior.
- Required human decisions: none. Joseph has reported the team's approval of the revised STU-05 and
  applicable SH-01 quota subset; identities and remote PR evidence were not independently verified.
- Next review step: tester strengthens deterministic fixtures/assertions before developer integration.
