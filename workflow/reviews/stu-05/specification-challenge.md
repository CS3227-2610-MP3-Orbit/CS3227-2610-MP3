# Specification challenge record

- Feature and requirement IDs: `STU-05-R1`–`R8`; `STU-05-AC1`–`AC15`; `SH-01-R6/AC6/AC7`.
- Draft spec path: `workflow/specs/student/STU-05-improve-request.md`.
- Draft commit or content digest: uncommitted draft at self-review time.
- Original request/reference: Student improve-request feature plus Joseph's confirmed credit-preserving
  per-Student/per-project limits.
- Shared constraints reviewed: `AGENTS.md`, `SH-01`, `SHR-01`, `PRODUCT-SPEC`, `TECHNICAL-SPEC`,
  `INTEGRATION-SPEC`, `STU-02`, security/approval policies, and observed AI gateway/accounting code.
- Review type: `self-review`.
- Reviewer or agent: assigned `requirements_architect`.
- Date: 2026-10-19.

This is not independent review or human approval. It was updated after Joseph accepted the two prior
blocking decisions; an independent requirements-architect challenge remains recommended before approval.

Joseph subsequently reported on 2026-10-19 that the team approved revised STU-05 and the SH-01 quota
subset. This self-review does not verify identities or remote review evidence and does not approve merge,
deployment, or sensitive implementation changes.

## Independently derived scenarios

- Student clicks improve repeatedly in one tab or opens concurrent tabs; another Student consumes the
  remaining global budget at the same time.
- A successful provider response is lost after the provider call, versus timeout before response; the
  accounting system must not either undercount successful calls or charge failures contrary to policy.
- Inputs contain closing-tag injection, malicious instructions, HTML/script, private identity claims, or
  4,001 characters; output is empty, script-like, or contains invented personal/course facts.
- Deactivated/non-Student users invoke a Server Action directly, supply an arbitrary prompt/model/user ID,
  or inspect usage/state by substitution.
- A request crosses Singapore midnight, system UTC offset, daylight-independent local day boundary, or
  global daily cap while rolling minute control is also enabled.

## Findings

| #   | Severity | Affected requirement/AC   | Counterexample or question                                                                                 | Why it matters                                                                                              | Proposed clarification                                                                                                     | Human input needed | Disposition                                  |
| --- | -------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------- |
| 1   | High     | R4/R5; AC7–AC14; SH-01-R6 | Global-minute wording had no number.                                                                       | Could accidentally remove a safety cap or invent a cap.                                                     | Accepted: retain it at 10 app-wide admitted requests/rolling 60 seconds using trusted time.                                | No                 | Resolved by Joseph; renewed review required. |
| 2   | High     | R4/R5/R7; AC8–AC14        | Provider success and client/network failure can be indistinguishable without durable outcome finalization. | “Only successful responses count” and “prevent duplicate in-flight calls” conflict without recovery design. | Accepted: atomic reservation/attempt/finalization, release failures, and trusted expiry/reconciliation with no auto retry. | No                 | Resolved by Joseph; renewed review required. |
| 3   | Medium   | R3/AC15                   | “Does not invent” cannot be guaranteed solely by instructions or deterministic tests.                      | UI could present fabricated advice as fact.                                                                 | Keep output advisory/non-authoritative, require review, and use opt-in synthetic live evaluation as supplemental evidence. | No                 | Addressed in draft.                          |
| 4   | Medium   | R7/AC13                   | Usage rows currently lack outcome/state and client logs `error` object in generic gateway path.            | Could retain failed attempts or accidentally log sensitive provider context.                                | Require minimal metadata only and security review of logging/accounting implementation.                                    | No                 | Addressed as required follow-up.             |
| 5   | Medium   | R1/R5/AC2/AC10            | UI-only disable does not prevent two tabs/direct actions.                                                  | Credits and provider calls could duplicate.                                                                 | Require server-enforced per-Student in-flight invariant and concurrency test.                                              | No                 | Addressed in draft.                          |

## Challenge checklist

- [x] Scope, non-goals, dependencies, and source hierarchy are stated.
- [x] Confirmed, proposed, and unresolved decisions are distinct.
- [x] Requirements are observable where decisions are resolved; blockers are explicit.
- [x] Role/authorization/data-minimization boundaries are explicit.
- [x] Inputs, outputs, injection, failure and logging boundaries are covered.
- [x] Empty/invalid/concurrent/quota/provider and midnight cases are covered.
- [x] Deterministic mocked checks are separated from opt-in live evaluation.
- [x] The AI cannot mutate bookings or persist generated output automatically.
- [x] Global-minute policy and atomic success-accounting design are resolved by recorded human decisions.

## Readiness recommendation

- Recommendation: `ready for human review`.
- Blocking findings: none; renewed teammate approval is still required for this material revision.
- Residual risks: model hallucination remains possible; safe advisory UX and human review mitigate it but
  cannot prove semantic truth.
- Required human decisions: teammate approval of the exact revised digest.
- Next review step: tester-owned pre-code acceptance/security tests, then implementation review under the
  approved STU-05 specification.
