---
id: LEC-06
title: Lecturer authorization and AI security
owner: lecturer
status: draft
---

# LEC-06: Lecturer authorization and AI security

## Context

Lecturer features must be protected consistently at page, server-operation, database, and AI boundaries. The current project has shared role checks and an AI gateway, but no Lecturer feature endpoints yet.

## Actors and permissions

- Active lecturers may access only Lecturer routes and records they are authorized to use.
- Students and administrators must not use Lecturer-only operations unless a future approved specification grants access.
- Signed-out and deactivated users must be treated as unauthorized.
- AI providers receive only backend-approved, minimum-necessary data.

## Functional requirements

- Every Lecturer page layout, Server Action, and Route Handler performs server-side role checking.
- Every Lecturer data query applies ownership or explicitly approved visibility rules.
- Every AI request uses the shared gateway, untrusted-data wrapper, limits, timeout, and quota controls.
- AI failures do not disable ordinary availability, request, or consultation workflows.

## Non-functional requirements

- Security controls must be testable and traceable to criteria.
- Errors must be safe and must not disclose secrets, provider internals, or unauthorized records.
- Security-sensitive changes require human review before approval, commit, merge, or deployment.

## Inputs and outputs

- Inputs: authenticated session, role, record identifiers, user-entered text, and filter/action data.
- Outputs: authorized records or safe errors; AI text is inert display data only.

## Business rules

- The authenticated session, not client input, determines the acting user and role.
- AI cannot make authorization or booking-state decisions.
- Administrators do not receive the Lecturer dashboard or private Lecturer consultation view unless a
  separate administrator projection is approved.
- Security logs store event category, user ID, feature ID, correlation ID, outcome, and timestamp;
  prompts, secrets, and generated content are never logged.
- Lecturer AI features use the existing shared input, output, quota, and timeout limits.
- CI enforces authorization, ownership/RLS, prompt-injection, output-safety, quota/failure, and
  specification-traceability tests.

## Acceptance criteria

- **LEC-06-AC1** Given any Lecturer server operation, when it is invoked without an active lecturer session, then it refuses before protected data access.
- **LEC-06-AC2** Given an active lecturer, when they request another lecturer's protected record, then the operation returns no protected data and does not mutate it.
- **LEC-06-AC3** Given user-controlled text reaching an AI feature, when the request is constructed, then the text is wrapped as untrusted data and cannot close the wrapper or override system instructions.
- **LEC-06-AC4** Given AI output containing an attempted command, permission change, booking mutation, HTML, or script, when the application handles it, then it is treated as text and cannot perform the attempted action.
- **LEC-06-AC5** Given provider failure, timeout, quota exhaustion, or malformed output, when a Lecturer AI operation runs, then it fails closed for AI while ordinary non-AI functionality remains available.
- **LEC-06-AC6** Given a security-sensitive requirement change, when it is proposed, then it remains unapproved until a human records a decision.

## Error and edge cases

- Expired session, deactivated account, wrong role, forged identifiers, cross-lecturer access, prompt injection, output injection, quota exhaustion, provider outage, and logging failure.

## Security requirements

- Use least privilege, RLS, server-side authorization, input validation, output limits, quotas, timeouts, and safe rendering.
- Never expose production credentials to agents or clients.
- Do not weaken security tests or bypass approval gates.

## Out of scope

- Implementing the missing booking schema, changing shared authentication, selecting exact quota values, and deploying infrastructure.

## Required tests

- Direct endpoint authorization, ownership/RLS, prompt injection, output safety, quota/timeout/provider failure, and approval-gate process tests.

## Dependencies and assumptions

- Depends on SH-01 and all Lecturer feature specifications.
- Current repository evidence supports the security controls but not the feature-specific data model.

## Open questions

None blocking approval.

## Change log

| Date       | Change                                       | By    |
| ---------- | -------------------------------------------- | ----- |
| 2026-10-19 | Initial draft based on repository inspection | Codex |
