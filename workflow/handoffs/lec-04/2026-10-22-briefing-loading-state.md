# Handoff: AI briefing loading state — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-LEC04-LOADING-STATE",
"requirementIds": ["LEC-04-AC8"],
"status": "passed",
"changedFiles": ["workflow/specs/lecturer/LEC-04-ai-briefing.md", "src/components/briefing-button.tsx", "src/components/briefing-button.test.ts", "workflow/handoffs/lec-04/2026-10-22-briefing-loading-state.md"],
"verification": [
{"check": "npx vitest run src/components/briefing-button.test.ts", "result": "passed", "evidence": "2/2: idle button enabled; pending button disabled with 'Generating briefing…' and a role=status message (pending test failed before the change)"},
{"check": "npm run typecheck", "result": "passed", "evidence": "clean"},
{"check": "eslint and prettier on changed files", "result": "passed", "evidence": "clean"},
{"check": "npm run check:spec", "result": "passed", "evidence": "exit 0"},
{"check": "Browser check on dev", "result": "not run", "evidence": "after merge and deploy"}
],
"unresolvedIssues": ["The lecturer page lists an approved booking whose slot has ended under Active consultations (seen with the seeded completed booking on dev); not changed here."]
}

<!-- HANDOFF:END -->

- Date: 2026-10-22
- Source: testing on dev. Clicking Generate AI briefing gave no feedback for up to 20 seconds.

## What changed

`BriefingButton` is now a client component. A `useFormStatus` submit button is disabled while its
request is in flight, swaps its icon for a spinner, reads "Generating briefing…", and a
`role="status"` line says it can take up to 20 seconds. It uses the shared `Button`, replacing the
unstyled button.

## Next decision

Jordan (lecturer owner) reviews the pull request and the LEC-04-AC8 addition.
