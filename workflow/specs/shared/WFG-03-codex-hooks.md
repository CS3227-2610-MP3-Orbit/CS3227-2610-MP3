---
id: WFG-03
title: Codex development hooks
owner: team
status: draft
---

# WFG-03: Codex development hooks

## Acceptance criteria

- **WFG-03-AC1** Ordinary development commands through the supported intercepted path are allowed.
- **WFG-03-AC2** Pre-action interception denies protected-branch force pushes, destructive Git operations, and direct production/deployment operations without executing them.
- **WFG-03-AC3** Completion checking detects missing/malformed handoffs and accepts a structured handoff with requirement IDs, changed files, actual results, and unresolved issues.
- **WFG-03-AC4** Truthful blocked/not-run evidence is accepted and automatic continuation is limited to one retry.
- **WFG-03-AC5** Hook input, malformed input, internal errors, and timeout behavior are handled and documented.
- **WFG-03-AC6** Hooks execute no inspected command and log no complete arguments, secrets, environment values, or handoff content.
- **WFG-03-AC7** Evidence separates unit logic, registration/handler invocation, native Codex behavior, adversarial behavior, and remote settings.
- **WFG-03-AC8** Documentation explains hook self-modification risk and the external controls that reduce it.

## Human review

- Reviewed commit/digest:
- Reviewer other than author:
- Decision: pending
