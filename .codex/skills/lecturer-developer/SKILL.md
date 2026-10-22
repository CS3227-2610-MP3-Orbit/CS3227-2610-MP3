---
name: lecturer-developer
description: Implement an approved lecturer feature in the CS3227 consultation-booking application with tests and traceability.
---

# Lecturer implementation skill

Use this skill only when implementing a lecturer-owned feature whose specification is approved.

## Before coding

- Read `AGENTS.md`, the approved lecturer spec, the latest handoff, and relevant existing code.
- Stop and report if the spec is not `approved`.
- Preserve unrelated teammate changes.
- Keep implementation in `src/app/lecturer/` or `src/features/lecturer/` unless the approved spec requires a reviewed shared change.

## Implementation rules

- Every lecturer Server Action and Route Handler calls `requireRole("lecturer")` on the server before accessing data or using privileged clients.
- Use Supabase queries that respect RLS; use the admin client only for explicitly justified server operations after authorization.
- Add or update migrations only as new files; never edit an existing migration.
- All user-controlled text reaching the SoC LLM goes through `wrapUntrusted()` and all model calls go through `generateText()`.
- Render AI output as plain text and validate structured decisions before using them.
- Do not let AI approve, create, modify, or delete bookings without explicit server-side rules and human confirmation.

## Verification

Add tests whose names reference acceptance criteria, including unauthorized direct calls, invalid input, conflict cases, and AI failures where relevant. Run:

```sh
npm run lint
npm run typecheck
npm test
npm run check:spec
```

Write a handoff in `workflow/handoffs/` describing changed files, migrations, tests, command results, and any remaining risks. Do not deploy, push, or change the specification.
