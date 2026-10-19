---
id: SH-01
title: Foundation (authentication, roles, data access, AI gateway)
owner: johannsen
status: draft
---

# SH-01: Foundation

## Document control

- Prior approval date: `2026-10-18`.
- Approval report: Joseph communicated in the project Codex conversation that the team approved this
  specification and named Johansen as its reviewer.
- Team-reported reviewed content digest: `ba6eff99926a74423b8b41f58a7815cacab2a4a1`.
- Prior canonical metadata digest: `451469df2a1f39233656b1c25d8aedccbd71702e`.
- External evidence limitation: no GitHub review, protected-PR URL, or independently verified reviewer
  identity was supplied. This repository record documents Joseph's report; it does not authenticate an
  external approval or establish that the reviewer differs from the spec author.
- Material revision: Joseph confirmed on `2026-10-18` that Students retain direct access only to their
  own profile row and discover staff through narrow feature RPC projections, not full staff rows. This
  changes the prior profile authorization contract, resets this canonical specification to `draft`, and
  makes the prior approval stale until a teammate reviews the exact revised digest.
- Change-impact record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-impact.md`.

## Context

All three roles share sign-in, the role model, the database access rules and the gateway to the
SoC LLM. These parts are fixed first so each role can be built in parallel against them.

## Behaviour

- Users sign in with email and password. Signed-out visitors can only reach `/login`.
- After sign-in, each user lands on the dashboard for their role: `/student`, `/lecturer` or `/admin`.
- Opening another role's dashboard sends the user back to their own.
- All calls to the SoC LLM go through `generateText` in `src/lib/ai/client.ts`.

## Permissions

- Roles are stored in `profiles.role` and changed only by administrators.
- New accounts are always students. The role is never taken from sign-up data.
- Deactivated users (`profiles.is_active = false`) are treated as signed out.
- Every page layout, Server Action and Route Handler checks the role with `requireRole` on the server.
- The database enforces the same rules with row-level security, so a bug in the app cannot expose
  another user's data.
- An authenticated Student may read their own profile row for session identity, role, active-state, and
  own-account display needs. A Student may not directly read any other profile row, including a
  Lecturer or Administrator row.
- Student discovery of lecturer/staff data is available only through a feature-specific, narrow RPC
  projection that authorizes an active Student and allowlists the minimum fields approved by that
  feature. It never grants direct `profiles` table access or returns contact, role-management, active-
  state, audit, or other full-profile fields.
- This Student restriction does not decide the direct profile visibility needed by future Lecturer or
  Administrator features; those role contracts require separate specifications.

## Data

Defined in `supabase/migrations/20261017000000_initial_schema.sql`: `profiles` (role and
active status of each user) and `ai_usage` (one row per SoC LLM call, for quotas). Feature tables
such as slots and bookings are defined by their own specs and added by later migrations.

## Failure cases

- Wrong email or password: one generic message, so the form does not reveal which emails exist.
- SoC LLM slow, down, rate-limited or over quota: `generateText` returns a typed failure instead of
  throwing, and non-AI features keep working.

## AI behaviour

- The SoC LLM key and the Supabase secret key exist only on the server.
- User-written text is wrapped with `wrapUntrusted` and the system prompt says it is data, not instructions.
- Inputs longer than 4,000 characters are refused before calling the model.
- Each call times out after 20 seconds.
- Quotas are checked before each call: per user per minute, per user per day, and for the whole app
  per minute (one team key is shared by everyone). Each call is recorded before usage is counted,
  so simultaneous calls cannot slip past a limit together. If usage cannot be recorded or counted,
  the call is refused.

## Acceptance criteria

- **SH-01-AC1** Every table in the `public` schema has row-level security enabled.
- **SH-01-AC2** Given a signed-out visitor, when they open any page other than `/login`, then they are redirected to `/login`.
- **SH-01-AC3** Given a signed-in user, when they open the app or another role's dashboard, then they are sent to their own role's dashboard.
- **SH-01-AC4** Given a new sign-up that includes `role: admin` in its metadata, when the account is created, then its role is `student`.
- **SH-01-AC5** Given user-written text, when it is wrapped for the model, then it sits inside exactly one untrusted-data block that the text cannot close early.
- **SH-01-AC6** Given recent AI usage counts, when any of the per-user-minute, per-user-day or global-minute limits is reached, then the call is refused with a reason and a retry time.
- **SH-01-AC7** Given the SoC LLM times out, rate-limits or errors, when a feature calls `generateText`, then it receives a typed failure and no exception.
- **SH-01-AC8** Given an authenticated Student, when database permissions are exercised directly, then
  the Student can read their own profile row but cannot read any other profile row; an approved narrow
  feature RPC may return only its allowlisted staff projection after independently checking the active
  Student role.

## Out of scope

Feature-specific rules (booking transitions, slot editing, reports) belong to each role's specs.

## Required implementation and test impact

- Replace the broad Student-readable staff-profile policy through a new append-only migration; do not
  edit the existing migration. The migration must preserve own-profile access required by session/role
  resolution and must not broaden Lecturer or Administrator access without an approved role spec.
- Add pgTAP/security tests for `SH-01-AC8`, including own-row success, other-profile denial, direct audit
  and active-state field denial, and successful narrow feature projection only for an active Student.
- Re-run all profile-dependent authentication and feature tests. The existing failing STU-01 profile
  assertion is evidence of the required change, not approval to patch RLS before this draft is approved.

## Unresolved implementation decisions

- Exact quota numbers: to be derived from the SoC LLM documentation (NUS network only).
- Self sign-up for students, or accounts created only by administrators?

## Change log

| Date       | Change                                                                        | By                     |
| ---------- | ----------------------------------------------------------------------------- | ---------------------- |
| 2026-10-17 | First draft                                                                   | johannsen              |
| 2026-10-18 | Recorded team-reported approval and retained unresolved implementation limits | requirements_architect |
| 2026-10-18 | Restricted Student staff discovery to narrow RPC projections; reset to draft  | requirements_architect |
