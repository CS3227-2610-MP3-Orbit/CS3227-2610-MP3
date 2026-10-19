# Task handoff

Outcome: complete | blocked | incomplete
Task ID: TASK-ID
Requirement IDs: REQ-ID, REQ-ID-AC1

## Changed files

- `path`: concise description, or `None — reason`.

## Checks run and actual results

- `command`: passed/failed/blocked, with the actual result. Never claim an unrun check passed.

## Checks not run and reasons

- `command`: reason, or `None — all planned checks ran`.

## Unresolved issues

- Remaining finding or decision, or `None known`.

## Next action

- One concrete human or agent action.

This final-message handoff is checked by the Stop hooks. When the role also requires a persistent
handoff note, copy the evidence into `workflow/handoffs/_TEMPLATE.md`. The handoff records claims;
the tester, security reviewer, CI, or a human must independently verify them.
