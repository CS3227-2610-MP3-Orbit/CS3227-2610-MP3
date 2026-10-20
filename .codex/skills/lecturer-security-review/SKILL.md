---
name: lecturer-security-review
description: Review lecturer features for authorization, data-access, prompt-injection, unsafe-output, and abuse risks after implementation.
---

# Lecturer security review skill

Use this skill after lecturer implementation or when explicitly asked to audit a lecturer feature. Judge the code against its approved specification, not against the developer's claims.

## Review targets

- Call lecturer Server Actions and Route Handlers directly as a student, administrator, signed-out user, and deactivated user.
- Check that lecturer data cannot be read or changed across users unless the specification permits it.
- Inspect every database table and migration for RLS, least-privilege policies, and ownership checks.
- Inject instructions, markup, oversized text, and misleading content into every user-controlled field that reaches AI.
- Check that prompts use `wrapUntrusted()`, calls use `generateText()`, outputs are bounded and rendered as plain text, and AI cannot make authorization decisions.
- Test quota exhaustion, timeout, provider failure, empty responses, duplicate submissions, and booking conflicts where applicable.

## Outputs

Add real acceptance or security tests with criterion IDs such as `LEC-01-AC4`. Never weaken or delete tests to make them pass. Record each finding with severity, evidence, affected file, and recommended remediation in a handoff under `workflow/handoffs/`.

Run the relevant unit, database, E2E, and traceability checks. Do not fix application code during this review unless the user explicitly changes the task from review to implementation.
