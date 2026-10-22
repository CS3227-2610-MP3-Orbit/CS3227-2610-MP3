---
id: ADM-01
title: Administrator account management
owner: johannsen
status: approved
---

# ADM-01: Administrator account management

## Document control

- Task: `TASK-ADM-01` (GitHub issue #18); author: `requirements_architect`; date: 2026-10-19.
- Reviewed repository commit (HEAD): `3c8ba194d06439183318b66ba4824e8dc0521c1f`.
- Source digests (`git hash-object`): `PRODUCT-SPEC.md` = `d9f63461aeb368ffd811ec50e5a595e0c6047ca7`
  ("Administrator experience", "Permissions and privacy"); `SH-01-foundation.md` =
  `a1a660ead71b0565afddf27633c63b6299bc5fa8`.
- Parent/shared requirements: `PRODUCT-SPEC.md`; `SH-01` (session, roles, `requireRole`,
  `current_app_role()`, deactivation). Plan: none yet. Handoff:
  `workflow/handoffs/adm-01/2026-10-19-adm-01-requirements-architect.md`.
- Confirmed (owner decisions 2026-10-19, reported by the coordinator): admin-only provisioning;
  admins create accounts of any role, list/search, change role, activate/deactivate; self-role-
  change/self-deactivation refused; deactivation revokes access with a live session;
  `createAdminClient` only after `requireRole("admin")`; no AI; one-time generated password, no
  invite email; role/active changes via new security-definer RPCs, not the direct admin update
  policy; admins may create/promote administrators; `ADM-01-R7` (zero-active-admin lockout);
  `ADM-01-R8` (one protected recovery administrator per environment); and `ADM-01-R9` (admin resets
  another user's password, using the same generator and one-time-reveal UI as account creation).
- Confirmed (owner decision 2026-10-20): `ADM-01-R9`'s refusal for the protected recovery
  administrator. Proposed, needs review: `ADM-01-R8`'s exact mechanism (`is_protected` column,
  partial unique index, migration-time marking).
- Confirmed (owner decision 2026-10-20, "fix those issues," approving an automated security
  review's findings): `ADM-01-R10` (a password reset also ends the target's sessions) and the
  documented access-token-validity limitation below.

- Approval: approved by Johannsen (spec owner, Administrator role) on 2026-10-19 at commit `1b373c9`
  (spec digest `da79c65`). This is an owner approval; independent teammate review of this spec
  happens on the implementation pull request, as `workflow/policies/approval-gates.md` requires.
  **Superseded**: approval at `7f6c579` superseded by the `ADM-01-R9` change below; re-approval
  required before implementation of R9 proceeds. Prior requirements R1–R8 are unchanged by this
  revision.
- Re-approval: approved by Johannsen (spec owner) on 2026-10-20 including `ADM-01-R9`. Owner
  approval; independent teammate review happens on the implementation pull request.
- Re-approval: Johannsen said "fix those issues" on 2026-10-20, approving an automated security
  review's findings below (`ADM-01-R10` and the documented limitation). Status remains `approved`;
  independent teammate review of the new RPC still happens on the implementation pull request.

## Product and feature description

Administrators provision and manage every account. Today only the offline
`workflow/scripts/create-user.mjs` can create accounts or set a non-student role; there is no in-app
path. ADM-01 adds an admin workspace to create any-role accounts, list/search, change role, and
activate/deactivate, without self-lockout or demoting the recovery account kept in reserve.

## Scope, non-goals, and dependencies

**In scope**: create accounts of any role (student/lecturer/admin); list/search; change role (any of
the three); activate/deactivate; refuse self-role-change and self-deactivation; refuse a change that
would leave zero active administrators; protect one recovery administrator from any demotion or
deactivation.

**Non-goals**: self-registration UI; disabling Supabase public sign-up (residual risk, not a
requirement — see below); deleting accounts; bulk import; email/SMTP invitations (owner decision
2026-10-19: none); course/assignment management and reporting (separate future specs).

**Dependencies**: `SH-01` only. Reads/writes `profiles`/`app_role` and the `handle_new_user` trigger
from `supabase/migrations/20261017000000_initial_schema.sql`. Redefines no shared contract.

## Users, roles, and permissions

| Actor                    | Allowed                                                                                                                      | Refused                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active Administrator     | Create accounts of any role; list/search; change another user's role (incl. to/from admin); activate/deactivate another user | Changing own role; deactivating self; a change leaving zero active admins; changing/deactivating the protected recovery admin; reading back passwords |
| Any other signed-in user | Own role's workspace only                                                                                                    | All account-management actions, incl. direct calls                                                                                                    |
| Signed-out/inactive user | Login guidance only                                                                                                          | All account-management data and writes                                                                                                                |

Trusted source of identity/role: server-resolved session via `requireRole("admin")` and
`current_app_role()`. UI hiding is not authorization.

## Functional requirements

### ADM-01-R1 — Create accounts of any role

`confirmed`; source: decision 2, owner decision 2026-10-19, `PRODUCT-SPEC.md`. An admin supplies
email, full name, and role (`student`/`lecturer`/`admin`); creation uses `createAdminClient` after
`requireRole("admin")` (mirrors `create-user.mjs`). Since `handle_new_user` always inserts role
`student`, creation must still end with the requested role before success is reported. The app
generates a strong random initial password and returns it once in the create response; it is never
stored in plaintext, logged, or retrievable afterward (owner decision 2026-10-19 — no invite email).

### ADM-01-R2 — List and search accounts

`confirmed`; source: decision 2. An admin lists/searches accounts by email, full name, or role.
Results carry only non-secret fields (id, email, full name, role, active status, created date).

### ADM-01-R3 — Change a user's role

`confirmed`; source: decisions 2–3, owner decision 2026-10-19, `PRODUCT-SPEC.md` ("...without
allowing a user to assign their own role"). An admin changes another user's role among
`student`/`lecturer`/`admin`, including promoting to or demoting from `admin`; the target must not be
the caller (`ADM-01-R5`), the change must not leave zero active administrators (`ADM-01-R7`), and the
target must not be the protected recovery administrator (`ADM-01-R8`).

### ADM-01-R4 — Activate and deactivate accounts

`confirmed`; source: decisions 2 and 4. An admin sets another user's `profiles.is_active` true/false;
the target must not be the caller (`ADM-01-R5`).

### ADM-01-R5 — Self-protection: no self-escalation or self-lockout

`confirmed`; source: decision 3. Every role-change and activate/deactivate call is refused, with no
row changed, when the target is the acting admin's own account, regardless of requested value —
enforced server-side on every call path (Server Action and any RPC), not only in the UI.

### ADM-01-R6 — Deactivation takes effect immediately

`confirmed`; source: decision 4, `SH-01`. A deactivated user is denied on their very next server
request even with a valid session: `getCurrentUser()`/`requireRole` re-resolve `is_active` each call,
and `current_app_role()` (used by RLS) already requires it. ADM-01 adds no bypass of this contract.

### ADM-01-R7 — No zero-active-administrator lockout

`confirmed`; source: owner decision 2026-10-19. Because `ADM-01-R3` now allows demoting/deactivating
an administrator, a change that would leave zero active administrators is refused, checked inside
the same RPC under a lock (e.g. `for update` on the active-admin count) so two admins concurrently
demoting/deactivating each other cannot both succeed.

### ADM-01-R8 — Protected recovery administrator

`confirmed` capability, `proposed` mechanism; source: owner decision 2026-10-19 (the first admin
created "should not be demoted or changed... so we still have this account to 'save' the accounts").
Exactly one admin account per environment is the protected recovery administrator. No one — not
other admins, not itself — can change its role or deactivate it through the app or the admin RPCs;
`admin_set_role`/`admin_set_active` refuse it at the DB layer. The flag cannot be set/cleared/moved
through the application, only by a migration or the service-role script/SQL (e.g. `create-user.mjs`).
The accounts list shows it as protected and hides/disables its role and deactivate controls.
**Proposed mechanism**: `profiles.is_protected boolean not null default false` with a unique partial
index allowing at most one `true` row, set by the same migration for the earliest-created active
admin (if none exists yet, the script marks it later). `R8` implies `R7` when a protected admin
exists; `R7` stays as defence in depth otherwise.

### ADM-01-R9 — Administrator resets another user's password

`confirmed`; source: owner decision 2026-10-19. An admin resets another user's password; the app
generates a new one with the same generator as account creation (`generateInitialPassword()` in
`src/features/admin/accounts/password.ts`: 24 characters from A–Z/a–z/0–9 via `crypto.randomInt`)
and shows it once, with the same copy-then-"Done" panel as creation (see UI description) — once
dismissed it cannot be shown again. Refused for: the caller's own account (must use `SH-06`
instead); an unknown target; non-admin/signed-out callers. **Confirmed (owner decision 2026-10-20)**: also refused for the protected recovery administrator (`ADM-01-R8`),
so a compromised admin account cannot take over the recovery account by resetting its password.
Implementation is server-side via the service-role client (`auth.admin.updateUserById`) only after
`requireRole("admin")` and a server-side check of the target's protected/self status (via the
existing admin profile read, not a new table); the new password is never logged or stored in any
app table. **Open, non-blocking**: whether a reset should also revoke the target's existing
sessions is open (the Supabase admin API limits what can be revoked); until resolved, a session the
target already holds may continue after their password is reset — a residual risk, not a
requirement here.

### ADM-01-R10 — Password reset ends the target's sessions

`confirmed`; source: owner decision 2026-10-20 ("fix those issues," an automated security review).
Resolves `ADM-01-R9`'s open session-revocation question: after an admin's password reset succeeds,
every one of the target's sessions and refresh tokens is revoked, via a new admin-only security-
definer RPC `admin_revoke_sessions(target_id uuid)` — `set search_path = ''`; checks
`current_app_role() = 'admin'`; refuses `target_id = auth.uid()` and the protected recovery admin,
same as `ADM-01-R5`/`R8`; deletes the target's rows from `auth.sessions` (refresh tokens cascade);
`execute` granted to `authenticated` only (not `public`/`anon`). If the password change succeeded
but revocation fails, the result is the distinct, honest `password_reset_sessions_not_revoked`, not
plain success — the caller is never told sessions were ended when they were not.

**Documented limitation, not a requirement** (applies here and to `SH-06-R6`): an access token
already issued stays valid until it expires (Supabase default ≤ 1 hour), because
`getCurrentUser()` verifies it locally via `getClaims` rather than checking revocation; refresh
tokens are revoked immediately. For a suspected compromise, the admin can deactivate the account
first (immediate, `ADM-01-R6`) and reset the password after.

### ADM-01-R11 — Sign-in guidance for a deactivated account

`confirmed`; source: owner decision 2026-10-22 (pre-release audit found a deactivated user who
signs in with the correct password is signed in and silently bounced back to `/login`). When the
password is correct but the account's profile is inactive, the sign-in action signs the session out
again and shows "This account has been deactivated. Contact an administrator." A wrong password
still shows only the generic "Incorrect email or password.", so the message reveals nothing to
someone who does not already hold the password. `ADM-01-AC9` (a live session is denied on the next
request after deactivation) is unchanged.

## Non-functional requirements

No new performance/accessibility/capacity target beyond existing conventions (keyboard operable,
visible focus, labelled errors). Account volume is small for this course project; no pagination SLA.

## UI description

An "Accounts" page under `/admin`: search/filter list, per-row role/active-status controls, and a
"Create account" form (email, full name, role). States: loading, empty result, field validation
error, duplicate-email conflict, submitting, success (credential shown once). The signed-in admin's
own row and the protected recovery admin's row (badged "protected") have role/active controls
disabled and explained, not merely hidden — a direct call is still refused server-side; the
protected row's "reset password" control is disabled too (`ADM-01-R9`, pending confirmation). The
one-time password panel shown after creating an account (`R1`) or resetting one (`R9`) has a Copy
button and a "Done" button; after Done or navigating away, the password cannot be shown again.

## Use cases

- **UC1 Create a lecturer**: admin submits email/name/role `lecturer`; server creates the auth user
  via service role, ensures the profile ends as `lecturer` (not the trigger default), and returns the
  account plus a one-time credential; duplicate email/invalid input fails, no account.
- **UC2 Change another user's role**: admin picks a target (not self, not protected) and a new role;
  server re-checks before updating `profiles.role`.
- **UC3 Deactivate, access lost immediately**: admin deactivates a target with a live session; that
  session's next request is treated as signed out.
- **UC4 Self/protected action refused**: admin attempts either action on their own account, or any
  admin targets the protected recovery admin, incl. via a direct call; refused, nothing changes.

## Technical constraints and proposals

Creation and password reset (`R1`, `R9`) both use `createAdminClient` only after
`requireRole("admin")` (project rule) — reset calls `auth.admin.updateUserById`, not a `profiles`
RPC, then `admin_revoke_sessions` (`R10`). Role-change, activate/deactivate, and session revocation
go through new security-definer RPCs (owner decisions 2026-10-19/2026-10-20), matching Joseph's
RPC-only pattern (`SH-03`/`SH-05`), not the direct admin `UPDATE` policy — see Data model.

## Data model and integrity rules

No new table. `profiles.role`/`is_active` remain the system of record. One new append-only migration
(owner decision 2026-10-19) adds `admin_set_role(target_id uuid, role public.app_role)` and
`admin_set_active(target_id uuid, is_active boolean)` — `security definer`, `set search_path = ''`;
each checks `current_app_role() = 'admin'`, refuses `target_id = auth.uid()` (`R5`), a change leaving
zero rows with `role = 'admin' and is_active` under a lock (e.g. `for update`, `R7`), and any target
where `is_protected` (`R8`). `execute` is revoked from `public, anon`, granted to `authenticated`.
The same migration adds `profiles.is_protected boolean not null default false` with a unique partial
index allowing at most one `true` row, sets it for the environment's earliest-created active admin,
and drops `"profiles: admin updates"`, so role/`is_active`/`is_protected` change only via the RPCs
(which never write `is_protected`) or a maintainer's migration/script; `"profiles: admin reads all"`
is unchanged. No existing migration is edited. `ADM-01-R9` needs no new table/column: the self/
protected check reads the existing `profiles` row (already admin-readable), and the password itself
lives only in `auth.users`, updated via the service-role client. The same (or a further append-only)
migration adds `admin_revoke_sessions(target_id uuid)` for `ADM-01-R10` — `security definer`,
`set search_path = ''`, checking `current_app_role() = 'admin'`, refusing `target_id = auth.uid()`
and the protected admin, deleting the target's `auth.sessions` rows; `execute` revoked from
`public`/`anon`, granted to `authenticated` only. **Open, not a requirement here**: how a
deactivated/role-changed lecturer interacts with Joseph's `course_lecturers`/`consultation_slots`/
`bookings` is left to that feature's own spec.

## API and boundary contracts

Proposed internal Server Actions under `/admin/accounts` (not public REST), all requiring
`requireRole("admin")` first:

- `createAccount({email, fullName, role})` → `{id, email, fullName, role, initialCredential}` (shown
  once) or `validation_error` / `conflict: duplicate_email`.
- `listAccounts({query?, roleFilter?, activeFilter?})` →
  `{id, email, fullName, role, isActive, isProtected}[]`; never a password/secret/credential field.
- `setRole`/`setActive({targetId, ...})` → call `admin_set_role`/`admin_set_active`; success or
  `validation_error` / `forbidden_self_change` / `forbidden_zero_admins` / `forbidden_protected` /
  `forbidden_or_not_found`.
- `resetPassword({targetId})` → `{initialCredential}` (shown once, then calls
  `admin_revoke_sessions`) or `validation_error` / `password_reset_sessions_not_revoked` (password
  changed, revocation failed — distinct from success) / `forbidden_self_change` (target is the
  caller; use `SH-06`) / `forbidden_protected` / `forbidden_or_not_found`.

No action accepts a caller-supplied "this is my own id" override, a role for the caller's own account,
or an arbitrary field/SQL selector. Non-admin/signed-out direct calls to the action or the underlying
RPC get the same refusal as any other admin-only path, with no data disclosed.

## Security requirements

- Inherited controls/order: every page/layout and Server Action/RPC calls `requireRole("admin")`
  first; `createAdminClient` only after that check; self-target and zero-admin checks run inside the
  RPC before any mutation.
- Trusted/untrusted inputs: session role is trusted; email, name, role, target id, credential input
  are untrusted and server-validated; email well-formed, name bounded/non-empty, role a valid enum
  value, target id a canonical UUID.
- Output/data disclosure: responses never echo a password/secret; list/search excludes secret fields
  and the one-time credential; errors do not leak which emails exist beyond the one just submitted;
  bounded input lengths; one account per call; no batch creation.
- Sensitive actions/logging: role/active changes are logged with actor, target, and action type,
  never a password/secret, with bounded operation/error category only, no raw error/request body;
  this path needs independent human review before merge (security-sensitive).
- Accepted risks (owner decision 2026-10-19): a compromised admin can create further admins; a
  leaked protected-admin credential needs the service-role key/script to recover, not another admin
  action — both accepted, not mitigated here.
- Documented limitation (owner decision 2026-10-20, `ADM-01-R10`): an access token issued before a
  reset stays valid until it expires (≤ 1 hour by default), since `getCurrentUser()` checks it
  locally rather than against revocation; only refresh tokens are revoked immediately. Mitigation
  for a suspected compromise: deactivate first (`ADM-01-R6`, immediate), then reset the password.

## AI behavior

No AI is used. No model call, prompt, or `ai_usage` read/write occurs on any account-management path.

## Edge cases and failure paths

| Condition                                                                       | Required outcome                                            | Invariant preserved                                         |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| Admin targets own account for role/deactivation                                 | Refused, no change                                          | No self-escalation or lockout                               |
| Duplicate email on creation                                                     | `conflict: duplicate_email`, no account created             | One profile per email                                       |
| Invalid email/role/name                                                         | `validation_error` naming the field                         | No malformed profile created                                |
| Non-admin/signed-out direct call                                                | `requireRole` refusal, no data returned                     | Only active admins reach account data                       |
| User deactivated mid-session                                                    | Denied on next request                                      | Deactivation takes effect without re-login                  |
| `auth.users` insert succeeds but role-set step fails                            | Reported as incomplete, not as the requested role           | No account is misreported                                   |
| Role/deactivation change would leave zero active admins                         | `forbidden_zero_admins`, no change                          | At least one active administrator always exists             |
| Two admins concurrently demote/deactivate each other                            | At most one change commits                                  | No window with zero active administrators                   |
| Another admin targets the protected recovery admin for role change/deactivation | `forbidden_protected`, no change                            | Protected admin is never demoted/deactivated by anyone else |
| Protected admin tries to change their own role or deactivate themselves         | Refused (both `ADM-01-R5` and `ADM-01-R8` apply), no change | Protected admin is never self-modifiable either             |
| Admin resets their own password                                                 | Refused, directs to `SH-06`                                 | Password self-service stays in one place                    |
| Admin resets the protected recovery admin's password                            | Refused                                                     | Recovery account cannot be taken over via reset             |
| `admin_revoke_sessions` called on self or the protected admin                   | Refused, no sessions removed                                | Same self/protected invariants apply to session revocation  |
| Password changes but session revocation fails                                   | `password_reset_sessions_not_revoked`, not plain success    | Caller is never told sessions ended when they did not       |

## Acceptance criteria and verification

Planned tests, not results.

- **ADM-01-AC1** (R1; integration; live DB) Valid lecturer input → created profile's role is `lecturer`, not the trigger's default `student`
- **ADM-01-AC2** (R1; unit + integration; live DB) Valid student input → one profile created with role `student`
- **ADM-01-AC3** (R1; integration; live DB) Email already in use → `conflict: duplicate_email`, no second account
- **ADM-01-AC4** (R2; integration; live DB) List/search existing accounts → only allowlisted fields, no password/secret
- **ADM-01-AC5** (R3; integration; live DB) Admin changes another user's role → stored role updates and reads back
- **ADM-01-AC6** (R3, R5; unit + integration + pgTAP (security); live DB) Admin attempts own role change, incl. direct Server Action/RPC call → refused, unchanged
- **ADM-01-AC7** (R4; integration; live DB) Admin deactivates then reactivates another user → `is_active` reflects each change
- **ADM-01-AC8** (R4, R5; unit + integration + pgTAP (security); live DB) Admin attempts self-deactivation, incl. direct call → refused, stays active
- **ADM-01-AC9** (R6; pgTAP + e2e; live DB) User deactivated while holding a live session → next request denied as signed out
- **ADM-01-AC10** (R1–R4; integration (security); live DB) Signed-out/non-admin caller invokes any Server Action or RPC directly → refused, no data, no mutation
- **ADM-01-AC11** (R1; unit; mocked) Malformed email, empty name, or invalid role → `validation_error` naming the field, no account
- **ADM-01-AC12** (R1, security; unit + integration; live DB) Any success or failure → no password/secret in response or server logs
- **ADM-01-AC13** (R1, R2; integration (security); live DB) A just-created account's credential → never present in `listAccounts`/any later read, and not re-returned by a second call
- **ADM-01-AC14** (R7; pgTAP (concurrent); live DB) Exactly two active admins, each concurrently demotes/deactivates the other → at most one change commits, at least one active admin always remains
- **ADM-01-AC15** (R8; pgTAP; live DB) Another admin calls `admin_set_role`/`admin_set_active` on the protected admin → refused (`forbidden_protected`), nothing changes
- **ADM-01-AC16** (R8, security; pgTAP (security); live DB) Any authenticated role, including admin, attempts to update `profiles.is_protected` directly → refused/no effect; no RPC or grant permits it
- **ADM-01-AC17** (R8; unit + e2e; mocked + live UI) The protected admin's row is rendered in the accounts list → role and deactivate controls are hidden/disabled, protected badge shown
- **ADM-01-AC18** (R9; integration; live auth) Admin resets another user's password → the new password signs in successfully and the old password no longer works
- **ADM-01-AC19** (R9; unit + integration (security); live DB) Admin attempts to reset their own password, incl. direct call → refused, unchanged, directs to `SH-06`
- **ADM-01-AC20** (R9, R8; unit + integration (security); live DB) Admin attempts to reset the protected admin's password, incl. direct call → refused, unchanged
- **ADM-01-AC21** (R9; integration (security); live DB) Non-admin/signed-out caller invokes the reset action directly → refused, no data, no mutation
- **ADM-01-AC22** (R9, security; integration (security); live DB) A reset's new password → never present in `listAccounts`, server logs, or any later response, and not re-returned by a second call
- **ADM-01-AC23** (R10; pgTAP; live DB) `admin_revoke_sessions` called by a non-admin, or with the caller's own id, or with the protected admin's id → refused, no `auth.sessions` row removed
- **ADM-01-AC24** (R10; pgTAP; live DB) An admin calls `admin_revoke_sessions` on a valid, non-self, non-protected target → all of that target's `auth.sessions` rows are removed
- **ADM-01-AC25** (R10; integration; live auth) After an admin resets a user's password → the target's prior refresh token no longer works, while the new password signs in successfully
- **ADM-01-AC26** (R11; unit; mocked) A deactivated user submits the correct password → the session is signed out, the deactivated-account message is returned and no redirect happens; an active user is still redirected to `/`

## Review evidence

- Challenge record: none yet; not independently reviewed.
- Review type: not yet reviewed.
- Open findings: none recorded yet.
- Human input required: none currently blocking; see "Open questions" for non-blocking items.

## Open questions blocking approval

None blocking.

Non-blocking: `ADM-01-R8`'s exact mechanism (`is_protected` column/index/migration-time marking);
the lecturer-deactivation interaction with Joseph's tables, left to that feature's own spec;
Supabase public sign-up stays enabled (residual risk, out of scope for ADM-01). `ADM-01-R9`'s
session-revocation question is resolved by `ADM-01-R10`, subject to the documented access-token-
validity limitation recorded there.

## Change log

| Date       | Change and reason                                                                                                                                                                                                                                                                                                                                                                | IDs affected               | Evidence invalidated                         | By                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------- | ---------------------- |
| 2026-10-19 | First draft from confirmed owner decisions and inspected code                                                                                                                                                                                                                                                                                                                    | R1–R6, AC1–AC12            | None; no prior approval                      | requirements_architect |
| 2026-10-19 | Owner decision resolved credential, data-access, and admin-creation open questions; confirmed R1/R3; added proposed R7 (zero-admin lockout) and its lock requirement; replaced RLS-only data model with RPC migration + policy drop; added AC13–AC14 and pgTAP coverage to AC6/AC8; removed resolved items from open questions                                                   | R1, R3, R7 (new), AC1–AC14 | None; still draft, no prior approval existed | requirements_architect |
| 2026-10-19 | Owner confirmed R7; owner added and confirmed R8 (one protected recovery administrator per environment, demotion/deactivation refused for everyone incl. itself; `is_protected` mechanism tagged proposed); updated R3, data model, API errors, UI, security accepted-risk, edge cases; added AC15–AC17                                                                          | R7, R8 (new), R3, AC1–AC17 | None; still draft, no prior approval existed | requirements_architect |
| 2026-10-19 | Owner approval recorded (Johannsen) at `1b373c9`; status draft → approved                                                                                                                                                                                                                                                                                                        | None                       | Approval granted                             | Johannsen              |
| 2026-10-19 | Material change: added `ADM-01-R9` (admin resets another user's password, reusing the creation generator and one-time panel; protected-admin refusal tagged proposed pending owner confirmation; session-revocation left Open); status approved → draft, approval at `7f6c579` marked superseded, re-approval required; updated UI, API, data model, edge cases; added AC18–AC22 | R9 (new), AC1–AC22         | Approval at `7f6c579` superseded             | requirements_architect |
| 2026-10-20 | Owner confirmed the R9 protected-admin refusal and re-approved the spec; status draft → approved                                                                                                                                                                                                                                                                                 | R9                         | None                                         | Johannsen              |
| 2026-10-20 | Security review findings; owner approved 2026-10-20: added `ADM-01-R10` (password reset ends the target's sessions via a new `admin_revoke_sessions` RPC) and the documented access-token-validity limitation; updated technical constraints, data model, API result codes, security notes, and edge cases; added AC23–AC25; status remains `approved`                           | R10 (new), AC23–AC25       | None                                         | requirements_architect |
| 2026-10-22 | Pre-release audit; owner approved 2026-10-22: added `ADM-01-R11` (deactivated accounts get sign-in guidance instead of a silent redirect) and `ADM-01-AC26`; status remains `approved`                                                                                                                                                                                           | R11 (new), AC26            | None                                         | Johannsen              |
