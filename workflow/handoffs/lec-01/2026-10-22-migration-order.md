# Handoff: migration order fix after #42 and #44 — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-MIGRATION-ORDER",
"requirementIds": ["LEC-01-AC13", "STU-01-AC21"],
"status": "passed",
"changedFiles": ["supabase/migrations/20261019000000_lecturer_consultation_availability.sql", "supabase/migrations/20261022010000_student_derived_completed_status.sql", "supabase/migrations/20261022040000_lecturer_course_read.sql", "supabase/migrations/20261022050000_lecturer_data_access_functions.sql", "supabase/migrations/20261022060000_lecturer_slot_confirmation.sql", "workflow/handoffs/lec-01/2026-10-22-migration-order.md"],
"verification": [
{"check": "Develop deploy run 39771770522 (before this fix)", "result": "failed", "evidence": "supabase db push: Found local migration files to be inserted before the last migration on remote database: 20261022000000_lecturer_course_read.sql"},
{"check": "Apply 20261021110000, 20261022010000, 20261022040000, 20261022050000, 20261022060000 in order on the shared local database inside a rolled-back transaction", "result": "passed", "evidence": "all applied with ON_ERROR_STOP; 8 lecturer functions created; authenticated has no select on consultation_slots; list_my_bookings still derives completed; transaction rolled back"},
{"check": "Fresh-stack migrations and pgTAP (CI Database rules job)", "result": "not run locally", "evidence": "runs on the pull request"}
],
"unresolvedIssues": ["Any local database that applied the #42 branch keeps the old version numbers and needs a local reset; the shared local stack was not reset."]
}

<!-- HANDOFF:END -->

- Date: 2026-10-22

## What changed

The dev database had already applied `20261022010000_student_derived_completed_status` from #44
when #42 renamed that file to `030000` and reused `010000` for a lecturer migration. `supabase db
push` then refused to run, so the lecturer fixes never reached the dev database.

| File                                                    | Change                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `20261022030000_student_derived_completed_status.sql`   | Back to `20261022010000`, the version the dev database already recorded                      |
| `20261022000000_lecturer_course_read.sql`               | Renamed to `20261022040000`                                                                  |
| `20261022010000_lecturer_data_access_functions.sql`     | Renamed to `20261022050000`; comment on its defensive `revoke` updated                       |
| `20261022020000_lecturer_slot_confirmation.sql`         | Renamed to `20261022060000`                                                                  |
| `20261019000000_lecturer_consultation_availability.sql` | Restored to the content production and dev already applied (the seven `grant` lines removed) |

No migration content changed apart from that one comment, and the lecturer files keep their
relative order. None of these versions exist in production yet, so the next release applies them
in this order.

## Next decision

A teammate reviews the pull request (migrations are a sensitive path), then the develop deploy
should apply `040000`–`060000` cleanly.
