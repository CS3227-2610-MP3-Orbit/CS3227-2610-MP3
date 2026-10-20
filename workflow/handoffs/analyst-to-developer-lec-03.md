# Analyst-to-Developer Handoff — LEC-03

## Status

Human approval recorded on 2026-10-20. Implementation may begin from the approved specification.

## Feature

Allow Lecturers to view pending/approved consultations, derive upcoming/ongoing/completed display status, and automatically treat consultations as completed after their end time. Administrator consultation management is out of scope.

## Required inputs

- Approved LEC-03 specification.
- Existing shared booking schema and versioning migrations.
- Existing server-action, RPC, RLS, and safe-result conventions.

## Required outputs after approval

- Lecturer view and completion operation.
- New migration only if required.
- Unit, database/security, integration, concurrent, E2E, and accessibility tests.
- Developer evidence with exact command results and unresolved risks.

## Constraints

- No AI calls or AI usage mutations.
- Do not add Administrator consultation management; preserve the existing Administrator page.
- Student fields are limited to name, email, topic, and questions.
- Deactivation after approval requires minimal in-app notifications to affected users.
- No completion confirmation, notification, or audit side effect is required.
- Do not change unrelated Student behavior.
- Derive identity and ownership on the server.
- Preserve booking history and enforce `approved -> completed` atomically.
