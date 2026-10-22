# Handoff: create dialogs refresh the list behind them — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-SH07-CREATE-REFRESH",
"requirementIds": ["SH-07-R19", "SH-07-AC23"],
"status": "passed",
"changedFiles": ["workflow/specs/shared/SH-07-ui-design-system.md", "src/app/admin/courses/actions.ts", "src/app/admin/accounts/actions.ts", "src/app/admin/announcements/actions.ts", "src/app/admin/create-actions-refresh.test.ts", "workflow/handoffs/sh-07/2026-10-22-create-dialog-refresh.md"],
"verification": [
{"check": "npx vitest run src/app/admin/create-actions-refresh.test.ts", "result": "passed", "evidence": "6/6; the three success cases failed before the change"},
{"check": "npm test", "result": "passed", "evidence": "38 files, 290 tests"},
{"check": "npm run typecheck, eslint, prettier, check:spec", "result": "passed", "evidence": "clean"},
{"check": "admin-courses, admin-accounts, admin-announcements e2e (admin.playwright.config.ts, port 3104, shared local stack)", "result": "passed", "evidence": "9/9"}
],
"unresolvedIssues": []
}

<!-- HANDOFF:END -->

- Date: 2026-10-22
- Source: testing on dev. A created course, account or announcement only appeared after a manual
  reload, because the create Server Actions returned their result without refreshing the page.

## What changed

`createCourseAction`, `createAccountAction` and `createAnnouncementAction` call `refresh()` from
`next/cache` (the Next 16 Server Action API for refreshing the client router) when the create
succeeds. The dialog stays open with its unchanged success message, which the account dialog needs
for the one-time password; a failed create does not refresh.

## Next decision

A teammate reviews the pull request.
