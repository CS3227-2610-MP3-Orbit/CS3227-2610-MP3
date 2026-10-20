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
- Re-approval: Johannsen said "fix those issues" on 2026-10-20, approving an automated security
  review's findings below (`SH-06-R6`, `SH-06-R7`, and the documented limitation). Status remains
  `approved`; the new `password_change_attempts` table and RPC-free rate-limit logic still need
  independent teammate review on the implementation pull request.

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

### SH-06-R6 — Other sessions end after a password change

`confirmed`; source: owner decision 2026-10-20 ("fix those issues," an automated security review).
After a successful change, every _other_ session of the user is signed out via
`supabase.auth.signOut({ scope: "others" })` called on the caller's own cookie-bound client; the
current session (the one that made the change) stays signed in. The success message states that
other devices were signed out. **Documented limitation, not a requirement** (shared with
`ADM-01-R10`): an access token already issued for another session stays valid until it expires
(Supabase default ≤ 1 hour), because `getCurrentUser()` checks it locally via `getClaims`; only the
refresh token is revoked immediately, so that session cannot renew itself past expiry.

### SH-06-R7 — Limit wrong current-password attempts

`confirmed`; source: owner decision 2026-10-20 (security review). Rationale: Supabase Auth's own
sign-in rate limit is per IP, and every verification attempt comes from the server's own IP, so it
does not protect an individual account from repeated guesses; this app-level limit does. At most 5
failed current-password verifications per user in any rolling 15 minutes; the 6th attempt is
refused _before_ contacting Supabase Auth, with `rate_limited` and a retry-after time, message
"Too many attempts. Try again in N minutes."

Backed by a new table `public.password_change_attempts(id generated always as identity, user_id
uuid references public.profiles (id) on delete cascade, created_at timestamptz not null default
now())`: RLS enabled, no policies, all privileges revoked from `anon`/`authenticated` — the server
writes it with `createAdminClient` after `requireUser()`, the same pattern as `ai_usage`.

**Claim-then-count protocol** (to avoid a race where parallel attempts all read the count before
any of them is recorded): insert one attempt row for the user _before_ verifying the current
password; count that user's rows in the trailing 15 minutes, refusing if the count (including the
just-inserted row) exceeds 5; only then verify. If verification succeeds, delete the just-claimed
row, so only failures count toward the limit.

## Non-functional requirements

Keyboard-operable, labelled fields/errors; wrong-current-password error is generic (privacy); no
new performance/capacity concerns.

## UI description

`/account/password`, linked from the role-shell header, for every role. Fields: current, new,
confirm. States: field validation, wrong current password (generic), rate-limited ("Too many
attempts. Try again in N minutes."), submitting, success (states other devices were signed out),
signed-out/inactive (redirected, form never shown). No password is pre-filled, logged, or in a URL.

## Use cases

- **UC1**: correct current + valid new password twice → changes, success shown (other devices
  signed out), stays signed in.
- **UC2**: wrong current password → generic refusal, no change, fields kept for retry.
- **UC3**: invalid new password (too short/mismatched/same-as-current) → field error, no server call.
- **UC4**: a 6th wrong-current-password attempt inside 15 minutes → `rate_limited`, no call to
  Supabase Auth at all.

## Technical constraints and proposals

Uses the existing `@supabase/ssr` client for `auth.updateUser` and `signOut({scope: "others"})`; a
second throwaway client verifies the current password without touching session cookies.
`createAdminClient` is used only to write/read `password_change_attempts` (`SH-06-R7`), since
`authenticated` has no privileges on that table — the password-change call itself still uses no
service-role action on `auth.users`. Needs `requireUser()`.

## Data model and integrity rules

No change to `auth.users`; passwords are never stored by the app. One new append-only migration adds
`public.password_change_attempts` (`SH-06-R7`): RLS enabled, no policies, all privileges revoked
from `anon`/`authenticated`, written only by the server's service-role client — the same shape as
`ai_usage`.

## API and boundary contracts

Proposed Server Action under `/account/password` (not public REST):
`changeOwnPassword({currentPassword, newPassword, confirmPassword})` → success (`otherSessionsEnded:
true`) or `validation_error` (`newPassword`/`confirmPassword`) / `conflict: wrong_current_password`
(generic) / `rate_limited` (with retry-after) / signed-out-or-inactive redirect (`requireUser()`).
No target user id is ever accepted.

## Security requirements

- `requireUser()` runs first; no `createAdminClient` for the `auth.users` update itself (only for
  the attempts table, `SH-06-R7`).
- Wrong-current-password error is generic; passwords are never logged, echoed, or in a URL.
- Rate limiting: Supabase Auth's own sign-in limit is per IP and does not protect one account, since
  every verification comes from the server's IP; `SH-06-R7`'s claim-then-count table is this app's
  own per-account limit.
- Session behaviour: every other session ends on success (`SH-06-R6`). **Documented limitation, not
  a requirement**: an access token already issued for another session stays valid until it expires
  (≤ 1 hour default), since verification is local (`getClaims`); only the refresh token is revoked
  immediately (same limitation noted in `ADM-01-R10`).

## AI behavior

No AI is used. No model call, prompt, or `ai_usage` read/write occurs on this path.

## Edge cases and failure paths

| Condition                                     | Required outcome                                                                                | Invariant preserved                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Wrong current password                        | Generic refusal, no change                                                                      | No account enumeration                                                                             |
| New password too short/long or equals current | `validation_error`, no change                                                                   | Only valid new passwords accepted                                                                  |
| Confirmation mismatch                         | `validation_error`, no change                                                                   | No typo becomes the stored password                                                                |
| Signed-out or deactivated caller              | Redirected/refused, form never shown                                                            | Only active users reach this action                                                                |
| Direct Server Action call bypassing the UI    | Same refusal/validation as the UI                                                               | No UI-only enforcement                                                                             |
| 6th failed verification within 15 minutes     | `rate_limited` + retry-after, before contacting Supabase Auth                                   | One account cannot be brute-forced via this path                                                   |
| A verification succeeds after prior failures  | The just-claimed attempt row is deleted; earlier failures still age out of the 15-minute window | A success does not let failures linger to block a later legitimate change                          |
| Change succeeds                               | Other sessions' refresh tokens stop working; current session continues                          | Compromise via a stolen session is cut short, within the documented access-token-window limitation |

## Acceptance criteria and verification

Planned tests, not results.

- **SH-06-AC1** (R1; integration; live auth) Active user of any role (incl. protected admin), correct current + valid new password → changes, stays signed in
- **SH-06-AC2** (R2; unit + integration (security); live auth) Incorrect current password → generic refusal, unchanged
- **SH-06-AC3** (R3; unit; mocked) New password under 12 or over 72 chars → `validation_error`, no change
- **SH-06-AC4** (R3; unit; mocked) New password equals current, or confirmation mismatches → `validation_error`, no change
- **SH-06-AC5** (R5; integration (security); live DB) Signed-out/deactivated caller invokes page or action directly → refused/redirected, no data
- **SH-06-AC6** (R1, R2; integration; live auth) After a successful change, next sign-in → new password works, old one fails
- **SH-06-AC7** (security; unit + integration (security); live auth) Any outcome → neither current nor new password appears in logs or responses
- **SH-06-AC8** (R6; integration; live auth) With two live sessions for the same user, after changing the password via session 1 → session 2's refresh token no longer works, session 1 still works
- **SH-06-AC9** (R7; unit; mocked) Decision logic given 5 recorded failures in the window → a 6th attempt is refused with `rate_limited` and a retry-after time, before any Supabase Auth call
- **SH-06-AC10** (R7; integration; live auth + DB) 5 wrong current-password attempts, then a 6th attempt using the CORRECT current password, all within 15 minutes → still refused as `rate_limited`
- **SH-06-AC11** (R7; integration; live auth + DB) After a successful change clears the claimed attempt row, a later legitimate change attempt → is not blocked by the earlier failures
- **SH-06-AC12** (R7; pgTAP (security); live DB) `authenticated` and `anon` roles attempt to read or write `password_change_attempts` directly → refused; only the service-role client can

## Review evidence

- Challenge record / review type: none yet. Open findings: none. Human input required: confirm
  the open questions below.

## Open questions blocking approval

None blocking. `requireUser()` is a shared `src/lib/auth` change and needs team review on the PR;
the new `password_change_attempts` table/migration needs independent review too.

## Change log

| Date       | Change and reason                                                                                                                                                                                                                                                                                                                                                             | IDs affected           | Evidence invalidated    | By                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------- | ---------------------- |
| 2026-10-19 | First draft, created alongside `ADM-01-R9` per owner decision                                                                                                                                                                                                                                                                                                                 | R1–R5, AC1–AC7         | None; no prior approval | requirements_architect |
| 2026-10-20 | Owner accepted the proposed route, helper, length bounds and verification; approved                                                                                                                                                                                                                                                                                           | R1–R5                  | None                    | Johannsen              |
| 2026-10-20 | Security review findings; owner approved 2026-10-20: added `SH-06-R6` (other sessions end on change) and `SH-06-R7` (claim-then-count rate limit on wrong current-password attempts, new `password_change_attempts` table) plus the documented access-token-validity limitation; updated UI, API, data model, security, edge cases; added AC8–AC12; status remains `approved` | R6, R7 (new), AC1–AC12 | None                    | requirements_architect |
