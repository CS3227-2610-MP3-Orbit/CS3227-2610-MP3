# AI Interaction Evidence Logs

Use this directory for verified summaries of agent and skill interactions. Do not reconstruct or
fabricate historical conversations. If a prior interaction cannot be retrieved, record it as
unavailable.

## Required record

Each log should include:

- Date and task
- Agent role used
- Skill invoked, if any
- Specification reference and approval status
- Important prompts or a safe summary of them
- Files changed
- Tests and commands executed, with results
- Security findings
- Human corrections and decisions
- Outcome and limitations

## Privacy and security

- Never include secrets, credentials, tokens, or full sensitive user content.
- Summarize prompts when verbatim text is unnecessary.
- Link to repository evidence where possible.
- Distinguish observed results from expected behavior and pending work.
- Record the human decision separately; an agent must not mark its own output approved.

## Suggested filename

Use `YYYY-MM-DD-<task>-<agent>.md`, for example `2026-10-19-lecturer-workflow-review-reviewer.md`.
