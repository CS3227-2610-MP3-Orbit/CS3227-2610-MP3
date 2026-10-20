---
name: lecturer-spec
description: Draft or review lecturer-area feature specifications for the CS3227 consultation-booking application before implementation.
---

# Lecturer specification skill

Use this skill for lecturer-owned requirements, acceptance criteria, permissions, data design, and AI behaviour.

## Scope

- Lecturer-owned paths are `src/app/lecturer/`, `src/features/lecturer/`, and `workflow/specs/lecturer/`.
- Read `AGENTS.md`, `workflow/specs/_TEMPLATE.md`, `workflow/specs/shared/SH-01-foundation.md`, and related existing specs first.
- Do not write application code while drafting a specification.

## Required specification coverage

Every lecturer feature spec must define:

- lecturer, student, and administrator permissions;
- direct Server Action or Route Handler authorization requirements;
- normal workflow and visible outcomes;
- invalid input, missing data, conflicts, deactivated users, and service failures;
- database tables and RLS implications;
- AI inputs, untrusted fields, output validation, quota failure behaviour, and prohibited model actions when AI is involved;
- Given/When/Then acceptance criteria with stable IDs such as `LEC-01-AC1`;
- open questions instead of silently invented requirements.

Set new specs to `status: draft`. Only a human may approve them.

## Handoff

After drafting or reviewing, create a focused handoff note in `workflow/handoffs/` using the repository template. Include assumptions, affected files, unresolved questions, and the criteria that still need tests.
