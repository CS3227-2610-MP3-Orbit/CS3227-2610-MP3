---
id: SH-06
title: Change my own password
owner: team
status: approved
---

# SH-06: Change my own password

## Document control

- Task: owner decision 2026-10-19 (relayed by the coordinator alongside `ADM-01-R9`); author:
  `requirements_architect`; reviewed HEAD `3c8ba194d06439183318b66ba4824e8dc0521c1f`.
- Parent/shared requirements: `SH-01`. Relates to `ADM-01-R9` (admin resets _another_ user's
  password); this spec is self-service only.
- Confirmed: any signed-in active user, incl. the protected recovery admin, can change their own
  password; current password verified first; no forced change on first login. Route
  `/account/password`, `requireUser()` helper, 12–72 password length and server-side verification
  were proposed and accepted by the owner on 2026-10-20.
- Approval: approved by Johannsen on 2026-10-20 (owner approval; this shared spec and the shared
  `requireUser()` change still need independent teammate review on the implementation pull request).

## Product and feature description

An admin can give or reset a password (`ADM-01-R1`/`R9`), but no one can change their own once
signed in. SH-06 adds one shared page where any active user — incl. the protected recovery admin —
sets a new password after proving they know the current one.

## Scope, non-goals, and dependencies

**In scope**: a shared "change my password" page/action for any signed-in active user.
**Non-goals**: forgot-password/email reset; forced first-login change (owner: out of scope); MFA;
changing another user's password (`ADM-01-R9`, admin-only).
**Dependencies**: `SH-01` only; calls Supabase Auth, no feature table involved.

## Users, roles, and permissions

| Actor                                                       | Allowed                                             | Refused                                            |
| ----------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| Any signed-in active user (any role, incl. protected admin) | Change own password after verifying the current one | Changing another's password; skipping verification |
| Signed-out/inactive user                                    | Login guidance only                                 | The page and action, even with a stale session     |

Trusted identity source: the server-resolved session, for "any active role" — `requireRole(role)`
cannot express that; see `SH-06-R5`.

## Functional requirements

### SH-06-R1 — Change my own password

`confirmed`; source: owner decision 2026-10-19. Any active user opens `/account/password` (linked
from the role-shell header, next to "Sign out") and submits current + new password + confirmation.
On success the password changes; the user stays signed in on that session.

### SH-06-R2 — Current password verified server-side

`confirmed` capability, `proposed` mechanism (no SMTP, so no email reauthentication). **Proposed**:
a server-side sign-in attempt for the caller's own email + supplied current password, via a
throwaway client that never touches the real session cookies; only on success does it call
`auth.updateUser({password})` on the caller's session. Wrong current password → one generic error.

### SH-06-R3 — New password rules

`proposed`; source: bcrypt-backed Supabase Auth plus the owner's brevity preference. Minimum 12,
maximum 72 (bcrypt limit), must differ from the current password; no composition rules.

### SH-06-R4 — No forced change on first login

`confirmed`; source: owner decision 2026-10-19 (explicitly out of scope). A credential an admin
created or reset works immediately; nothing forces a change before use.

### SH-06-R5 — Authorization for "any active user," not one role

`confirmed` requirement, `proposed` implementation. `requireRole(role)` takes one role, not "any."
**Proposed**: a small `requireUser()` helper in `src/lib/auth/session.ts`, returning the active
signed-in user regardless of role and redirecting signed-out/inactive callers like `requireRole`
does — a shared `src/lib/` change needing its own team review (`AGENTS.md`); contract proposed, not code.

## Non-functional requirements

Keyboard-operable, labelled fields/errors; wrong-current-password error is generic (privacy); no
new performance/capacity concerns.

## UI description

`/account/password`, linked from the role-shell header, for every role. Fields: current, new,
confirm. States: field validation, wrong current password (generic), submitting, success,
signed-out/inactive (redirected, form never shown). No password is pre-filled, logged, or in a URL.

## Use cases

- **UC1**: correct current + valid new password twice → changes, success shown, stays signed in.
- **UC2**: wrong current password → generic refusal, no change, fields kept for retry.
- **UC3**: invalid new password (too short/mismatched/same-as-current) → field error, no server call.

## Technical constraints and proposals

Uses the existing `@supabase/ssr` client for `auth.updateUser`; a second throwaway client verifies
the current password without touching session cookies. No `createAdminClient`. Needs `requireUser()`.

## Data model and integrity rules

No new table/column/migration. Passwords are never stored by the app; `auth.users` alone holds
the password hash.

## API and boundary contracts

Proposed Server Action under `/account/password` (not public REST):
`changeOwnPassword({currentPassword, newPassword, confirmPassword})` → success or
`validation_error` (`newPassword`/`confirmPassword`) / `conflict: wrong_current_password` (generic)
/ signed-out-or-inactive redirect (`requireUser()`). No target user id is ever accepted.

## Security requirements

- `requireUser()` runs first; no `createAdminClient`; rate limiting relies on Supabase Auth's limits.
- Wrong-current-password error is generic; passwords are never logged, echoed, or in a URL.
- Session behaviour (**Open**, non-blocking): the changing session stays valid; other sessions'
  invalidation is unconfirmed (same limitation as `ADM-01-R9`'s open question).

## AI behavior

No AI is used. No model call, prompt, or `ai_usage` read/write occurs on this path.

## Edge cases and failure paths

| Condition                                     | Required outcome                     | Invariant preserved                 |
| --------------------------------------------- | ------------------------------------ | ----------------------------------- |
| Wrong current password                        | Generic refusal, no change           | No account enumeration              |
| New password too short/long or equals current | `validation_error`, no change        | Only valid new passwords accepted   |
| Confirmation mismatch                         | `validation_error`, no change        | No typo becomes the stored password |
| Signed-out or deactivated caller              | Redirected/refused, form never shown | Only active users reach this action |
| Direct Server Action call bypassing the UI    | Same refusal/validation as the UI    | No UI-only enforcement              |

## Acceptance criteria and verification

Planned tests, not results.

- **SH-06-AC1** (R1; integration; live auth) Active user of any role (incl. protected admin), correct current + valid new password → changes, stays signed in
- **SH-06-AC2** (R2; unit + integration (security); live auth) Incorrect current password → generic refusal, unchanged
- **SH-06-AC3** (R3; unit; mocked) New password under 12 or over 72 chars → `validation_error`, no change
- **SH-06-AC4** (R3; unit; mocked) New password equals current, or confirmation mismatches → `validation_error`, no change
- **SH-06-AC5** (R5; integration (security); live DB) Signed-out/deactivated caller invokes page or action directly → refused/redirected, no data
- **SH-06-AC6** (R1, R2; integration; live auth) After a successful change, next sign-in → new password works, old one fails
- **SH-06-AC7** (security; unit + integration (security); live auth) Any outcome → neither current nor new password appears in logs or responses

## Review evidence

- Challenge record / review type: none yet. Open findings: none. Human input required: confirm
  the open questions below.

## Open questions blocking approval

None blocking. `requireUser()` is a shared `src/lib/auth` change and needs team review on the PR.

Non-blocking: whether a change should revoke other sessions is Open, shared with `ADM-01-R9`.

## Change log

| Date       | Change and reason                                                                   | IDs affected   | Evidence invalidated    | By                     |
| ---------- | ----------------------------------------------------------------------------------- | -------------- | ----------------------- | ---------------------- |
| 2026-10-19 | First draft, created alongside `ADM-01-R9` per owner decision                       | R1–R5, AC1–AC7 | None; no prior approval | requirements_architect |
| 2026-10-20 | Owner accepted the proposed route, helper, length bounds and verification; approved | R1–R5          | None                    | Johannsen              |
