# Development and AI Guardrails

## Purpose

These guardrails protect the repository, user data, approval process, and Lecturer AI feature.
They distinguish controls enforced by the environment or code from instructions that require human
oversight and evaluation.

## Development-agent guardrails

| Guardrail | Technical enforcement | Process or prompt enforcement |
| --- | --- | --- |
| Least privilege | Workspace sandbox and repository ownership boundaries | Agent role scope |
| Reviewer read-only behavior | Reviewer instructions restrict changes to tests and handoffs | Separate reviewer session and human review |
| Approved-spec gate | Developer instructions require `status: approved` | Human approval recorded in handoff |
| No secrets | `.claude/settings.json` denies common secret reads; agents are told not to read env files | Human audit of commands and outputs |
| No deploy/push | `.claude/settings.json` denies deploy, database push, and Git push commands | Human approval for release actions |
| No destructive commands | Workspace policy and approval controls | Stop and escalate when target is unclear |
| No unrelated changes | Git diff and ownership review | Agent instructions and reviewer checks |
| No weakened tests | Reviewer compares test history and criteria coverage | Human review of security-sensitive tests |
| Traceability | `npm run check:spec` checks criterion-to-test references | Handoff records explain exceptions |

Controls listed as process or prompt enforcement are not security boundaries by themselves. They
must be supported by review evidence.

## Lecturer AI guardrails

- Authorize the lecturer before retrieving consultation data or calling the model.
- Scope data to approved consultations belonging to the authenticated lecturer.
- Treat student descriptions and all user-controlled text as untrusted data.
- Use `wrapUntrusted()` and `generateText()` through the backend only.
- Enforce input limits, output limits, timeouts, quotas, and safe failure handling.
- Render model output as plain text and validate structured output before use.
- Never allow model output to alter bookings, permissions, or other application state.
- Minimize student information sent to the model and avoid unnecessary disclosure.
- Keep ordinary consultation functionality available when the provider fails.

## Stop conditions

An agent must stop and request human review when requirements are materially ambiguous, approval is
missing, an operation may expose secrets or protected data, a destructive target is unclear, an
unrelated file would need changing, or a security test would need weakening.

## Evidence requirements

Every handoff should record the specification reference, files changed, commands executed, test
results, security findings, unresolved risks, and human decision status. Agents must not label their
own output human-approved.
