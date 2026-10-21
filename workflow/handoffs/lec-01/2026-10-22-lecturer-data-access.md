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

## Independent security review (22 Oct)

A read-only `security_reviewer` reviewed commit `35cefa2`: **passed with findings**. It found no
problem with the role checks, identity from `auth.uid()`, `search_path`, function grants, the absence
of table grants, cross-lecturer access, the briefing context (no student email), the save function's
parity with the original insert policy, `wrapUntrusted`, or the inline delete action.

| Finding                                                                                          | Severity | Disposition                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1: the old `courses` policy was not buggy, because `cl.course_id = id` resolves to `courses.id` | Low      | **Rejected, with evidence.** An unqualified column inside a subquery resolves to the nearest table that has it; `course_lecturers` has `id`, so `id` meant `cl.id`. `pg_policies` stores the policy as `cl.course_id = cl.id`. The comment stays.          |
| F2: the write functions lacked the house handler for lock and serialization failures             | Low      | **Fixed.** `lecturer_create_slot`, `lecturer_update_slot` and `lecturer_delete_slot` now return `temporarily_unavailable` with a `correlationId`, like the ADM-02 functions. The action shows its generic "Please try again" message. pgTAP re-run: 43/43. |
| F3: a confirmed edit of a booked slot can never succeed (STU-02 trigger)                         | Info     | Already listed under unresolved issues; not a release blocker.                                                                                                                                                                                             |

## Independent tester review (22 Oct)

A `tester_verifier` independently re-ran the new pgTAP suite (43/43), typecheck, lint, `check:spec`
and the unit tests (269 passed), and compared every user-facing message with the previous
`actions.ts`. **Passed**, with four gaps:

| Finding                                                                          | Severity | Disposition                                                                                                                                        |
| -------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1: confirmed edit of a booked slot always returns `reserved`; no test pinned it | Medium   | **Test added** that documents the current behaviour. The spec conflict between LEC-01-AC4/AC7 and STU-02's guard stays open for Jordan and Joseph. |
| D2: no TypeScript unit tests for `actions.ts`, `page.tsx` or `ai-briefing.ts`    | Low      | **Open.** All proof is at the database layer plus the browser run. A follow-up should mock the RPC client and test the message mapping.            |
| D3: no administrator or signed-out caller in the fixtures                        | Low      | **Tests added**: an administrator gets no slots, cannot create a slot or read briefing context; `anon` cannot execute the functions.               |
| D4: only `select` privilege was asserted                                         | Low      | **Test added**: `authenticated` and `anon` have no insert, update or delete on the four tables.                                                    |

pgTAP after the additions: **49/49**.
