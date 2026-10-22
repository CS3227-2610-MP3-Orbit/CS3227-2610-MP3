# Handoff: migration history order fix — developer → human reviewer

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "PROJECT-SETUP-MIGRATION-ORDER-FIX",
"requirementIds": ["Restore deployed migration identity", "Append unapplied lecturer migrations in order", "Update migration references"],
"status": "passed",
"changedFiles": ["supabase/migrations/20261022010000_student_derived_completed_status.sql", "supabase/migrations/20261022040000_lecturer_course_read.sql", "supabase/migrations/20261022050000_lecturer_data_access_functions.sql", "supabase/migrations/20261022060000_lecturer_slot_confirmation.sql", "workflow/handoffs/lec-01/2026-10-22-lecturer-data-access.md", "workflow/handoffs/project-setup/2026-10-22-migration-order-fix.md"],
"verification": [
{"check": "ls supabase/migrations | cut -c1-14 | sort | uniq -d", "result": "passed", "evidence": "Printed no duplicate migration versions."},
{"check": "git diff 44383be -- supabase/migrations/20261022010000_student_derived_completed_status.sql", "result": "passed", "evidence": "Empty after restoring the deployed blob byte-for-byte; cmp against git show 44383be also passed."},
{"check": "Compare every migration through 20261021200000 with 44383be", "result": "passed", "evidence": "All historical files existed with identical bytes."},
{"check": "Compare three renamed lecturer migration contents against their original HEAD blobs", "result": "passed", "evidence": "All three cmp checks passed; SQL bodies unchanged."},
{"check": "Repository-wide old-version reference search (excluding node_modules and .git)", "result": "passed", "evidence": "Only stale references found were in the LEC-01 handoff; updated to 20261022050000. Follow-up search found no stale names/versions."},
{"check": "npx supabase db reset --local", "result": "passed", "evidence": "Applied all migrations in corrected order and finished local reset on branch bug-database."},
{"check": "npm run test:db", "result": "passed", "evidence": "14 files, 275 tests; Result: PASS. Initial attempt failed before tests because telemetry write was sandbox-blocked; approved retry passed."},
{"check": "npm run typecheck", "result": "passed", "evidence": "Next route types generated; tsc --noEmit completed."},
{"check": "npm run lint", "result": "passed", "evidence": "eslint completed without findings."},
{"check": "npm test", "result": "passed", "evidence": "37 test files, 281 tests passed."},
{"check": "npm run check:spec", "result": "passed", "evidence": "Exit success; reported draft-criterion coverage warnings (recorded by command output)."}
],
"unresolvedIssues": ["Current working branch is bug-database, not fix/migration-order from origin/develop; branch switching was not performed after the user authorized work in the current branch. No commit was created; a human should review the diff and arrange the requested PR workflow."]
}

<!-- HANDOFF:END -->

- Date: 2026-10-22
- Task ID: PROJECT-SETUP-MIGRATION-ORDER-FIX
- Requirement / acceptance-criterion IDs: Restore deployed migration identity; append unapplied lecturer migrations in order; update references.
- Specification: User-provided bounded migration repair instructions; no separate approved feature spec applies.
- Specification version or commit: The incident baseline is commit `44383be`; the current checkout is on `bug-database`.
- Specification status and human approver: Scope and actions explicitly authorized by the user in this conversation.
- Relevant context files: `workflow/templates/task-handoff.md`, `.codex/agents/developer.toml`, `workflow/policies/development-security.md`, `44383be` migration history.
- Allowed edit scope: Four migration paths (rename/restore only), stale migration references, this handoff.
- Agent session log: None.

## Decisions and assumptions

- The development database history at `44383be` records the deployed student migration as version `20261022010000`. Restoring that exact path and blob preserves the remote migration identity.
- The lecturer migrations were not present in `44383be` and were never applied to a shared database. They now follow all existing versions in their original relative order.
- Work was performed on the current `bug-database` branch per the user's direction. It was not rebased onto `origin/develop` and no new `fix/migration-order` branch was created.

## Before and after migration list

Before:

```text
20261022000000_lecturer_course_read.sql
20261022010000_lecturer_data_access_functions.sql
20261022020000_lecturer_slot_confirmation.sql
20261022030000_student_derived_completed_status.sql
```

After:

```text
20261022010000_student_derived_completed_status.sql
20261022040000_lecturer_course_read.sql
20261022050000_lecturer_data_access_functions.sql
20261022060000_lecturer_slot_confirmation.sql
```

## Changes

- Restored `20261022010000_student_derived_completed_status.sql` byte-for-byte from `44383be`.
- Used `git mv` for the three lecturer migrations; their contents are unchanged.
- Updated the lecturer data-access handoff's old migration version/path references.
- No application code or other existing migration was edited.

## Evidence

| Command or check | Result: passed / failed / blocked / unexecuted | Evidence |
| --- | --- | --- |
| `ls supabase/migrations \| cut -c1-14 \| sort \| uniq -d` | passed | No output. |
| `git diff 44383be -- supabase/migrations/20261022010000_student_derived_completed_status.sql` | passed | Empty. |
| Compare migration files through `20261021200000` with `44383be` | passed | Names and bytes unchanged. |
| Compare lecturer migration content to pre-rename `HEAD` blobs | passed | Three byte comparisons succeeded. |
| Search old migration references, excluding `node_modules` | passed | Stale handoff references updated; no old names remained. |
| `npx supabase db reset --local` | passed | Corrected migration order applied and local reset completed. |
| `npm run test:db` | passed | 14 files, 275 tests. First attempt was blocked by telemetry filesystem permission; approved retry passed. |
| `npm run typecheck` | passed | Route type generation and TypeScript check passed. |
| `npm run lint` | passed | ESLint passed. |
| `npm test` | passed | 37 files, 281 tests passed. |
| `npm run check:spec` | passed | Exit success; draft criteria produced coverage warnings. |

Teammates with a local Supabase instance must run `npx supabase db reset` after pulling this change.

## Changes outside the owner's area

`supabase/migrations/` is shared and requires teammate review before merge. No application code changed.

## Findings and open questions

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | Process | Current branch is `bug-database`, not a new `fix/migration-order` branch from `origin/develop`. | Human to decide branch/PR handling. |
| 2 | Process | No commit was created. | Human review of the diff and PR workflow remains required. |

## Next action

A human reviews the pull request, merges it to `develop`, and confirms the develop deploy's **Apply database migrations** step passes.

## Human review

- Reviewed by:
- Decision: pending
- Notes:
