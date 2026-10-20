---
id: ADM-04
title: Administrator booking reports and AI activity summary
owner: johannsen
status: draft
---

# ADM-04: Administrator booking reports and AI activity summary

## Document control

- Task: `TASK-ADM-04` (GitHub issue #20); author: `requirements_architect`; date:
  2026-10-20. Reviewed HEAD `0f25d6cf69744212d678f0a11bfb88884d146e6a`.
- Digests (`git hash-object`):
  `PRODUCT-SPEC.md`=`d9f63461aeb368ffd811ec50e5a595e0c6047ca7`;
  `SH-01`=`a1a660ead71b0565afddf27633c63b6299bc5fa8`;
  `ADM-01`/`ADM-02`=`a7243bbc56b2fe88cecc15d705352827d17bd2ce`/`c5a17220bba6beb05a3057d10ac1bb56d2ac16ff`;
  `src/lib/ai/client.ts`=`fa59a5bced933739789a6955978fd50b2dc6971b`;
  `src/lib/ai/quota.ts`=`4d122aea0f9052bb1b1de1993d5af29e22eea9b4` (`decideQuota` throws,
  unimplemented); `src/lib/ai/untrusted.ts`=`256da77120512bf5c505fd3fbecd3f0fe7864ab9`;
  migrations=`90abdf0ba39edd9e09bb4bfbb28e7ec1b4d3a0b8`/`6007354846e479048726118395fc41433657e4d9`/`ecf725b04a6e4cdde7d485dc5253490ac64f897c`.
- Parent/shared requirements: `PRODUCT-SPEC.md` (Administrator experience); `SH-01` (AI
  gateway, quota AC6); `ADM-01`/`ADM-02` (RPC/security posture, house style).
- Plan/handoff: none yet; handoff
  `workflow/handoffs/adm-04/2026-10-20-adm-04-requirements-architect.md`.
- Confirmed requirements: owner-confirmed scope (Johannsen via coordinator, 2026-10-20) —
  see R1–R9.
- Proposed, needs review: RPC/jsonb shape, `starts_at` vs. `created_at` anchor, zero-fill
  vs. omit (all R2); model-input shape and 1,200-char bound (R5/R6); local
  `not_configured` guard (R8).
- Unresolved: none block this spec's approval; `decideQuota`/`SH-01-AC6` blocks only
  R5–R8's implementation.

## Product and feature description

Administrators need a read-only view of booking activity and an optional AI summary of the
same numbers, without exposing any student's booking content. ADM-04 covers both halves
(one LLM feature per role): a `/admin/reports` page with counts by
status/course/lecturer/day, and a "Summarise this period" button.

## Scope, non-goals, and dependencies

**In scope**: period selection; one admin-only aggregate RPC; counts-only display; an AI
summary comparing the shown and preceding equal-length period;
handled-failure/missing-config messaging; prompt-injection and data-minimization tests.

**Non-goals**: export; drill-down to bookings/students; charts beyond counts; persisting
the summary; quota-bypassing retries; another role's AI feature.

**Dependencies**: `SH-01`; `ADM-01`/`ADM-02`; existing
`bookings`/`consultation_slots`/`courses`/`course_lecturers`/`profiles`. **AI half only**:
`decideQuota` is unimplemented (owner's own TODO), so `generateText` fails closed today;
R1–R4 do not depend on it.

## Users, roles, and permissions

| Actor                | Allowed                                  | Refused                                             |
| -------------------- | ---------------------------------------- | --------------------------------------------------- |
| Active Administrator | View the report; generate its AI summary | Exporting booking rows; AI output that changes data |
| Lecturer / Student   | Nothing                                  | Any call, incl. direct calls                        |
| Signed-out/inactive  | Nothing                                  | All report data, writes, and model calls            |

Trusted identity/role: `requireRole("admin")`/`current_app_role()`, same as
`ADM-01`/`ADM-02`.

## Functional requirements

### ADM-04-R1 — Reporting period selection

`confirmed` capability; `proposed` bounds. "Last 7/30 days" (today plus the preceding 6/29
SGT days, server-resolved) or a custom range (`end >= start`, span ≤92 days).
Out-of-bounds is refused before any query.

### ADM-04-R2 — Booking aggregate RPC

`confirmed`; `proposed` shape. One admin-only RPC `admin_get_booking_report(p_start_date,
p_end_date text)` returns `totalBookings`, `byStatus` (5 values, zero-filled),
`byCourse`/`byLecturer` (≥1 booking, no zero-fill), `byDay` (SGT days active) — grouped by
the slot's `course_id`/`lecturer_id`. **Flagged**: counted by slot `starts_at`, not
booking `created_at` (may suit non-terminal statuses better).

### ADM-04-R3 — Report excludes private booking content

`confirmed`; source: `PRODUCT-SPEC.md`. Never a student id/name, `topic`, `questions`, or
`rejection_reason` — only counts and catalogue labels.

### ADM-04-R4 — Administrator-only boundary

`confirmed`, same posture as `ADM-01`/`ADM-02-R8`: `security definer`, admin-only,
`execute` to `authenticated` only; the action calls `requireRole("admin")` first. No
write.

### ADM-04-R5 — AI summary trigger and model-input construction

`confirmed`; `proposed` shape. "Summarise this period" calls the RPC twice (shown +
preceding period), building the model input **only** from those results; staff
course/lecturer names are still wrapped with `wrapUntrusted()`/`UNTRUSTED_DATA_RULE`.
`feature: "admin_activity_summary"`.

### ADM-04-R6 — AI output handling

`confirmed`; `proposed` bound. Plain text only, labelled "AI-generated — advisory", capped
at 1,200 chars (word-boundary truncation). Not persisted; each click regenerates.

### ADM-04-R7 — AI cannot mutate data

`confirmed`, inherited from `PRD-01-AC8`. The summary never calls a mutating RPC; the
report is produced independently of any summary request.

### ADM-04-R8 — AI quota, timeout, and unavailable-config handling

`confirmed`; **blocked**. A local guard checks `SOC_LLM_*` config first; absent, returns
`ai_unavailable: not_configured`, no provider call. Typed failures map to the same
friendly family; report unaffected. `decideQuota` is unimplemented, so R5–R8 wait on
`SH-01-AC6`; no retry may bypass a quota refusal.

### ADM-04-R9 — No new tables

`confirmed`. No new table/column; the RPC reads only existing tables; the summary is never
stored.

## Non-functional requirements

No new target beyond `ADM-01`/`ADM-02`'s conventions; the 92-day bound keeps `byDay` small
and the query cheap (no pagination/SLA); no latency target beyond `SH-01`'s 20-second
timeout.

## UI description

A "Reports" page under `/admin/reports` (mirrors `/admin/accounts`/`/admin/courses`): a
period bar re-fetches counts-only tables; a "Summarise this period" button shows the
labelled summary or a handled-failure message, independent of the report's own loading
state. States: loading, empty period, validation error, AI failure/success. No control is
merely hidden.

## Use cases

- **UC1 Preset report**: default "Last 7 days" counts match the seeded fixture.
- **UC2 Bounded custom report**: 92 days succeeds; 93 days is refused before any query.
- **UC3 Generate a summary**: mocked model text renders plain, labelled, ≤1,200 chars.
- **UC4 AI unavailable**: no SoC LLM key → immediate "AI summary unavailable", no provider
  call.
- **UC5 Prompt-injection attempt**: instruction-like course name is wrapped untrusted;
  reply still renders as inert text.
- **UC6 Non-admin/signed-out direct call**: refused, no data, no model call.

## Technical constraints and proposals

No `createAdminClient` needed; `requireRole("admin")` then the RPC, matching
`ADM-01`/`ADM-02`. Zod `.strict()` validates both actions' inputs first. Proposed layout
mirrors `src/features/admin/courses`, with a prompt-builder kept separate from I/O. One
append-only migration; nothing existing edited.

## Data model and integrity rules

No new table/column (R9). One migration adds `admin_get_booking_report(p_start_date text,
p_end_date text)` — `security definer`, `set search_path=''`, admin-only; refuses
(`validation_error`, field `range`) past 92 days or `end < start`; `execute` to
`authenticated` only. Writes nothing beyond `generateText`'s own `ai_usage` insert.

## API and boundary contracts

Proposed Server Actions under `/admin/reports`, each requiring `requireRole("admin")`
first:

- `getBookingReport({startDate, endDate})` → `{kind:'success', period, totalBookings,
byStatus, byCourse, byLecturer, byDay}` or `validation_error` (field) /
  `forbidden_or_not_found`.
- `generateActivitySummary({startDate, endDate})` → `{kind:'success', summary, truncated}`
  or `validation_error` / `forbidden_or_not_found` / `ai_unavailable` (`reason`, optional
  `retryAfterSeconds`); `reason` ∈
  `not_configured|input_too_long|quota_exceeded|timeout|rate_limited|unavailable|empty_response`.

No caller-supplied field/SQL selector; non-admin/signed-out direct calls get
`forbidden_or_not_found`, no data, no model call.

## Security requirements

- `requireRole("admin")`/`current_app_role()='admin'` run first everywhere; no query/model
  call precedes that check.
- Trusted: session role. Untrusted: `startDate`/`endDate`; course/lecturer names
  (admin-entered, still wrapped for the model).
- Disclosure: the RPC returns counts and catalogue labels only — no student
  id/name/contact/`topic`/`questions`/`rejection_reason`.
- Limits: 92-day bound enforced in schema and RPC; one `generateText` call per click, no
  auto-retry; quota is `decideQuota`'s job once it exists.
- Logging: the existing `ai_usage` row is the only record; no prompt/response text logged;
  errors logged only as bounded categories.
- Needs independent human review before merge (new RPC, first Administrator AI feature),
  same as `ADM-01`/`ADM-02`'s precedent.

## AI behavior

- **Data/minimization**: only aggregate counts plus course/lecturer names reach the
  prompt; no student data, since the RPC never returns any (R2/R3).
- **Prompt injection**: an instruction-like course/lecturer name flows into the prompt
  unmodified, mitigated by `wrapUntrusted()`/`UNTRUSTED_DATA_RULE` (R5); tested with such
  a fixture and a mocked model, plus a live check not-run without a key.
- **Capabilities**: read-only summarization; no tool access; output only displayed, never
  reused (R7).
- **Output/rendering**: trimmed, capped at 1,200 characters, rendered as plain text,
  labelled advisory.
- **Authorization order**: `requireRole` → range validation → `not_configured` check →
  `decideQuota` (once implemented) → prompt build → provider call.
- **Quota/failure**: `feature: "admin_activity_summary"` in `ai_usage`; every handled
  failure and a missing key show the same friendly family; the report is unaffected either
  way.

## Edge cases and failure paths

| Condition                                                | Required outcome                                                                                       | Invariant preserved                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Range >92 days or `end < start`                          | `validation_error` (field `range`), no query/model call                                                | Bounded cost; no partial aggregate                                  |
| Zero bookings in the period                              | Success, all counts zero/empty                                                                         | Empty period is not an error                                        |
| Non-admin/signed-out direct call                         | `forbidden_or_not_found`, no data, no model call                                                       | Only active admins reach this feature                               |
| Instruction-like course/lecturer name                    | Appears only inside the untrusted wrapper                                                              | Prompt injection cannot change behavior                             |
| SoC LLM key missing, or a handled `generateText` failure | `ai_unavailable` (`not_configured` or the mapped reason); no/returned provider call; report unaffected | AI failure never blocks the report / dev without a key never throws |
| `decideQuota` not yet implemented                        | AI summary cannot ship; report unaffected                                                              | R1–R4 ship independently of R5–R8                                   |
| Model output >1,200 chars or has markup                  | Truncated at a word boundary / rendered as inert text                                                  | Output stays bounded and inert                                      |

## Acceptance criteria and verification

Planned tests, not results.

- **ADM-04-AC1** (R1; integration; live DB) "Last 7 days" resolves to today plus the
  preceding 6 SGT days; 92 days is accepted, 93 days or `end < start` returns
  `validation_error`.
- **ADM-04-AC2** (R2; integration; live DB) Seeded bookings across
  statuses/courses/lecturers/days produce a zero-filled five-row `byStatus` summing to
  `totalBookings` and exact `byCourse`/`byLecturer`/`byDay` counts; an empty period
  returns all-zero, not an error.
- **ADM-04-AC3** (R2; integration; live DB) A booking is counted by its slot's `starts_at`
  SGT day, not its own `created_at`, when the two differ.
- **ADM-04-AC4** (R3; integration (security); live DB) Seeded student
  names/topics/questions/rejection reasons never appear in the RPC's result.
- **ADM-04-AC5** (R4; integration (security); live DB) A signed-out, Student, or Lecturer
  caller invoking the RPC/action directly gets `forbidden_or_not_found`, no query beyond
  the check.
- **ADM-04-AC6** (R5, security; unit; mocked) With fixture data containing student
  names/topics in other tables, the constructed model input contains none of them.
- **ADM-04-AC7** (R5; unit; mocked) The `generateText` request has `feature:
"admin_activity_summary"` and a system prompt including `UNTRUSTED_DATA_RULE`.
- **ADM-04-AC8** (R5, security; unit; mocked, plus optional live) An instruction-like name
  sits only inside an unclosable `wrapUntrusted()` block; a mocked reply changes no
  behavior; a live check is not-run without a key.
- **ADM-04-AC9** (R6; unit; mocked) Output renders as plain text, never via
  `dangerouslySetInnerHTML`/markdown; output over 1,200 characters truncates at a word
  boundary.
- **ADM-04-AC10** (R6, R9; integration; live DB) Two summary generations for one period
  write no row other than two `ai_usage` rows.
- **ADM-04-AC11** (R7; unit plus integration; mocked + live DB) No booking, slot, course,
  assignment, or profile row changes regardless of model output.
- **ADM-04-AC12** (R8; unit; mocked) Each handled `generateText` failure, and
  `SOC_LLM_API_KEY` unset, shows the matching `ai_unavailable` reason without calling the
  provider.
- **ADM-04-AC13** (R8; unit; mocked, blocked until `decideQuota` is implemented) At the
  configured limit, the result is `ai_unavailable: quota_exceeded` with
  `retryAfterSeconds`; cannot run until `SH-01-AC6`'s `decideQuota` exists.
- **ADM-04-AC14** (R4, R8, security; integration (security); live DB) Exercising only the
  report path (no summary click) leaves zero new `ai_usage` rows.

## Review evidence

- Challenge record: none yet; not independently reviewed.
- Review type: not yet reviewed.
- Open findings: none recorded yet.
- Human input required: the RPC/jsonb shape, the counting anchor, zero-fill convention
  (R2), and the 1,200-character bound (R6); none block drafting.

## Open questions blocking approval

None blocking this spec's draft-to-review path.

Non-blocking: zero-fill vs. omit for `byCourse`/`byLecturer`; `starts_at` vs. `created_at`
anchor; output bound/marker (R2/R6). **Blocking implementation, not approval**: R5–R8 need
`decideQuota`/`SH-01-AC6`; R1–R4 do not.

## Change log

| Date       | Change and reason                                                               | IDs affected    | Evidence invalidated    | By                     |
| ---------- | ------------------------------------------------------------------------------- | --------------- | ----------------------- | ---------------------- |
| 2026-10-20 | First draft from owner-confirmed scope and inspected code/migrations/AI gateway | R1–R9, AC1–AC14 | None; no prior approval | requirements_architect |
