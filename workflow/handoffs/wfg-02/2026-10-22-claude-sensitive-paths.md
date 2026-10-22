# Handoff: treat `.claude/` as an agent-control path — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-CLAUDE-SENSITIVE-PATHS",
"requirementIds": ["WFG-02-AC2"],
"status": "passed",
"changedFiles": ["workflow/hooks/lib.mjs", "workflow/hooks/hooks.test.mjs", "workflow/scripts/review-sensitive-changes.mjs", "workflow/scripts/review-sensitive-changes.test.mjs", "workflow/policies/approval-gates.md", "workflow/handoffs/wfg-02/2026-10-22-claude-sensitive-paths.md"],
"verification": [
{"check": "npm run test:workflow", "result": "passed", "evidence": "hooks 16/16 (new: .claude/agents, .claude/settings.json and .codex edits return review); workflow vitest 18/18"},
{"check": "classifyPaths on .claude/agents/developer.md and .claude/settings.json", "result": "passed", "evidence": "both classified as agent controls"},
{"check": "npm run check:spec", "result": "passed", "evidence": "exit 0"},
{"check": "npx prettier --check (changed files)", "result": "passed", "evidence": "All matched files use Prettier code style"}
],
"unresolvedIssues": []
}

<!-- HANDOFF:END -->

- Date: 2026-10-22
- Source: review of #26, which added `.claude/` to CODEOWNERS next to `.codex/` but not to the
  hook, the classifier or the approval-gate table.

## What changed

| Surface                                          | Before                                       | After                        |
| ------------------------------------------------ | -------------------------------------------- | ---------------------------- |
| Pre-tool-use hook `reviewPaths`                  | `.claude/` edits returned `allow`            | They return `review`         |
| `check:sensitive` "agent controls" category      | `.claude/`-only diffs reported not triggered | Classified as agent controls |
| `workflow/policies/approval-gates.md` gate table | Named `.codex` only                          | Names `.codex` and `.claude` |

## Next decision

A teammate approves the pull request (agent-control paths are a sensitive gate).
