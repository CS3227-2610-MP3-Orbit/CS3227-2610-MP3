---
id: LEC-03
title: View and complete consultations
owner: lecturer
status: superseded
---

# LEC-03: View and complete consultations

> Superseded by `workflow/specs/lecturer/LEC-03-consultation-completion.md`, which is the approved
> specification for this feature.

## Context

Lecturers need a reliable view of upcoming consultations and a way to mark completed consultations. The current Lecturer page contains no lifecycle implementation or schema.

## Actors and permissions

- An active lecturer may view and complete consultations assigned to them.
- Students may view only their own booking information and may not mark a consultation completed.
- Administrators have no access; administrator consultation management is out of scope.
- All unauthorized or deactivated users must be refused server-side.

## Functional requirements

- The lecturer can view upcoming consultations associated with their account.
- The lecturer can open only the student name, email, topic, questions, course, slot time, and booking status.
- Approved consultations become completed automatically after their scheduled end time.
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
- Approved before start is `upcoming`; between start and end is `ongoing`; after end is `completed`.
- Completion is not reversible, and Lecturer notes are out of scope.

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

None. This draft is retained only as historical context and is superseded by the approved completion specification.

## Change log

| Date       | Change                                                                                              | By                  |
| ---------- | --------------------------------------------------------------------------------------------------- | ------------------- |
| 2026-10-19 | Initial draft based on repository inspection                                                        | Codex               |
| 2026-10-20 | Superseded by the approved consultation-completion specification; recorded Lecturer owner decisions | human feature owner |
