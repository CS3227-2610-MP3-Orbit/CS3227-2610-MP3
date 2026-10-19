---
id: ADM-01
title: Administrator account management
owner: johannsen
status: draft
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
  policy; admins may create/promote administrators; `ADM-01-R7` (zero-active-admin lockout); and
  `ADM-01-R8` (one protected recovery administrator per environment).
- Proposed, needs review: `ADM-01-R8`'s exact mechanism only (`is_protected` column, partial unique
  index, migration-time marking). Unresolved: none blocking.

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

## Non-functional requirements

No new performance/accessibility/capacity target beyond existing conventions (keyboard operable,
visible focus, labelled errors). Account volume is small for this course project; no pagination SLA.

## UI description

An "Accounts" page under `/admin`: search/filter list, per-row role/active-status controls, and a
"Create account" form (email, full name, role). States: loading, empty result, field validation
error, duplicate-email conflict, submitting, success (credential shown once). The signed-in admin's
own row and the protected recovery admin's row (badged "protected") have role/active controls
disabled and explained, not merely hidden — a direct call is still refused server-side.

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

Creation must use `createAdminClient` only after `requireRole("admin")` (project rule). Role-change
and activate/deactivate go through new security-definer RPCs (owner decision 2026-10-19), matching
Joseph's RPC-only pattern (`SH-03`/`SH-05`), not the direct admin `UPDATE` policy — see Data model.

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
is unchanged. No existing migration is edited. **Open, not a requirement here**: how a deactivated/
role-changed lecturer interacts with Joseph's `course_lecturers`/`consultation_slots`/`bookings` is
left to that feature's own spec.

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

## Acceptance criteria and verification

Planned tests, not results.

| ID          | Requirement  | Given / when / then                                                                                                                               | Verification                          | Mocked/live      |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------- |
| ADM-01-AC1  | R1           | Valid lecturer input → created profile's role is `lecturer`, not the trigger's default `student`                                                  | integration                           | live DB          |
| ADM-01-AC2  | R1           | Valid student input → one profile created with role `student`                                                                                     | unit + integration                    | live DB          |
| ADM-01-AC3  | R1           | Email already in use → `conflict: duplicate_email`, no second account                                                                             | integration                           | live DB          |
| ADM-01-AC4  | R2           | List/search existing accounts → only allowlisted fields, no password/secret                                                                       | integration                           | live DB          |
| ADM-01-AC5  | R3           | Admin changes another user's role → stored role updates and reads back                                                                            | integration                           | live DB          |
| ADM-01-AC6  | R3, R5       | Admin attempts own role change, incl. direct Server Action/RPC call → refused, unchanged                                                          | unit + integration + pgTAP (security) | live DB          |
| ADM-01-AC7  | R4           | Admin deactivates then reactivates another user → `is_active` reflects each change                                                                | integration                           | live DB          |
| ADM-01-AC8  | R4, R5       | Admin attempts self-deactivation, incl. direct call → refused, stays active                                                                       | unit + integration + pgTAP (security) | live DB          |
| ADM-01-AC9  | R6           | User deactivated while holding a live session → next request denied as signed out                                                                 | pgTAP + e2e                           | live DB          |
| ADM-01-AC10 | R1–R4        | Signed-out/non-admin caller invokes any Server Action or RPC directly → refused, no data, no mutation                                             | integration (security)                | live DB          |
| ADM-01-AC11 | R1           | Malformed email, empty name, or invalid role → `validation_error` naming the field, no account                                                    | unit                                  | mocked           |
| ADM-01-AC12 | R1, security | Any success or failure → no password/secret in response or server logs                                                                            | unit + integration                    | live DB          |
| ADM-01-AC13 | R1, R2       | A just-created account's credential → never present in `listAccounts`/any later read, and not re-returned by a second call                        | integration (security)                | live DB          |
| ADM-01-AC14 | R7           | Exactly two active admins, each concurrently demotes/deactivates the other → at most one change commits, at least one active admin always remains | pgTAP (concurrent)                    | live DB          |
| ADM-01-AC15 | R8           | Another admin calls `admin_set_role`/`admin_set_active` on the protected admin → refused (`forbidden_protected`), nothing changes                 | pgTAP                                 | live DB          |
| ADM-01-AC16 | R8, security | Any authenticated role, including admin, attempts to update `profiles.is_protected` directly → refused/no effect; no RPC or grant permits it      | pgTAP (security)                      | live DB          |
| ADM-01-AC17 | R8           | The protected admin's row is rendered in the accounts list → role and deactivate controls are hidden/disabled, protected badge shown              | unit + e2e                            | mocked + live UI |

## Review evidence

- Challenge record: none yet; not independently reviewed.
- Review type: not yet reviewed.
- Open findings: none recorded yet.
- Human input required: none blocking; see below for one non-blocking implementation detail.

## Open questions blocking approval

None currently blocking: the owner's 2026-10-19 decisions resolved the prior open questions and
confirmed `ADM-01-R7` and `ADM-01-R8` above. Non-blocking: `ADM-01-R8`'s exact mechanism
(`is_protected` column/index/migration-time marking) is `proposed` for implementation review, not the
capability; the lecturer-deactivation interaction with Joseph's tables is left to that feature's own
spec; Supabase public sign-up stays enabled (residual risk, out of scope for ADM-01).

## Change log

| Date       | Change and reason                                                                                                                                                                                                                                                                                                              | IDs affected               | Evidence invalidated                         | By                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | -------------------------------------------- | ---------------------- |
| 2026-10-19 | First draft from confirmed owner decisions and inspected code                                                                                                                                                                                                                                                                  | R1–R6, AC1–AC12            | None; no prior approval                      | requirements_architect |
| 2026-10-19 | Owner decision resolved credential, data-access, and admin-creation open questions; confirmed R1/R3; added proposed R7 (zero-admin lockout) and its lock requirement; replaced RLS-only data model with RPC migration + policy drop; added AC13–AC14 and pgTAP coverage to AC6/AC8; removed resolved items from open questions | R1, R3, R7 (new), AC1–AC14 | None; still draft, no prior approval existed | requirements_architect |
| 2026-10-19 | Owner confirmed R7; owner added and confirmed R8 (one protected recovery administrator per environment, demotion/deactivation refused for everyone incl. itself; `is_protected` mechanism tagged proposed); updated R3, data model, API errors, UI, security accepted-risk, edge cases; added AC15–AC17                        | R7, R8 (new), R3, AC1–AC17 | None; still draft, no prior approval existed | requirements_architect |
