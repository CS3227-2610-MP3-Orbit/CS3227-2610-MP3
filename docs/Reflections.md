# Reflections

## AI Security

Our AI features are designed around a server-side security boundary. LLM calls go through a shared
gateway, user-controlled text is treated as untrusted data, and provider credentials remain on the
server. The system is intended to enforce authorization before retrieving protected data, disclose
only the minimum necessary information, render model output as plain text, and prevent AI output
from changing bookings, permissions, or other application state.

Important remaining work includes testing prompt injection, unauthorized data access, unsafe output,
quota exhaustion, malformed responses, and provider failures across every AI feature. Exact limits,
retention rules, and data-disclosure policies must be agreed by the team rather than assumed by an
individual developer.

## Spec-Driven Development

Our team uses a lightweight, manually maintained Spec-Driven Development process. Requirements are
recorded before implementation, acceptance criteria use stable identifiers, and changes are made in
the order of specification, tests, and code. Specifications describe permissions, normal behavior,
failure cases, security requirements, dependencies, and open questions. This helps us distinguish
existing behavior from proposed behavior and prevents developers from silently inventing business
rules.

The main challenge is keeping specifications synchronized with implementation and tests. Criteria
without automated evidence are treated as incomplete rather than assumed to be satisfied. Ambiguous
rules are escalated for team or human review.

## Basic Multi-Agent SE

Our development workflow separates requirements analysis, implementation, and testing/security
review. Each role has a defined scope and produces a handoff for the next role. Developers work only
from approved requirements, while reviewers independently compare the implementation against the
specification and test security boundaries. Human approval is required for requirement changes,
approval gates, commits, merges, and deployment.

This separation improves accountability, but it also introduces coordination overhead. Handoffs
must contain concrete evidence, and a skill or agent definition alone does not prove that an
independent review occurred. We must record actual execution results instead of treating planned
workflow steps as completed evidence.

Independent workflow evaluation showed that the general agent definitions are usable, while the
`consultation-*` skills are intentionally limited to Lecturer work. The security review process
covers the main risks, but it still needs more concrete role matrices, prompt-injection categories,
privacy checks, secret scanning, and measurable AI failure expectations. These findings reinforce
that evaluation results and limitations must be recorded separately from planned behavior.

## Evidence and limitations

- The repository contains shared specifications, agent definitions, handoff templates, security
  rules, and traceability checks.
- The traceability checker runs successfully and identifies criteria that still lack test evidence.
- No historical prompts or session summaries are included unless they are supported by recorded
  logs; unavailable history is not fabricated.
- Security-sensitive changes require review, and production credentials must not be exposed to
  development agents.
