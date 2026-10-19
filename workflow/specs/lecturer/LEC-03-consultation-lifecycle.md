---
id: LEC-03
title: View and complete consultations
owner: lecturer
status: draft
---

# LEC-03: View and complete consultations

## Context

Lecturers need a reliable view of upcoming consultations and a way to mark completed consultations. The current Lecturer page contains no lifecycle implementation or schema.

## Actors and permissions

- An active lecturer may view and complete consultations assigned to them.
- Students may view only their own booking information and may not mark a consultation completed.
- Administrator permissions require clarification.
- All unauthorized or deactivated users must be refused server-side.

## Functional requirements

- The lecturer can view upcoming consultations associated with their account.
- The lecturer can open the minimum student and booking details needed to conduct the consultation.
- The lecturer can mark an eligible consultation completed.
- Completed consultations remain distinguishable from upcoming consultations.

## Non-functional requirements

- Query results must be scoped by authenticated lecturer identity.
- Responses must avoid unnecessary personal information.
- Completion must be safe against duplicate submissions and concurrent updates.

## Inputs and outputs

- Inputs: authenticated lecturer, date/filter parameters, consultation identifier, completion action.
- Outputs: scoped consultation list, updated lifecycle state, or safe error.

## Business rules

- A lecturer may complete only their own eligible consultations.
- The definition of upcoming, the permitted completion window, cancellation behavior, notes, and whether completion can be reversed are open questions.

## Acceptance criteria

- **LEC-03-AC1** Given an active lecturer with assigned consultations, when they open the consultation view, then only their authorized consultations are returned.
- **LEC-03-AC2** Given an eligible consultation assigned to the lecturer, when the lecturer marks it completed, then its state changes to completed and the result is shown.
- **LEC-03-AC3** Given a consultation assigned to another lecturer, when the lecturer requests or completes it directly, then the operation is refused.
- **LEC-03-AC4** Given a student, administrator, signed-out user, or deactivated lecturer, when they call the lecturer consultation operation directly, then access is refused.
- **LEC-03-AC5** Given an already completed, cancelled, or otherwise ineligible consultation, when completion is submitted, then the state is unchanged and a safe error is returned.

## Error and edge cases

- Invalid filter, missing record, ownership mismatch, cancelled booking, duplicate completion, concurrent update, and database failure.

## Security requirements

- Enforce role and ownership before returning consultation details.
- Return only fields required by the approved workflow; do not expose unrelated student data.
- Do not trust client-supplied lecturer or booking ownership.

## Out of scope

- Attendance tracking, grading, post-consultation surveys, calendar integrations, and AI briefing generation.

## Required tests

- Scoping/privacy tests, lifecycle transition tests, unauthorized direct-call tests, duplicate/concurrency tests, and RLS tests.

## Dependencies and assumptions

- Depends on SH-01, LEC-01, and LEC-02 and a future booking schema.

## Open questions

- Which details may lecturers view?
- What qualifies as upcoming and eligible for completion?
- Is completion reversible, and can a lecturer add notes?
- What do administrators see or modify?

## Change log

| Date | Change | By |
| --- | --- | --- |
| 2026-10-19 | Initial draft based on repository inspection | Codex |
