# STU-02 specification challenge

- Task: `STU-02-SPEC`; requirement IDs `STU-02-R1–R10`, `STU-02-AC1–AC19`.
- Draft: `workflow/specs/student/STU-02-request-consultation.md`.
- Baseline: `668e7435805b3aec1140653b8ea12d14e2380a68`; new uncommitted draft.
- Reviewed draft content digest: `a30b7596a37e61bbe25537759eb88dcb2ad82b24` (`git hash-object`).
- Original request: create a spec for Students requesting consultation slots, using feature-specification.
- Shared constraints inspected: SH-01/02/03/05, product/integration/technical/shared specs, repository
  policies/template, browse implementation, migration grants/indexes, and existing browse tests.
- Review type: **self-review**, assigned requirements_architect, 2026-10-18. No independent agent
  review occurred; independent exact-digest challenge and human approval remain next steps.

## Scenarios and findings

These are specification counterexamples, not executed application tests.

| ID  | Severity | Requirement | Counterexample                                                                                           | Disposition / human input                                                                                                 |
| --- | -------- | ----------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| S1  | High     | R3/R4       | Different slots let two same-Student overlapping inserts bypass the existing single-slot unique index    | Required database overlap coordination and real concurrent tests; implementation not present                              |
| S2  | High     | R6/R8       | A database commit succeeds but response disappears; declaring failure encourages another booking         | Proposed stable intent/recovery and outcome_unknown; human approval required                                              |
| S3  | Medium   | R5          | Emoji counts differ between JS length and PostgreSQL length; blank questions currently fit schema        | Proposed code-point bounds and exact whitespace normalization; human approval and migration compatibility review required |
| S4  | Medium   | R6          | Same idempotency key after cancellation re-creates a booking; stale form silently books rescheduled time | Proposed immutable key binding, terminal receipt and reviewed slot version; human approval required                       |
| S5  | Medium   | R1          | Form retrieves selected slot by looking only in browse page one                                          | Direct authorized single-slot lookup explicitly required, with later-page positive fixture                                |
| S6  | High     | R9          | Attacker calls new RPC/direct table without UI and supplies owner/status or another Student's retry key  | Explicit trusted identity, deny base tables, narrow recovery and direct-call security criteria                            |
| S7  | Medium   | R3          | Waiting for a slot lock crosses start time, or deactivation commits during eligibility check             | Fresh post-wait database time and serialization required; future lifecycle mutations must preserve this ordering          |

## Challenge checklist

- [x] Request-only slice and deferred view/edit/cancel/AI scope are explicit.
- [x] Confirmed intent, proposed exact contracts and unresolved human choices are separated.
- [x] Requirements and criteria include positive results, ownership/refusal, real races and failures.
- [x] Identity, minimal projection, parameter validation, literal rendering, CSRF and safe logs covered.
- [x] Transport ambiguity is distinguished from definite rollback; terminal history is preserved.
- [x] Input/response/time bounds proposed; no approved rate/SLA target invented.
- [x] No model calls, prompt interpretation or AI-authorized state changes permitted.
- [x] Planned deterministic tests, real DB races and manual checks are distinguished from results.
- [x] Approval-dependent proposals and limits are visible; no human approval claimed.

## Readiness recommendation

Ready for human review, not implementation. Decide text bounds, adjacency, retry/version/recovery and
operational proposals in the canonical spec. Approve only the relevant creation dependency slice;
defer unrelated SH-05 lifecycle/slot-management questions. Independent challenge remains unexecuted.
