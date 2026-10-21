# Handoff: lecturer data access fix — coordinator → Lecturer owner

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "LEC-01-DATA-ACCESS",
"requirementIds": ["LEC-01-AC1", "LEC-01-AC2", "LEC-01-AC3", "LEC-01-AC5", "LEC-01-AC6", "LEC-01-AC7", "LEC-01-AC8", "LEC-01-AC9", "LEC-01-AC13", "LEC-01-AC14", "LEC-04-AC7"],
"status": "passed",
"changedFiles": ["workflow/specs/lecturer/LEC-01-availability.md", "workflow/specs/lecturer/LEC-04-ai-briefing.md", "supabase/tests/lecturer_data_access.test.sql", "supabase/migrations/20261022000000_lecturer_data_access_functions.sql", "src/app/lecturer/actions.ts", "src/app/lecturer/page.tsx", "src/features/lecturer/ai-briefing.ts", "workflow/handoffs/lec-01/2026-10-22-lecturer-data-access.md"],
"verification": [
{"check": "new pgTAP suite before the migration", "result": "failed", "evidence": "function public.lecturer_list_my_courses() does not exist"},
{"check": "new pgTAP suite after the migration", "result": "passed", "evidence": "43/43"},
{"check": "npx supabase test db (all suites)", "result": "passed", "evidence": "Files=12, Tests=223, Result: PASS"},
{"check": "npx supabase db lint --local", "result": "passed", "evidence": "no findings for the new functions"},
{"check": "npm run typecheck, npm run lint, prettier --check .", "result": "passed", "evidence": "clean"},
{"check": "npx vitest run --exclude 'workflow/**'", "result": "passed", "evidence": "176 passed"},
{"check": "browser, local app as demo-lecturer", "result": "passed", "evidence": "dashboard lists 2 own slots and the assigned course; a slot created through the form was saved; it was deleted through the UI; an AI briefing was generated in 2.8 s with the SoC LLM default model and saved"}
],
"unresolvedIssues": ["LEC-01-AC4/AC7 promise that a confirmed edit of a slot with an active booking succeeds, but STU-02's guard_requested_slot_details trigger refuses any change to such a slot. lecturer_update_slot returns 'reserved' instead of failing. Slot editing is not exposed in the UI. The two specs need reconciling."]
}

<!-- HANDOFF:END -->

- Date: 2026-10-22
- Specifications: `LEC-01-availability.md` (adds "Data access path", AC13 and AC14) and
  `LEC-04-ai-briefing.md` (adds AC7), approved by Johannsen as coordinator on 22 Oct. Jordan reviews
  in the pull request.

## What was broken

STU-01 (`20261018000000`) revokes every direct table privilege on `courses`, `course_lecturers`,
`consultation_slots` and `bookings` from `authenticated`, and `[STU-01-AC21]` tests that. The
lecturer dashboard, the slot actions and the AI briefing all queried those tables directly, so:

- the dashboard always showed 0 slots and no courses, and creating a slot failed with "permission
  denied";
- the AI briefing stopped at "Consultation unavailable." before any AI call;
- saving a briefing would also have failed, because the insert policy on `lecturer_ai_briefings`
  checks ownership by reading `bookings` and `consultation_slots` as the caller.

The pgTAP suites run as the table owner, so none of them noticed.

## What changed

- Seven role-checked `security definer` functions in `20261022000000`: list my courses, list my
  slots, create, update, delete, get briefing context, save briefing. No table privilege was granted,
  so `[STU-01-AC21]` still holds.
- `src/app/lecturer/actions.ts`, `page.tsx` and `src/features/lecturer/ai-briefing.ts` call those
  functions. User-facing messages are unchanged.
- The inline Delete action in `page.tsx` lacked `"use server"`. That crashed the page as soon as a
  slot was listed; it was hidden because the list was always empty.
- The `courses` policy compared `course_lecturers` with itself (`cl.course_id = cl.id`). It is inert
  without a grant, but it is corrected.
- Behaviour tightened on purpose: a course is offered and accepted only while both the assignment
  and the course are active (AC14). Previously an ended assignment still counted.

## Next decision

Jordan to review the spec amendment, the functions and the code. Merge after #36, #37 and #38.
