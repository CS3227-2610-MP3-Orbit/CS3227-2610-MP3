# Security review: ADM-01 and SH-06

- Role: `security_reviewer`, recorded by the coordinator (the reviewer is read-only and cannot write files).
- Date: 2026-10-20. Scope: `git diff origin/develop...f363e04` for ADM-01 and SH-06 (four migrations
  `20261020100000`–`20261020130000`, `supabase/seed.sql`, `src/features/admin/accounts/**`,
  `src/app/admin/**`, `src/features/account/**`, `src/app/account/**`, `src/lib/auth/session.ts`,
  `src/components/role-shell.tsx`, `.claude/**`).
- Specs: `workflow/specs/admin/ADM-01-manage-accounts.md`, `workflow/specs/shared/SH-06-change-own-password.md`.
- Effective restriction: read-only by instruction only. The Claude `security-reviewer` agent (Read, Grep,
  Glob) was added in this session and is only loaded by a new session, so this run used a general agent
  told to stay read-only. It made no file changes.

## Status

passed — no blocking findings.

## Findings

1. **Low** — `src/features/account/server.ts`: on `rate_limited` the just-claimed attempt row is
   deleted before verification, while the spec says rows are deleted only on success. Not exploitable:
   the deleted row is the newest, and the earlier five failures still block. Confirm as intended.
2. **Low** — `ADM-01-AC14` true two-connection concurrency is not executed by pgTAP (single backend).
   The shared advisory lock `82010001` in `admin_set_role` and `admin_set_active` is correct by
   inspection; the tester-verifier is adding a concurrent integration test.
3. **Info** — `src/app/admin/page.tsx` with `src/features/lecturer/requests-server.ts` (`requireStaff`
   allows `admin`): merged from develop, admins can read student consultation topics and questions.
   Outside ADM-01; needs a privacy decision against `PRODUCT-SPEC.md` in a later spec.

## Checks

| Area                                  | Check                                                                                            | Result           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------- |
| `admin_list_accounts`                 | `search_path = ''`, grants, five-field allowlist, no secrets                                     | passed           |
| `admin_list_accounts`                 | search bounds (zod 200 + SQL `left(..., 200)`), parameterised, statement timeout                 | passed           |
| `admin_set_role` / `admin_set_active` | role check before data, then self, lock, row lock, protected, zero-admin                         | passed           |
| Advisory lock                         | same key, transaction-scoped, shared by both functions, timeouts set                             | passed           |
| Direct writes                         | old policy dropped, `UPDATE` revoked, no remaining policy or grant                               | passed           |
| Non-admin mutation                    | execute revoked from public/anon; runtime `current_app_role()` check                             | passed           |
| Server Actions                        | `requireRole` / `requireUser` first, `.strict()` schemas, service role after authorisation       | passed           |
| Credentials                           | never logged, never in URL, cookie or server-rendered HTML                                       | passed           |
| SH-06 verifier                        | non-persisting client, `signOut({ scope: "local" })`, then `scope: "others"` on the real session | passed           |
| SH-06 rate limit                      | claim-then-count, fails closed, keyed by user                                                    | passed           |
| Password length                       | UTF-8 byte length, 72-byte limit                                                                 | passed           |
| Seed data                             | `deploy.yml` runs `supabase db push`; seed only loads on `db reset`                              | passed           |
| `.claude` controls                    | deny-list blocks push, deploy, `db push`/`link`, `.env` reads                                    | passed with note |

## Approval-gate assessment

Enforced outside model output: Postgres grants and RLS, `security definer` with `search_path = ''`,
the `.claude/settings.json` deny-list, and the GitHub production environment reviewer gate. The
deny-list matches command patterns and is not a sandbox; an indirect shell invocation could evade it.

## Next action

Executed evidence: the coordinator ran the full pgTAP suite on a fresh local database at `f363e04`
(all passed) before this review; the tester-verifier run adds the concurrency test.
