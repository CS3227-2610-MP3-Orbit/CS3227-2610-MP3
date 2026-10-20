# Handoff: TASK-SH-06B / SH-06-R6, SH-06-R7, AC8..AC12 — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-SH-06B",
"requirementIds": ["SH-06-R6", "SH-06-R7", "SH-06-AC8", "SH-06-AC9", "SH-06-AC10", "SH-06-AC11", "SH-06-AC12"],
"status": "passed",
"changedFiles": [
"supabase/migrations/20261020130000_password_change_attempts.sql",
"supabase/tests/password_change_attempts.test.sql",
"src/features/account/rate-limit.ts",
"src/features/account/rate-limit.test.ts",
"src/features/account/server.ts",
"src/features/account/server.test.ts",
"src/features/account/validation.ts",
"src/app/account/password/change-password-form.tsx",
"tests/integration/sh06-change-password.test.ts",
"tests/integration/sh06.vitest.config.mts",
"tests/e2e/change-password.spec.ts",
"workflow/handoffs/sh-06/2026-10-20-sh-06-developer-r6-r7.md"
],
"verification": [
{"check": "npx supabase migration up --local", "result": "passed", "evidence": "20261020130000_password_change_attempts.sql applied cleanly"},
{"check": "npx supabase db lint --level error", "result": "passed", "evidence": "No schema errors found"},
{"check": "npx supabase test db (full suite)", "result": "failed", "evidence": "Overall run fails only on supabase/tests/admin_revoke_sessions.test.sql ('permission denied for table sessions'), owned by the concurrent ADM-01-R10 agent (migration 20261020020000_*, outside my allowed paths) -- not touched or caused by this task"},
{"check": "psql -f supabase/tests/password_change_attempts.test.sql (isolated)", "result": "passed", "evidence": "12/12 pgTAP assertions ok"},
{"check": "npm run lint", "result": "passed", "evidence": "clean"},
{"check": "npm run typecheck", "result": "passed", "evidence": "clean; route types generated"},
{"check": "npm test", "result": "passed", "evidence": "15 files passed, 1 skipped; 120 tests passed, 4 pre-existing todo"},
{"check": "npx vitest run --config tests/integration/sh06.vitest.config.mts (live local Supabase)", "result": "passed", "evidence": "11/11 passed; 0 leftover sh06- users and 0 leftover password_change_attempts rows after"},
{"check": "npx playwright test --config tests/e2e/change-password.playwright.config.ts (real dev server, :3107)", "result": "passed", "evidence": "3/3 passed (~7.5s); port 3107 free before and after, 0 leftover fixture users"},
{"check": "npm run check:spec", "result": "passed", "evidence": "exit 0; SH-06-AC8..AC12 all now covered (only pre-existing draft-spec warnings remain)"},
{"check": "npx prettier --write (my files only)", "result": "passed", "evidence": "ran on exactly the files listed above; re-ran lint/typecheck/test clean after"}
],
"unresolvedIssues": [
"npx supabase test db fails overall because of supabase/tests/admin_revoke_sessions.test.sql, owned by the concurrent ADM-01-R10 developer agent -- their file/migration, not mine; flagging for the coordinator since it blocks a clean full-suite run"
]
}
<!-- HANDOFF:END -->

- Date: 2026-10-20
- Task ID: TASK-SH-06B
- Requirement / acceptance-criterion IDs: SH-06-R6, SH-06-R7 (implementation); SH-06-AC8..AC12 (tests)
- Specification: `workflow/specs/shared/SH-06-change-own-password.md`, `status: approved`, owner
  re-approval 2026-10-20 (commit `b676fdf`); the new `password_change_attempts` table and the
  RPC-free rate-limit logic still need independent teammate review on the implementation PR, per
  the spec's own note.
- Specification status and human approver: `approved` by Johannsen (2026-10-20).
- Relevant context files: `src/lib/ai/client.ts`/`quota.ts` (the `claimUsage`/`decideQuota`
  claim-then-count + pure-decision pattern this mirrors for `ai_usage`/`password_change_attempts`);
  `src/features/account/server.ts` (prior cycle's `changeOwnPassword`, kept intact and extended);
  `workflow/handoffs/sh-06/2026-10-20-sh-06-developer.md` (prior cycle, R1-R5/AC1-AC7).
- Allowed edit scope: `supabase/migrations/20261020130000_password_change_attempts.sql` (new),
  `supabase/tests/password_change_attempts.test.sql` (new), `src/features/account/**` (+tests),
  `src/app/account/**`, `tests/integration/sh06-*`/`sh06.vitest.config.mts`,
  `tests/e2e/change-password.spec.ts`, this handoff. No `src/features/admin/**`,
  `src/app/admin/**`, `tests/integration/admin-*`, or migration `20261020020000_*` touched (the
  concurrent ADM-01-R10 agent's files; confirmed present and left alone throughout).
- Agent session log: none outside this handoff and the code.

## Decisions and assumptions

- **R7 claim-then-count placement**: input validation (`changePasswordInputSchema`) runs before
  the attempt is claimed, so a malformed request (AC3/AC4, forged fields) never writes a
  `password_change_attempts` row at all -- only well-formed attempts with a real current-password
  guess count toward the limit. Authorized by the spec's own flow ("insert an attempt row first"
  refers to the verification step, which only exists once input is well-formed); not re-litigating,
  flagging for the record.
- **"on success delete the claimed row" read literally**: I delete the claimed row immediately
  after a _successful verification_ (sign-in succeeds), before calling `updateUser`/`signOut`, per
  the assignment envelope's exact wording ("verify the current password; on success delete the
  claimed row ... on failure keep it"). An unrelated later failure (e.g. `updateUser` erroring)
  does not re-add or keep the row, since the verification itself -- the only thing the counter
  measures -- already succeeded. This does not contradict any AC; AC11 only requires that a
  cleared row not block a later legitimate attempt, which holds either way.
- **R6 honesty on `signOut({scope:"others"})` failure**: `success.otherSessionsEnded` is `false`
  (not omitted) when that best-effort call errors; the password change itself still succeeds (it
  already happened via `updateUser`) and the UI shows an honest message instead of claiming other
  devices were signed out. The spec does not spell out this exact branch; this is my own
  implementation choice following its "be honest" instruction literally. Flagging for review.
- **Fail-closed, no verification, on claim/count failure**: if the attempt row can't even be
  inserted, or the window-count query errors, `changeOwnPassword` returns
  `temporarily_unavailable` and never calls Supabase Auth -- matches the assignment's explicit
  "fail closed ... don't verify" instruction and SH-06-R2's "no account enumeration" intent (an
  internal DB error must not look different from, or leak into, the verification path).
- Reused the existing `requireUser()`/`createClient()`/throwaway-verifier design from the prior
  cycle unchanged; only added the claim-then-count wrapper around it and the post-update
  `signOut({scope:"others"})` call.

## Changes

- `supabase/migrations/20261020130000_password_change_attempts.sql` (new): the table exactly as
  specified (identity PK, `user_id` FK on delete cascade, `created_at`), an index on
  `(user_id, created_at)`, RLS enabled, no policies, `revoke all ... from public, anon,
authenticated` -- same shape as `public.ai_usage`. Applied locally.
- `supabase/tests/password_change_attempts.test.sql` (new): 12 pgTAP assertions (table exists, RLS
  enabled, no policies, no SELECT/INSERT/UPDATE/DELETE privilege for `authenticated`/`anon`, and
  direct SELECT/INSERT statements under each role throw `42501`). `[SH-06-AC12]`.
- `src/features/account/rate-limit.ts` (new): pure `decidePasswordAttemptLimit(countInWindow,
oldestCreatedAt, now)` -- no I/O, mirrors `src/lib/ai/quota.ts`'s shape. `MAX_ATTEMPTS_PER_WINDOW
= 5`, `ATTEMPT_WINDOW_MS = 15min`. Returns `{allowed:true}` or `{allowed:false,
retryAfterSeconds}` (seconds until the oldest counted row ages out of the window, rounded up,
  floored at 1).
- `src/features/account/rate-limit.test.ts` (new): 6 unit tests, all `[SH-06-AC9]`, covering the
  allowed boundary (count = 5), the refused boundary (count = 6), the exact retry-after countdown,
  the no-negative-retry-after floor, and rounding up fractional seconds.
- `src/features/account/server.ts`: added `claimPasswordAttempt`/`countAttemptsInWindow`/
  `clearPasswordAttempt` (all via `createAdminClient()`, mirroring `ai/client.ts`'s
  `claimUsage`/`releaseUsage`). `changeOwnPassword` now: claims an attempt right after validation,
  counts the window, calls `decidePasswordAttemptLimit`; if refused, clears the claim and returns
  `rate_limited` with `retryAfterSeconds`, **without** constructing the throwaway verifier or
  calling Supabase Auth at all. If allowed, verification proceeds as before; a wrong password keeps
  the claimed row, a correct one clears it before `updateUser`. After a successful `updateUser`,
  calls `supabase.auth.signOut({scope:"others"})` on the caller's own cookie-bound client and
  returns `{kind:"success", otherSessionsEnded: !error}`.
- `src/features/account/validation.ts`: `resultSchema`'s `"success"` variant now carries
  `otherSessionsEnded: boolean`; added a `"rate_limited"` variant with `retryAfterSeconds:
number().int().positive()`.
- `src/app/account/password/change-password-form.tsx`: success panel now states whether other
  devices were signed out (honestly, per the `otherSessionsEnded` flag); added a `rate_limited`
  message "Too many attempts. Try again in N minutes." (`Math.ceil(retryAfterSeconds / 60)`).
- `src/features/account/server.test.ts`: added admin-client chain mocks
  (`from→insert/select/delete→single/eq→gte→order`); updated existing assertions for the new
  success shape and added `adminClient` not-called checks on every validation-error/redirect path;
  added two `SH-06-R6` tests (scope:"others" called on the cookie client; honest result on its
  failure) and six `SH-06-R7` tests (AC9 6th-attempt refusal before any Auth call, boundary-of-5
  allowed, claimed row deleted on refusal, fail-closed on claim failure, fail-closed on count
  failure, AC11 clear-then-not-blocked ordering).
- `tests/integration/sh06.vitest.config.mts`: added `resolve: {tsconfigPaths: true}` (same as
  `tests/integration/admin-accounts.vitest.config.mts`) so the test file can import the real
  `@/features/account/rate-limit` pure function.
- `tests/integration/sh06-change-password.test.ts`: added `[SH-06-AC8]` (two live sessions; session
  1 changes the password and calls `signOut({scope:"others"})`; session 2's `refreshSession` with
  its saved refresh token fails; session 1's `getUser()` still succeeds), `[SH-06-AC10]` (5 live
  wrong-password attempts via a local `attemptPasswordChange` helper that wires the real
  `password_change_attempts` table + the real `decidePasswordAttemptLimit` exactly as
  `changeOwnPassword` does, then a 6th attempt with the correct password still refused as
  `rate_limited`; a direct sign-in confirms the password itself was never actually wrong), and
  `[SH-06-AC11]` (3 kept failures, a cleared success, then a later attempt still allowed).
- `tests/e2e/change-password.spec.ts`: added `[SH-06-AC9][SH-06-AC10]` -- 5 wrong attempts then a
  6th with the correct password through the real browser/app, asserting the
  "Too many attempts. Try again in N minutes." message.

## Evidence

| Command or check                                                              | Result            | Evidence                                                                                                                    |
| ----------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npx supabase migration up --local`                                           | passed            | migration applied                                                                                                           |
| `npx supabase db lint --level error`                                          | passed            | no schema errors                                                                                                            |
| `npx supabase test db` (full)                                                 | failed (not mine) | fails only on `admin_revoke_sessions.test.sql` (concurrent ADM-01-R10 agent's file; `permission denied for table sessions`) |
| `psql -f supabase/tests/password_change_attempts.test.sql`                    | passed            | 12/12 ok                                                                                                                    |
| `npm run lint`                                                                | passed            | clean                                                                                                                       |
| `npm run typecheck`                                                           | passed            | clean                                                                                                                       |
| `npm test`                                                                    | passed            | 120 passed, 4 pre-existing todo                                                                                             |
| `npx vitest run --config tests/integration/sh06.vitest.config.mts`            | passed            | 11/11; 0 leftover users/attempt rows                                                                                        |
| `npx playwright test --config tests/e2e/change-password.playwright.config.ts` | passed            | 3/3, ~7.5s; port 3107 freed after                                                                                           |
| `npm run check:spec`                                                          | passed            | exit 0; SH-06-AC8..AC12 covered                                                                                             |
| `npx prettier --write` (my files only)                                        | passed            | ran; re-verified lint/typecheck/test clean                                                                                  |

Env for integration/e2e: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` /
`SUPABASE_SECRET_KEY` exported from `npx supabase status -o json` into the shell for those commands
only, never echoed/printed.

## Changes outside the owner's area

`supabase/migrations/20261020130000_password_change_attempts.sql` is a new, append-only migration
under the shared `supabase/migrations/` path (per `AGENTS.md`, shared paths need team review); no
existing migration was edited. No other shared-path (`src/lib/`) file was changed this cycle.

## Findings and open questions

| #   | Severity         | Finding                                                                                                                                                                                                                                                        | Status                                                         |
| --- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Medium, not mine | `npx supabase test db`'s overall exit is a failure because of `supabase/tests/admin_revoke_sessions.test.sql` (`permission denied for table sessions`), owned by the concurrent ADM-01-R10 developer agent. My own new pgTAP file passes in isolation (12/12). | Reported; owner is the other agent/coordinator, not this task. |
| 2   | Info             | `success.otherSessionsEnded` can be `false` if the best-effort `signOut({scope:"others"})` call itself fails after a real password change already succeeded; spec doesn't enumerate this exact branch, only says "be honest."                                  | My own interpretation; flagging for spec record, not blocking. |
| 3   | Info (carried)   | Documented limitation from the spec, unchanged: an access token already issued to another session stays valid until it expires (≤1h) since `getCurrentUser()` verifies locally; only the refresh token is revoked immediately.                                 | Not a defect; spec already documents it.                       |

## Next action

Independent teammate review of `supabase/migrations/20261020130000_password_change_attempts.sql`
(shared-path migration) and the rate-limit logic in `src/features/account/{rate-limit,server}.ts`,
per the spec's own note. Separately, the coordinator should ask the ADM-01-R10 developer agent to
fix `supabase/tests/admin_revoke_sessions.test.sql` so `npx supabase test db` passes end to end
again (unrelated to this task's own files, all of which pass).

Handoff evidence: workflow/handoffs/sh-06/2026-10-20-sh-06-developer-r6-r7.md
