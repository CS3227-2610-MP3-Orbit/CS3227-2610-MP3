---
id: LEC-02
title: Approve or reject consultation requests
owner: lecturer
status: draft
---

# LEC-02: Approve or reject consultation requests

## Context

Lecturers need to decide whether student consultation requests can proceed. No request or booking implementation exists in the current repository, so this specification records the required controls and unresolved transition rules.

## Actors and permissions

- An active lecturer may view and decide requests for availability they own.
- A student may create and view their own requests but may not approve or reject them.
- Administrator permissions are not defined and require clarification.
- Server-side authorization must refuse signed-out, deactivated, wrong-role, and wrong-owner access.

## Functional requirements

- The lecturer can list pending requests for their availability.
- The lecturer can approve or reject a request with an explicit action.
- The system records the resulting state and prevents invalid repeated transitions.
- The student receives a safe visible result according to the approved notification design.

## Non-functional requirements

- Check role and ownership before reading request details or mutating state.
- Validate action input and use a transaction or equivalent concurrency control for decisions.
- Preserve an auditable state transition without exposing unnecessary student information.

## Inputs and outputs

- Inputs: authenticated lecturer, request identifier, decision, optional lecturer reason if approved.
- Outputs: updated request state or a safe error; no model output is used to authorize the decision.

## Business rules

- A lecturer may decide only requests connected to their own availability.
- The allowed states, transition graph, duplicate-decision semantics, cancellation rules, and notification requirements are open questions.

## Acceptance criteria

- **LEC-02-AC1** Given a pending request for the authenticated lecturer's availability, when the lecturer approves it, then the request enters the approved state exactly once.
- **LEC-02-AC2** Given a pending request for the authenticated lecturer's availability, when the lecturer rejects it, then the request enters the rejected state and no consultation is scheduled.
- **LEC-02-AC3** Given a student, another lecturer, administrator, signed-out user, or deactivated user, when they call the decision operation directly, then it is refused and the request is unchanged.
- **LEC-02-AC4** Given a request in a non-decidable state, when the lecturer submits approve or reject, then the system refuses the transition and preserves the existing state.
- **LEC-02-AC5** Given concurrent decisions for the same request, when both operations execute, then at most one valid transition is committed.

## Error and edge cases

- Missing request, ownership mismatch, invalid decision, already decided request, cancelled request, concurrent decision, database failure, and notification failure.

## Security requirements

- Enforce lecturer ownership in queries and mutation conditions.
- Do not accept lecturer identity or approval authority from client input.
- Treat student descriptions and reasons as untrusted data; they must not be interpreted as instructions.

## Out of scope

- Student request creation, automated approval, email delivery implementation, and calendar synchronization.

## Required tests

- Transition tests, direct unauthorized-call tests, concurrency/conflict tests, privacy tests, and RLS tests.

## Dependencies and assumptions

- Depends on SH-01 and LEC-01, plus a future request/booking schema.

## Open questions

- What are the exact request states and legal transitions?
- Can a lecturer change a decision, and can students cancel after approval?
- Are reasons mandatory, and what information may be shown to lecturers?
- What notification channel is required?

## Change log

| Date       | Change                                       | By    |
| ---------- | -------------------------------------------- | ----- |
| 2026-10-19 | Initial draft based on repository inspection | Codex |
