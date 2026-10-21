# ADM-01 administrator accounts and SH-06 change own password

## Specification and owner decisions — 2026-10-19/2026-10-20

- Requested: Administrator account management (`ADM-01`, GitHub issue #18) and, once password resets
  came up, a shared self-service "change my own password" feature (`SH-06`).
- `requirements_architect` drafted `workflow/specs/admin/ADM-01-manage-accounts.md` against
  `PRODUCT-SPEC.md` and `SH-01-foundation.md`.
- Owner decisions recorded in the spec's "Document control" section (Johannsen, relayed by the
  coordinator, 2026-10-19): admin-only provisioning; admins create accounts of any role, list/search,
  change role, activate/deactivate; self-role-change and self-deactivation are refused;
  `createAdminClient` only after `requireRole("admin")`; no AI; one-time generated password with no
  invite email; role/active changes go through new `security definer` RPCs, not the old direct-update
  policy; admins may create/promote other administrators; `ADM-01-R7` (refuse any change that would
  leave zero active admins); `ADM-01-R8` (one protected recovery administrator per environment);
  `ADM-01-R9` (an admin can reset another user's password, reusing the same one-time-reveal UI).
- Follow-up owner decisions (2026-10-20): `ADM-01-R9` is refused for the protected recovery
  administrator; after an automated security review, Johannsen said "fix those issues," approving
  `ADM-01-R10` (a password reset also revokes the target's other sessions) and a documented
  access-token-validity limitation (a reset revokes refresh tokens immediately, but an already-issued
  access token can remain valid up to 1 hour).
- `SH-06-change-own-password.md` was drafted alongside `ADM-01-R9` the same day: any signed-in active
  user, including the protected recovery admin, can change their own password at
  `/account/password` via a new `requireUser()` helper; current password verified first via a
  non-persisting sign-in; 12–72 byte length. Owner approved 2026-10-20, then approved `SH-06-R6`
  (other sessions end on change) and `SH-06-R7` (claim-then-count rate limit: at most 5 wrong
  current-password attempts per user per 15 minutes, fails closed) from the same security review.
- `npm run check:spec` traceability is recorded in both specs' change logs as passing at each
  revision (0 errors against the then-current acceptance criteria).

Generated summary awaiting independent human verification.

## Implementation (PR #30) — 2026-10-20

- Built `/admin/accounts` (list/search accounts; create student/lecturer/admin accounts with a
  24-character generated password shown once; change role; activate/deactivate; reset password) and
  `/account/password` (change own password, linked from every role's header).
- Four new append-only migrations (`20261020100000`–`20261020130000`): `admin_set_role`,
  `admin_set_active`, `admin_revoke_sessions`, `admin_list_accounts` as `security definer` functions
  with the old direct-update `profiles` policy dropped and `UPDATE` revoked from `authenticated`.
- `src/lib/auth/session.ts` gained `requireUser()` (any active role) alongside the existing
  `requireRole`; `src/components/role-shell.tsx` gained a shared "Change password" header link.
  `supabase/seed.sql` added two local-only demo administrators (`demo-admin` is the protected one);
  the seed never runs against dev or prod.
- Verification recorded in the PR body (local, fresh database, head `f363e04`): pgTAP, database
  lint, format/lint/typecheck, 126 unit tests, ADM-01 integration 11/11, SH-06 integration 11/11, E2E
  admin accounts 1/1, E2E change password 3/3, spec traceability 0 errors, secret scan passed.

Generated summary awaiting independent human verification.

## Independent verification, CI fix, and merge — 2026-10-20/2026-10-21

- Tester-verifier (handoff `workflow/handoffs/adm-01/2026-10-20-adm-01-sh-06-tester.md`): no defects.
  Added `tests/integration/admin-accounts-verification.test.ts` (15 live tests): signed-out/non-admin
  calls refused for every admin action; own-id/protected-id substitution refused; a real
  two-connection race for `ADM-01-AC14` (two admins demote each other at once — exactly one change
  commits, one active admin remains); `requireUser()` refuses a deactivated user. Remaining low-risk
  gaps noted: no browser test for mid-session deactivation; happy paths tested at DB/server layers
  separately rather than fully end-to-end.
- Security reviewer, read-only (handoff `workflow/handoffs/adm-01/2026-10-20-adm-01-sh-06-security-reviewer.md`):
  status "passed — no blocking findings." Three findings: (1) low — on `rate_limited`, the just-claimed
  attempt row is deleted before verification, contrary to the spec's "delete only on success," but not
  exploitable since the row deleted is the newest and the earlier five failures still block; (2) low —
  `ADM-01-AC14` concurrency was reasoning-only at review time, closed by the tester's real
  two-connection test above; (3) info — the admin dashboard (merged in from develop) lets admins read
  student consultation topics/questions via `requireStaff`; out of ADM-01's scope, flagged for a
  later privacy spec.
- CI problem found and fixed by Johannsen (PR #30 comment): the root Playwright/CI job ran every spec
  in `tests/e2e/`, which broke on the account/password specs because they need the local stack's
  secret key to create throwaway users. Fix: `playwright.config.ts` `testIgnore` for
  `admin-accounts.spec.ts`/`change-password.spec.ts`; a new "Accounts and passwords" CI job
  (`.github/workflows/ci.yml`) starts a local Supabase and runs the ADM-01/SH-06 integration suites
  and both browser specs; `tests/integration/local-supabase-env.mjs` exports the stack's URL/keys
  without printing them (commit `74ce642`).
- CI on `74ce642`: Verify, Database rules, End-to-end, and the new Accounts and passwords job all
  passed, per the PR comment.
- Review: Joseph — "Looks good! Thanks for the detailed verification update. The dedicated Accounts
  and passwords job sounds like the correct way to handle tests requiring the local Supabase secret
  key without weakening the general E2E suite or exposing credentials" (commit `a0fb13f`). Merged
  2026-10-21 (`3ecf023`).

Generated summary awaiting independent human verification.
