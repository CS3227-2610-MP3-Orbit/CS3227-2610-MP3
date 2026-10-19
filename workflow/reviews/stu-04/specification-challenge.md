# Specification challenge record

- Feature and requirement IDs: `STU-04-R1` through `STU-04-R10`; `STU-04-AC1` through `STU-04-AC12`.
- Draft spec path: `workflow/specs/student/STU-04-manage-my-bookings.md`.
- Draft commit or content digest: uncommitted draft at review time.
- Original request/reference: Joseph's Student booking-list, pending-edit, and pre-start cancellation request.
- Shared constraints reviewed: `SH-01`, `SH-02`, `SH-03`, `SH-05`, STU-02, `AGENTS.md`, and policies.
- Review type: `self-review`.
- Reviewer or agent: assigned `requirements_architect`.
- Date: 2026-10-18.

This is not an independent challenge. Independent requirements-architect and human review remain required.

## Independently derived scenarios

- A Student with no bookings, with every terminal/active status, and with enough history to paginate.
- A Student guessing another booking ID, deactivated after opening a detail, or invoking an action directly.
- Pending edit simultaneous with another edit, Student cancel, Lecturer approval/rejection, or slot start.
- Cancellation at one instant before, exactly at, and after start; cancellation of each terminal state.
- Repeated/cross-origin/GET state change, stale version, request timeout/lost response, and database outage.
- Stored HTML/script/SQL/prompt-injection content in topic/questions and an unavailable AI provider.

## Findings

| #   | Severity | Affected requirement/AC | Counterexample or question                                                                              | Why it matters                                             | Proposed clarification                                                                                         | Human input needed                                       | Disposition                                        |
| --- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| 1   | High     | R3, R7, AC4–AC5         | “Description” was ambiguous.                                                                            | Wrong fields could be edited.                              | Edit both topic/questions while pending including after start.                                                 | No; team decision recorded                               | Resolved; verify bounds.                           |
| 2   | High     | R4–R5, AC5/AC8          | Lecturer transition APIs are absent.                                                                    | Race tests must not be mocked.                             | First valid transition wins; approval-first remains cancellable pre-start; cancellation-first blocks decision. | No; fixture still needed                                 | Product resolved; verification dependency remains. |
| 3   | Medium   | R1–R2, AC1–AC3          | Full list content/pagination was unclear.                                                               | Could over-disclose.                                       | List summary only; full content/actions in detail; no pagination.                                              | No; team decision recorded                               | Resolved; ordering/truncation proposed.            |
| 4   | Medium   | R4, R8, AC10            | Lost response makes an action uncertain.                                                                | Duplicate transition risk.                                 | Idempotency key plus expected version.                                                                         | No; team decision recorded                               | Resolved; encoding proposed.                       |
| 5   | Medium   | R5, AC6–AC8             | A cancellation releases a slot, but concurrent requester/lifecycle effects need database serialization. | App-only checks could expose an incorrectly released slot. | Require a database conditional transition and test fresh browse behaviour after commit.                        | No; already specified as a proposed technical constraint | Address during implementation review.              |

## Challenge checklist

- [x] Scope, non-goals, dependencies, and source-of-truth hierarchy are stated.
- [x] Confirmed requirements, proposed assumptions, and unresolved decisions are distinct.
- [x] Requirements are observable where decisions are resolved; blockers are explicit.
- [x] Actor, role, ownership, authorization order, and visibility boundaries are described.
- [x] Inputs, outputs, trust boundaries, validation, and safe logging are described or marked proposed.
- [x] Empty, invalid, conflict, concurrency, dependency, and recovery paths are covered.
- [x] Resource bounds and abuse cases are proportionate and labelled proposed where undecided.
- [x] No-AI/injection boundaries are explicit.
- [x] Acceptance criteria expose, rather than hide, missing cross-role/API decisions.
- [x] Verification distinguishes deterministic DB, E2E, concurrency, and manual checks.
- [x] The spec avoids committing an implementation/API before approval.
- [x] Material open findings and renewed human approval are explicit.

## Readiness recommendation

- Recommendation: `ready for human review`.
- Blocking findings: none; human approval of exact draft remains required.
- Residual risks: non-paginated list capacity and no real Lecturer fixture; do not claim mock races as real.
- Required human decisions: none for product behaviour; confirm proposed API/UI details.
- Next review step: human/team review of revised draft, then record approval before implementation.
