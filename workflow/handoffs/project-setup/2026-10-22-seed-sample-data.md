# Handoff: reusable sample-data seed for local, dev and prod — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-SEED-SAMPLE-DATA",
"requirementIds": [],
"status": "passed",
"changedFiles": ["workflow/scripts/seed-sample-data.mjs", "docs/DeveloperGuide.md", "workflow/README.md", "workflow/handoffs/project-setup/2026-10-22-seed-sample-data.md"],
"verification": [
{"check": "node workflow/scripts/seed-sample-data.mjs local (first run, shared local stack)", "result": "passed", "evidence": "1 course, 1 assignment, 2 announcements, 7 slots, 4 bookings created; 6 open future slots"},
{"check": "Second run on the same database", "result": "passed", "evidence": "0 of everything created (idempotent)"},
{"check": "Unknown environment argument", "result": "passed", "evidence": "prints usage and exits 1"},
{"check": "Seeded bookings read through public.list_my_bookings as the demo student, with 20261022010000 applied in a rolled-back transaction", "result": "passed", "evidence": "pending, approved, rejected and completed"},
{"check": "Local cleanup", "result": "passed", "evidence": "deleted exactly the rows created after the run started (4 bookings, 7 slots, 1 assignment, 2 announcements, 1 course)"},
{"check": "Runs against dev and prod", "result": "not run", "evidence": "needs .env.secrets; a teammate runs it"}
],
"unresolvedIssues": ["Not tied to a feature acceptance criterion: this is test-data tooling, not product behaviour.", "The script writes with the service-role key, so it does not exercise the app's role checks; the browser smoke test still does."]
}

<!-- HANDOFF:END -->

- Date: 2026-10-22
- Why: testers and graders need courses, open slots and bookings in every status to try each role,
  and a completed booking cannot be created through the app without waiting for a slot to end.

## Next decision

A teammate reviews the pull request, then runs `node workflow/scripts/seed-sample-data.mjs dev`
(and `prod` after the release) from a checkout that has `.env.secrets`.
