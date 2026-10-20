# Handoff: TASK-ADM-01C / ADM-01-R10 (AC23, AC24, AC25) — developer (session revocation) → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-01C",
"requirementIds": ["ADM-01-R10", "ADM-01-AC23", "ADM-01-AC24", "ADM-01-AC25"],
"status": "passed",
"changedFiles": [
"supabase/migrations/20261020020000_admin_revoke_sessions.sql",
"supabase/tests/admin_revoke_sessions.test.sql",
"src/features/admin/accounts/validation.ts",
"src/features/admin/accounts/server.ts",
"src/features/admin/accounts/server.test.ts",
"src/app/admin/accounts/account-row.tsx",
"tests/integration/admin-accounts.test.ts",
"workflow/handoffs/adm-01/2026-10-20-adm-01-developer-revoke.md"
],
"verification": [
{"check": "npx supabase migration up --local", "result": "passed", "evidence": "only 20261020020000_admin_revoke_sessions.sql was pending beforehand (confirmed via migration list --local); applied cleanly, no db reset used"},
{"check": "npx supabase test db", "result": "passed", "evidence": "Files=9, Tests=125, 0 failed (includes the concurrent SH-06 agent's password_change_attempts.test.sql, unaffected, plus the new 15-assertion admin_revoke_sessions.test.sql)"},
{"check": "npx supabase db lint --level error", "result": "passed", "evidence": "'No schema errors found'"},
{"check": "npm run lint", "result": "passed", "evidence": "no output, exit 0"},
{"check": "npm run typecheck", "result": "passed", "evidence": "'Types generated successfully', tsc --noEmit clean"},
{"check": "npm test", "result": "passed", "evidence": "15 files passed, 1 pre-existing skipped (unrelated); 120 passed, 4 pre-existing todo (unrelated); includes 10 new/changed admin unit tests. One transient failure (src/features/account/server.test.ts, not my file) was observed mid-round while the concurrent SH-06 agent was still editing its own in-progress change; it had resolved itself by the next run, before I wrote this handoff -- see Findings"},
{"check": "npm run check:spec", "result": "passed-with-finding", "evidence": "Covered 131 (was 125); 0 ADM-01 warnings/errors (AC23/AC24/AC25 all covered); the only 'error:' lines are SH-06-AC8/SH-06-AC10 (approved, no test), explicitly the other agent's scope, not mine, per my assignment envelope"},
{"check": "npm run test:admin:integration", "result": "passed", "evidence": "11/11 tests passed (the prior 10 plus the new AC25 test); verified 0 leftover adm01- fixture rows in auth.users after the run"},
{"check": "npx prettier --write <own files only>", "result": "passed", "evidence": "validation.ts, server.test.ts, tests/integration/admin-accounts.test.ts reformatted; server.ts/account-row.tsx already formatted; .sql not-applicable (no SQL parser, same pre-existing repo-wide limitation as both prior ADM-01 handoffs)"},
{"check": "scope check: git status limited to allowed paths", "result": "passed", "evidence": "my diff touches only the files listed above; src/features/account/**, src/app/account/**, and the SH-06 migration/test files are the concurrent agent's own changes, confirmed not authored by me"}
],
"unresolvedIssues": [
"Finding #1 (process, not code, informational only): mid-round, npm test showed one failing test in src/features/account/server.test.ts (SH-06-owned, outside my allowed paths) because that agent's own changeOwnPassword implementation had started returning an extra otherSessionsEnded field its own test did not yet expect. I never opened that file for editing. By the time I re-ran npm test for this handoff's evidence, it had already resolved (presumably the other agent finished its edit) -- flagging only so the coordinator does not attribute that transient state to this task."
]
}
<!-- HANDOFF:END -->

- Date: 2026-10-20
- Task ID: TASK-ADM-01C (session-revocation slice of ADM-01, GitHub issue #18)
- Requirement IDs: ADM-01-R10
- AC IDs covered: ADM-01-AC23, ADM-01-AC24 (pgTAP, `supabase/tests/admin_revoke_sessions.test.sql`),
  ADM-01-AC25 (integration, `tests/integration/admin-accounts.test.ts`)
- Specification: `workflow/specs/admin/ADM-01-manage-accounts.md`, `status: approved`
- Specification version used: owner re-approval 2026-10-20 ("fix those issues") at commit
  `b676fdf`, which is also repository HEAD at the time of this work (`git log --oneline -1`
  confirms HEAD = `b676fdf`; `git hash-object` on the spec file = `a7243bbc...`). Read R9, R10,
  the documented access-token-validity limitation, the API contract, and the edge-case table.
- Latest handoffs read: `workflow/handoffs/adm-01/2026-10-20-adm-01-developer-app.md` (app layer:
  `createAccount`/`listAccounts`/`setRole`/`setActive`/`resetPassword`, the one-time-password UI),
  `workflow/handoffs/adm-01/2026-10-19-adm-01-developer-db.md` (DB layer: `admin_set_role`/
  `admin_set_active`, `is_protected`, migration `20261020000000_admin_account_management.sql`).
- Allowed edit paths used: new migration + its pgTAP test; `src/features/admin/accounts/{server.ts,
validation.ts}` and `server.test.ts`; `src/app/admin/accounts/account-row.tsx` (the new result
  kind's UI message); `tests/integration/admin-accounts.test.ts`; this handoff. Did not touch
  `presentation.ts` (no change needed there), `src/features/account/**`, `src/app/account/**`,
  `tests/integration/sh06-*`, `tests/e2e/change-password*`, or the SH-06 migration.

## Decisions and assumptions

- **`admin_revoke_sessions(target_id uuid)`** (new migration `20261020020000_admin_revoke_sessions.sql`):
  `security definer`, `set search_path = ''`, owned by `postgres` (same owner as
  `current_app_role()`/`admin_set_role`/`admin_set_active`), so it can read/write `auth.sessions`
  even though that table has row-level security enabled with no policies for any role. Checks
  `current_app_role() = 'admin'`, then the caller's own id (`forbidden_self_change`, R5), then an
  unknown or protected target (`forbidden_or_not_found`/`forbidden_protected`, R8) -- same order as
  `admin_set_role`/`admin_set_active` -- then `delete from auth.sessions where user_id = target_id`.
  No advisory lock: unlike the role/active RPCs, this one never writes `profiles` and has no
  zero-admin invariant to serialize, so there is no concurrent-call race to protect against.
- **Refresh tokens are not deleted separately.** Verified locally via `psql ... \d auth.refresh_tokens`
  that `auth.refresh_tokens.session_id references auth.sessions(id) on delete cascade` (and
  `auth.mfa_amr_claims.session_id` the same), so deleting the target's `auth.sessions` rows already
  removes every refresh token and MFA factor binding tied to them in the same statement. This
  matches the spec's own parenthetical ("deletes the target's rows from `auth.sessions` (refresh
  tokens cascade)") and is pgTAP-verified in `admin_revoke_sessions.test.sql` (AC24), not just
  assumed.
- **Result kind added**: `{kind: "success", targetId, sessionsRevoked}` (count of rows actually
  deleted; 0 is still success -- a target with no live session is not a failure). Other kinds
  (`validation_error`, `forbidden_self_change`, `forbidden_protected`, `forbidden_or_not_found`,
  `temporarily_unavailable`) match the existing `admin_set_role`/`admin_set_active` vocabulary.
- **`resetPassword` (server.ts)**: restructured into three sequential stages sharing one
  cookie-scoped `db` client (self/protected profile lookup, the service-role password write, then
  `db.rpc("admin_revoke_sessions", ...)`), so the revocation call runs under the _caller's own_
  session -- exactly like `setRole`/`setActive` call their RPCs -- not the service-role client. If
  the RPC call throws, returns a non-`success` kind, or returns a payload that fails
  `revokeSessionsResultSchema`'s strict parse, the result is `{kind:
"password_reset_sessions_not_revoked", initialCredential}` -- the new password is still
  returned (it did change) but the kind is distinct from both `success` and `outcome_unknown`,
  per the spec's own exact phrasing in the API-contract section. This can only happen after the
  password write itself already succeeded; a failed password write still short-circuits to
  `outcome_unknown` as before, with no RPC call attempted.
- **UI message (`account-row.tsx`)**: the `password_reset_sessions_not_revoked` kind still opens
  the one-time-password panel (the operator must see and copy the new password), but with an
  additional status message distinct from the plain "Role updated."/success copy, naming the
  residual risk and suggesting deactivation for a suspected compromise -- this is the one UI
  change the assignment anticipated might be needed, and it was.
- **pgTAP isolation**: one assertion (count of all `auth.sessions` rows) initially used a bare
  `count(*)`, which failed once against this shared local database (observed `4`, expected `3`) --
  not a bug in the RPC, but a real extra session row that can legitimately exist in a database
  this task shares with a concurrently running agent. Fixed by filtering every count to this
  test's own fixture ids, never a database-wide count; reported as a decision, not silently
  patched over, since it is the kind of flakiness a reviewer should know was found and why.

## Changes

- `supabase/migrations/20261020020000_admin_revoke_sessions.sql` (new): the RPC; see Decisions.
  Applied with `npx supabase migration up --local` (not `db reset`), confirmed only this file was
  pending first.
- `supabase/tests/admin_revoke_sessions.test.sql` (new): pgTAP, `[ADM-01-ACn]`-tagged; covers the
  function's existence, every refusal in `AC23` (non-admin, self, protected, unknown target, anon
  direct call with no execute grant), `AC24`'s full revocation (including the refresh-token
  cascade and that another user's session/token is untouched), and that revoking an
  already-empty target is still `success`.
- `src/features/admin/accounts/validation.ts`: added the `password_reset_sessions_not_revoked`
  member to `resetResultSchema`, and a new `revokeSessionsResultSchema`/`RevokeSessionsResult` for
  the RPC's own shape.
- `src/features/admin/accounts/server.ts`: `resetPassword` now calls `admin_revoke_sessions` after
  a successful password write; see Decisions.
- `src/features/admin/accounts/server.test.ts`: added a nested `beforeEach` (inside the
  `resetPassword` describe block only) giving `admin_revoke_sessions` a realistic default success
  shape, plus new tests for: the revoke call happens and is ordered after the password write; a
  failed password write never attempts revocation; a non-success/thrown/malformed revoke result
  reports the distinct kind while still carrying the new password; that kind never leaks any
  _other_ generated password.
- `src/app/admin/accounts/account-row.tsx`: `reset()` now branches on the new result kind; see
  Decisions.
- `tests/integration/admin-accounts.test.ts`: added `[ADM-01-AC25]` -- signs a fixture user in for
  a real refresh token, resets their password, then asserts `refreshSession` with the old token
  fails while the new password signs in.

## Evidence

| Command                              | Result              | Evidence                                                                                      |
| ------------------------------------ | ------------------- | --------------------------------------------------------------------------------------------- |
| `npx supabase migration up --local`  | passed              | `{"applied":[".../20261020020000_admin_revoke_sessions.sql"]}`                                |
| `npx supabase test db`               | passed              | `Files=9, Tests=125, ... Result: PASS`                                                        |
| `npx supabase db lint --level error` | passed              | `No schema errors found`                                                                      |
| `npm run lint`                       | passed              | no output                                                                                     |
| `npm run typecheck`                  | passed              | `Types generated successfully`, clean `tsc`                                                   |
| `npm test`                           | passed              | `15 passed \| 1 skipped (16)`, `120 passed \| 4 todo (124)`                                   |
| `npm run check:spec`                 | passed-with-finding | `Covered: 131` (was 125); only `error:` lines are `SH-06-AC8`/`SH-06-AC10` (not mine)         |
| `npm run test:admin:integration`     | passed              | `11 passed (11)`; post-run `select count(*) from auth.users where email like 'adm01-%'` = `0` |
| `npx prettier --write` (own files)   | passed              | 3 files reformatted, 2 already clean; `.sql` not-applicable (no parser)                       |

Playwright/e2e and `npx supabase db reset` were intentionally not run, per this round's
instructions (another agent owns e2e; a reset would wipe the shared DB mid-run for both agents).

## Changes outside the owner's area

None by me. `supabase/migrations/` is shared per CODEOWNERS (needs teammate review per policy;
flagged here as security-sensitive, since it grants a new RPC the ability to delete rows in the
`auth` schema). `src/features/account/**`, `src/app/account/password/change-password-form.tsx`,
and `supabase/migrations/20261020030000_password_change_attempts.sql` /
`supabase/tests/password_change_attempts.test.sql` show modified/untracked in `git status` but are
the concurrent SH-06 agent's own work, not mine (see Finding #1).

## Findings and open questions

| #   | Severity       | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Status                                                  |
| --- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Info (process) | Mid-round, `npm test` showed one failing test in `src/features/account/server.test.ts` (not my file) because the concurrent SH-06 agent's `changeOwnPassword` had started returning an extra `otherSessionsEnded` field its own test did not yet expect. I never opened that file. It had resolved by the next `npm test` run before this handoff was written.                                                                                                             | Informational only; already resolved by the other agent |
| 2   | Low            | The spec's edge-case table lists `admin_revoke_sessions` refusing "self or the protected admin," but does not literally require a `sessionsRevoked` count field in the success payload. I added it (mirrors `admin_set_role`'s `role`/`admin_set_active`'s `isActive` echo-back pattern) since it makes a 0-row "nothing to revoke" outcome visibly distinct from a real revocation in the raw RPC response, though the app layer does not currently surface it to the UI. | Non-blocking; reported for awareness                    |
| 3   | Info           | The documented access-token-validity limitation (an already-issued access token stays valid until it expires, since `getCurrentUser()` verifies it locally via `getClaims` rather than checking revocation) is unchanged by this work, exactly as the spec states; `admin_revoke_sessions` only affects `auth.sessions`/refresh tokens, not already-issued access tokens. No code change was possible or attempted for this; it is spec-accepted, not a defect.            | Informational, matches the spec                         |

## Next action

Independent verification (tester_verifier/security_reviewer): re-run
`npx supabase migration up --local`, `npx supabase test db`, and
`npm run test:admin:integration`; review `admin_revoke_sessions`'s `security definer` grant of
`DELETE` on `auth.sessions` for the same security-sensitivity as the `admin_set_role`/
`admin_set_active` migration; confirm the `password_reset_sessions_not_revoked` UI message reads
clearly to a non-technical admin; reconcile Finding #1/#2 with the coordinator once the SH-06
round's own state is final.

Handoff evidence: workflow/handoffs/adm-01/2026-10-20-adm-01-developer-revoke.md
