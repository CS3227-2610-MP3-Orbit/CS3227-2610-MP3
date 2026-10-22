---
name: consultation-implement
description: Implement an approved Lecturer consultation specification with authorization, validation, tests, and traceability.
---

# consultation-implement

## Trigger

Use only when implementing a Lecturer feature whose specification status is `approved` and whose human approval is recorded.

## Inputs and outputs

Read the approved specification, latest analyst handoff, `AGENTS.md`, existing architecture, and relevant code. Produce implementation changes, tests, command results, limitations, security-sensitive changes, and a developer-to-reviewer handoff.

## Procedure

1. Verify approval before coding; stop if absent or ambiguous.
2. Implement only the approved scope using existing conventions.
3. Enforce server-side `requireRole`, ownership, validation, and RLS expectations.
4. Route all SoC LLM calls through `generateText()` and wrap user text with `wrapUntrusted()`.
5. Add tests named with acceptance-criteria IDs.
6. Run relevant lint, typecheck, unit, database/E2E, and traceability checks.
7. Record exact results and unresolved risks in the handoff.

## Guardrails

- Do not change approved requirements without human approval.
- Do not modify unrelated teammate features, weaken tests, access secrets, deploy, commit, push, or merge.
- Do not let AI output change bookings or permissions.
- Stop on missing approval, unclear requirements, unsafe access, or destructive operations.

## Definition of done

The approved behavior is implemented, tests provide evidence for criteria, security-sensitive changes are documented, and the reviewer receives a complete handoff. This skill never marks the work human-approved.
