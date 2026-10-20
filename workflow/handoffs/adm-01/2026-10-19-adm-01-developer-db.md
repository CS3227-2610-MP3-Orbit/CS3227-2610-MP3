# Handoff: TASK-ADM-01A / ADM-01-R3,R4,R5,R7,R8 — developer (database layer) → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-01A",
"requirementIds": ["ADM-01-R3", "ADM-01-R4", "ADM-01-R5", "ADM-01-R7", "ADM-01-R8"],
"status": "passed",
"changedFiles": [
"supabase/migrations/20261020000000_admin_account_management.sql",
"supabase/tests/admin_account_management.test.sql",
"workflow/handoffs/adm-01/2026-10-19-adm-01-developer-db.md"
],
"verification": [
{"check": "npx supabase db reset --local", "result": "passed", "evidence": "all 7 migrations applied cleanly, seed ran, no errors"},
{"check": "npx supabase test db", "result": "passed", "evidence": "Files=6, Tests=88, Result: PASS (52 pre-existing + 36 new, 0 failed)"},
{"check": "npx supabase db lint --level error", "result": "passed", "evidence": "'No schema errors found'"},
{"check": "npx prettier --check <new files>", "result": "not-applicable", "evidence": "prettier reports 'No parser could be inferred' for .sql; no sql plugin installed, .prettierignore does not exempt supabase/, no other .sql file in the repo is prettier-formatted either"},
{"check": "git status/diff scoped to allowed paths", "result": "passed-with-finding", "evidence": "my own diff touches only the 3 allowed files; see Findings #1 for pre-existing unrelated dirty-tree state discovered, not caused by this task"}
],
"unresolvedIssues": [
"Finding #1 (process, not code): the live working tree has an uncommitted, out-of-scope edit to workflow/specs/admin/ADM-01-manage-accounts.md that reverts frontmatter status to draft and marks the 7f6c579 approval superseded pending a new ADM-01-R9 (password reset); I did not make this edit and did not rely on it -- my implementation targets the approved 7f6c579 content for R3/R4/R5/R7/R8, which the draft text itself states are unchanged by the R9 addition. Untracked src/features/admin/accounts/password.ts and workflow/specs/shared/SH-06-change-own-password.md also exist from the same apparently-concurrent effort. Coordinator should confirm which agent owns that in-flight change and reconcile before merge.",
"AC14's true concurrent-backend race is not-run/blocked in pgTAP by construction (one session, one transaction at a time); see Evidence and the test file's comments for the sequential proxy used instead."
]
}
<!-- HANDOFF:END -->

- Date: 2026-10-19
- Task ID: TASK-ADM-01A (database layer of ADM-01, GitHub issue #18)
- Requirement IDs: ADM-01-R3, R4, R5, R7, R8 (at the database layer)
- AC IDs covered in pgTAP: AC5, AC6, AC7, AC8, AC9, AC14 (sequential proxy; concurrent case
  not-run/blocked), AC15, AC16, plus AC10 (non-admin/anon direct-call refusal, reinforcing
  AC6/AC8's security coverage)
- Specification: `workflow/specs/admin/ADM-01-manage-accounts.md`
- Specification version/commit used: `7f6c579` (frontmatter `status: approved`, owner approval by
  Johannsen recorded in Document control), as named in my assignment envelope
- Latest handoff read: `workflow/handoffs/adm-01/2026-10-19-adm-01-requirements-architect.md`
- Allowed edit paths used (exactly these three, nothing else):
  `supabase/migrations/20261020000000_admin_account_management.sql`,
  `supabase/tests/admin_account_management.test.sql`, this handoff.

## Status

passed

## Scope and gate

Task TASK-ADM-01A, requirement IDs ADM-01-R3/R4/R5/R7/R8, implemented against spec commit `7f6c579`
(approved). Allowed edit paths: one new migration, one new pgTAP file, one new handoff — all three
and nothing else were touched (see `git status --porcelain` in Evidence).

**Deviation to report**: at the time of this work, the live working tree already had an uncommitted,
unstaged edit to the spec file (not made by me — I only ever read it, never wrote to it) that
reverts its frontmatter to `status: draft`, marks the `7f6c579` approval "Superseded", and adds a new
proposed `ADM-01-R9` (admin password reset) awaiting owner confirmation. The same uncommitted state
includes untracked `src/features/admin/accounts/password.ts` and
`workflow/specs/shared/SH-06-change-own-password.md`, neither in my scope. That draft text itself
states "Prior requirements R1–R8 are unchanged by this revision," and R9 is unrelated to my assigned
R3/R4/R5/R7/R8 (it is a Server Action + `auth.admin` concern, not a database/RLS/RPC change). I
therefore implemented against the `7f6c579`-approved R3/R4/R5/R7/R8 content as my envelope
specified, made no changes related to R9, and did not edit the spec file. The coordinator should
still reconcile this pre-existing dirty-tree state (likely a concurrent, uncommitted
requirements_architect/developer session on the same checkout) before any merge, since the spec's
on-disk approval status no longer matches what a reviewer would see if they read the file right now.

## Changes

- `supabase/migrations/20261020000000_admin_account_management.sql` (new):
  - Adds `profiles.is_protected boolean not null default false` and a unique partial index
    (`profiles_protected_singleton_idx on profiles (is_protected) where is_protected`) allowing at
    most one `true` row.
  - Marks the earliest-created active admin (`order by created_at, id`) as protected if one exists
    and none is marked yet (idempotent against being skipped entirely when no admin exists yet,
    matching the spec's "if none exists yet, the script marks it later").
  - Drops policy `"profiles: admin updates"` and revokes `UPDATE` on `public.profiles` from
    `anon, authenticated` entirely (verified no other policy or grant permits any authenticated/anon
    write to `profiles`; the only remaining writers are the two new `security definer` RPCs, which
    run as the function owner and are unaffected by the revoke, and a maintainer's own migration/
    script).
  - Adds `public.admin_set_role(target_id uuid, new_role public.app_role)` and
    `public.admin_set_active(target_id uuid, active boolean)`: `security definer`,
    `set search_path = ''`, `lock_timeout`/`statement_timeout` guarded. Each checks
    `current_app_role() = 'admin'`; refuses a null target or (after that) a self-target
    (`forbidden_self_change`, R5, checked before any further field validation so it fires
    "regardless of the requested value"); refuses a null role/active value; serializes on
    `pg_advisory_xact_lock(82010001)` (one fixed key shared by both functions) before the target
    lookup; refuses an unknown target or a protected target (`forbidden_protected`, R8); computes
    the resulting active-admin count excluding the target and refuses a zero outcome
    (`forbidden_zero_admins`, R7); then writes the single column and returns
    `{"kind":"success",...}`. Catches `lock_not_available`/`deadlock_detected`/
    `serialization_failure`/`query_canceled` into `{"kind":"temporarily_unavailable",...}`.
  - Revokes `execute` on both functions from `public, anon, authenticated`, grants to
    `authenticated` only.
  - Named parameters (`target_id`, `new_role`, `active`) match my task envelope exactly rather than
    the spec prose's own naming (`role`, `is_active`) — this is a non-behavioral rename to avoid the
    parameter shadowing the `profiles.role`/`profiles.is_active` columns inside the function body;
    reported as a difference per instructions, not a defect.
  - No-op changes (same role / same active state on a non-self, non-protected target) are not
    special-cased: they pass every check (the invariants they'd need to violate were already true
    beforehand) and the function performs a harmless same-value `UPDATE`, returning `success`. I
    did not find an explicit no-op row in the spec's edge-case table, so this is the documented
    interpretation.
- `supabase/tests/admin_account_management.test.sql` (new): pgTAP suite, `[ADM-01-ACn]`-tagged
  assertions per the coordinator's naming instruction; see Evidence/Findings for AC14's scope.
- `workflow/handoffs/adm-01/2026-10-19-adm-01-developer-db.md` (new): this handoff.

## Decisions and assumptions

- Parameter renames (`new_role`/`active` instead of the spec prose's `role`/`is_active`) are
  authorized by my task envelope's exact signatures; functionally identical, avoids column-name
  shadowing. Reported above as the one naming difference from the spec's literal prose.
- Error-shape convention: reused the existing `jsonb_build_object('kind', ...)` convention from
  `student_manage_bookings`/`student_request_consultation` RPCs (not the `'status'`-keyed shape used
  by `browse_available_slots`), since the spec's own error-code vocabulary
  (`forbidden_self_change`, `forbidden_zero_admins`, `forbidden_protected`, `forbidden_or_not_found`,
  `validation_error`) matches that family's naming one-for-one.
- Check ordering: self-target refusal is evaluated before the protected/zero-admin checks and before
  field-value validation (but after confirming the target id itself is non-null, since that's needed
  to even compare it to the caller), to honor "refused ... regardless of the requested value."
  Protected-target refusal is evaluated before the zero-admin count, matching the edge-case table's
  ordering and the "no one, not even itself" framing for R8 (a protected admin's own self-attempt is
  still reported as `forbidden_self_change` since R5 is checked first; the spec's edge-case table
  only requires that it be refused, not which specific code is returned, and documents that both
  rules apply).
- Defense-in-depth beyond the spec's literal text: revoked table-level `UPDATE` on `profiles` from
  `anon, authenticated` (spec only required dropping the admin-update policy). Verified first that no
  other migration or `src/` code performs a direct table update on `profiles` (grep across both), so
  this cannot regress any existing behavior; it makes `AC16`'s refusal a clean privilege-level
  `42501` rather than a silent zero-row RLS no-op, and is consistent with how every other
  RPC-only table in this codebase (`bookings`, `consultation_slots`, `courses`, …) is already locked
  down.
- AC14 (true concurrency): pgTAP cannot open two simultaneous transactions in one session. I proved
  (by construction, and verified empirically) that under this design a single legitimate call can
  never itself observe `forbidden_zero_admins`, because the caller must pass the admin-authorization
  check and is never the target, so the caller always counts toward the post-change total — the
  explicit zero-admin branch only exists to catch the genuine two-backend race (second caller's
  authorization check ran on stale pre-commit data). I tested the reachable sequential proxy instead
  (first admin demotes the second; the now-demoted second admin's own later attempt is refused by the
  ordinary admin-only check, since it is no longer an admin) and marked the true-concurrency case
  `not-run`/`blocked` with an explanatory `pass()` note in the test file and here, per the
  instruction not to fake it.

## Evidence

| Command                                                                                                                                 | Result              | Evidence                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx supabase db reset --local`                                                                                                         | passed              | all 7 migrations (including the new one) applied, seed ran, no errors                                                                                                                                                                                     |
| `npx supabase test db`                                                                                                                  | passed              | `Files=6, Tests=88, 0 wallclock secs ... Result: PASS` (52 pre-existing STU/SH tests + 36 new ADM-01 tests, 0 failed)                                                                                                                                     |
| `npx supabase db lint --level error`                                                                                                    | passed              | `No schema errors found`                                                                                                                                                                                                                                  |
| `npx prettier --check supabase/migrations/20261020000000_admin_account_management.sql supabase/tests/admin_account_management.test.sql` | not-applicable      | `No parser could be inferred for file ...sql` — this repo has no prettier SQL plugin and no other `.sql` file is prettier-formatted either; `.prettierignore` already excludes other generated/build paths but SQL is simply unsupported by prettier here |
| `grep -rn "update public.profiles" supabase/migrations/*.sql` (before my migration)                                                     | passed              | no match — confirms no existing migration wrote to `profiles`, so the privilege revoke is safe                                                                                                                                                            |
| `grep` for direct `profiles` table updates in `src/`                                                                                    | passed              | no match found                                                                                                                                                                                                                                            |
| `git status --porcelain`                                                                                                                | passed-with-finding | only my 3 files are new/mine; a pre-existing, not-mine modification to the spec and 2 unrelated untracked files were already present (see Findings #1)                                                                                                    |

## Findings and unresolved questions

| #   | Severity         | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Owner           |
| --- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1   | Medium (process) | Working tree already had an uncommitted edit to `workflow/specs/admin/ADM-01-manage-accounts.md` reverting `status: approved` → `draft` and marking the `7f6c579` approval "Superseded" pending a new, owner-unconfirmed `ADM-01-R9`; plus untracked `src/features/admin/accounts/password.ts` and `workflow/specs/shared/SH-06-change-own-password.md`. Not made by me, not in my scope, and the draft text itself says R1–R8 are unchanged by it — but the coordinator should reconcile the apparent concurrent/uncommitted session before merge, since a reviewer reading the file today would see `draft`, not the `approved` status my envelope cited. | coordinator     |
| 2   | Low              | `ADM-01-AC14`'s literal `forbidden_zero_admins` branch is reachable only by genuine two-backend concurrency (reasoning in Decisions above); pgTAP tests the reachable sequential invariant instead and marks the true race not-run/blocked. If the team wants direct coverage of that exact branch, it needs a two-connection integration test (e.g. two `pg` clients or two Node processes racing the RPC), which is outside pgTAP and outside this task's allowed paths.                                                                                                                                                                                  | tester_verifier |

## Next action

Independent verification (tester_verifier/security_reviewer): re-run `npx supabase db reset --local`
and `npx supabase test db` against this migration and test file; review the migration's check
ordering (self → protected → zero-admin) and the advisory-lock serialization against ADM-01-R5/R7/R8;
confirm Finding #1's spec-approval discrepancy with the coordinator before this work is merged or
built upon by a Server Action layer.

Handoff evidence: workflow/handoffs/adm-01/2026-10-19-adm-01-developer-db.md
