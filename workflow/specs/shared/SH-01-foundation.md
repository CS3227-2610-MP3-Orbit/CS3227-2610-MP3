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
- Quota-change impact record: `workflow/reviews/stu-05/sh-01-quota-change-impact.md`.
- Prior content digest before the 2026-10-19 quota revision:
  `a1a660ead71b0565afddf27633c63b6299bc5fa8`.
- Quota-revision source: Joseph's confirmed 2026-10-19 decisions for active Student AI usage. This is
  material; `status: draft` remains unchanged and all earlier approval reports remain stale pending
  teammate review of the exact revised digest.
- Quota-subset approval report: Joseph reported on 2026-10-19 that he and the team approved the revised
  quota/accounting subset (`SH-01-R6`, `SH-01-AC6`, `SH-01-AC7`). This does not approve the broader
  SH-01 foundation document, which remains `draft` because it has unrelated revised/open requirements.
  Individual identities and remote PR approval were not independently verified; this is not merge,
  deployment, or sensitive-change approval.
- Material quota-subset revision: Joseph accepted the 2026-10-19 admission-day reservation/midnight
  attribution and 30-day metadata-retention decisions. The reported quota-subset approval is stale pending
  renewed team review of the exact revised content.
- Renewed quota-subset approval report: Joseph reported on 2026-10-19 that the team approved the exact
  revised quota subset (`SH-01-R6`, `SH-01-AC6`, `SH-01-AC7`) reviewed at digest
  `07f3f1e5d6c0148076157447ccf584edacc3620e`. SH-01 remains `draft` because this approval does not cover
  its unrelated revised/open requirements. Reviewer identities and remote GitHub/PR evidence remain
  unverified; this is not merge, deployment, or sensitive-implementation approval.

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
  throwing, failures/refusals do not consume a successful daily quota, and non-AI features keep working.

## AI behaviour

- The SoC LLM key and the Supabase secret key exist only on the server.
- User-written text is wrapped with `wrapUntrusted` and the system prompt says it is data, not instructions.
- Inputs longer than 4,000 characters are refused before calling the model.
- Each call times out after 20 seconds.
- `SH-01-R6 — AI quota, rate and accounting boundary`
  - Classification: `confirmed`.
  - Source: Joseph's 2026-10-19 confirmed decisions; shared SoC-key constraint.
  - There is no per-minute or per-Student daily quota. At most 100 app-wide daily-capacity reservations
    may be admitted for each Asia/Singapore calendar day. A valid provider result finalizes its
    admission-day reservation as one successful AI response. The shared daily counter resets at 00:00
    Asia/Singapore according to trusted server/database time, never a browser clock. A request admitted
    before midnight finalizes against that original admission day even if its provider response arrives
    after midnight; a request admitted after midnight uses the new day.
  - A timeout, provider unavailable/rate limit, invalid/empty response, validation failure, accounting
    failure, quota/rate refusal, or duplicate in-flight refusal does not consume either daily successful
    quota. A later deliberate request that receives a valid response counts separately.
  - Before a model call, the server atomically reserves applicable minute and daily capacity and records a
    minimal server-side attempt. At most one attempt may be in flight for each Student. A valid provider
    output atomically finalizes the attempt as successful against its admission-day reservation.
    Timeout, provider, validation, accounting, and refusal failures release the reservation and do not
    consume daily quota. If accounting cannot safely admit or finalize an attempt, the model call is
    refused.
  - A stale pending reservation expires or is reconciled by trusted server/database logic without another
    model call. A resolved retry is a new deliberate request; the system does not promise exactly-once
    provider billing. If a provider outcome cannot safely be determined, it is not claimed as success,
    raw information is not exposed, and the ordinary feature workflow remains usable. Retain only user ID,
    feature identifier, attempt state/outcome, and timestamps; delete each attempt record no later than 30
    days after `created_at`. Never retain prompt text, output text, or raw provider response.

## Acceptance criteria

- **SH-01-AC1** Every table in the `public` schema has row-level security enabled.
- **SH-01-AC2** Given a signed-out visitor, when they open any page other than `/login`, then they are redirected to `/login`.
- **SH-01-AC3** Given a signed-in user, when they open the app or another role's dashboard, then they are sent to their own role's dashboard.
- **SH-01-AC4** Given a new sign-up that includes `role: admin` in its metadata, when the account is created, then its role is `student`.
- **SH-01-AC5** Given user-written text, when it is wrapped for the model, then it sits inside exactly one untrusted-data block that the text cannot close early.
- **SH-01-AC6** Given deterministic usage/accounting fixtures, when 99 app-wide daily-capacity
  reservations exist for the current Asia/Singapore admission day, then the 100th request is admitted and
  the 101st is refused before the model call without revealing other users' usage. No minute or
  per-Student daily quota refusal occurs. A valid response finalizes against its admission day even after
  midnight, while a new request at 00:00 Asia/Singapore uses the new day. Failures/refusals release a
  reservation and do not become a successful response.
- **SH-01-AC7** Given the SoC LLM times out, rate-limits, errors, returns invalid/empty content, or has an
  indeterminate outcome, when a feature calls `generateText`, then it receives a typed failure without an
  exception, its reservation is released or safely reconciled without an automatic provider retry, no
  successful response is claimed, and the feature's ordinary non-AI workflow remains usable. Usage rows
  retain only allowed metadata and are deleted no later than 30 days after `created_at`.
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

- Self sign-up for students, or accounts created only by administrators?

## Change log

| Date       | Change                                                                                                                                | By                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 2026-10-17 | First draft                                                                                                                           | johannsen              |
| 2026-10-18 | Recorded team-reported approval and retained unresolved implementation limits                                                         | requirements_architect |
| 2026-10-18 | Restricted Student staff discovery to narrow RPC projections; reset to draft                                                          | requirements_architect |
| 2026-10-19 | Added user-confirmed Student/global daily AI limits and failure-free accounting; retained global-minute/atomic-mechanism questions    | requirements_architect |
| 2026-10-19 | Added confirmed global 10/minute limit and durable reservation/finalization/expiry protocol; renewed teammate review remains required | requirements_architect |
| 2026-10-19 | Recorded team-reported approval of quota subset only; retained broader SH-01 draft status                                             | requirements_architect |
| 2026-10-19 | Resolved admission-day reservation/midnight attribution and 30-day usage retention; prior quota-subset approval became stale          | requirements_architect |
