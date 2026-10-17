---
id: SH-01
title: Foundation (authentication, roles, data access, AI gateway)
owner: johannsen
status: draft
---

# SH-01: Foundation

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

## Out of scope

Feature-specific rules (booking transitions, slot editing, reports) belong to each role's specs.

## Open questions

- Exact quota numbers: to be derived from the SoC LLM documentation (NUS network only).
- Self sign-up for students, or accounts created only by administrators?

## Change log

| Date       | Change      | By        |
| ---------- | ----------- | --------- |
| 2026-10-17 | First draft | johannsen |
