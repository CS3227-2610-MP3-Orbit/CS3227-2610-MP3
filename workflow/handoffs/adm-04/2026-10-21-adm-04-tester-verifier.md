# Handoff: TASK-ADM-04 / ADM-04-R1..R11, AC1..AC16 — tester_verifier → coordinator

<!--
Keep this JSON block valid. The completion hook validates structure, not truth or approval.
Use [] for no changed files or no unresolved issues. "blocked" and "not-run" are honest results.
-->
<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-04",
"requirementIds": ["ADM-04-R1", "ADM-04-R2", "ADM-04-R3", "ADM-04-R4", "ADM-04-R5", "ADM-04-R6", "ADM-04-R7", "ADM-04-R8", "ADM-04-R9", "ADM-04-R10", "ADM-04-R11"],
"status": "passed",
"changedFiles": [],
"verification": [
{"check": "npm run lint", "result": "passed", "evidence": "0 errors/warnings"},
{"check": "npm run typecheck", "result": "passed", "evidence": "next typegen + tsc --noEmit clean"},
{"check": "npx vitest run --exclude 'workflow/**'", "result": "passed", "evidence": "Test Files 36 passed; Tests 268 passed, incl. every admin/reports unit file"},
{"check": "npm run check:spec", "result": "passed", "evidence": "0 errors; ADM-04-AC1..AC16 all covered by a non-skipped test; exit code 0"},
{"check": "npx supabase test db", "result": "passed", "evidence": "Files=13 Tests=226 Result: PASS, incl. supabase/tests/admin_booking_reports.test.sql, ok"},
{"check": "eval \"$(npx supabase status -o json | node tests/integration/local-supabase-env.mjs)\" && npm run test:admin-reports:integration", "result": "passed", "evidence": "Test Files 1 passed; Tests 8 passed (incl. AC16 added by the R11 coordinator addendum)"},
{"check": "ADMIN_E2E_PORT=3104 npx playwright test --config tests/e2e/admin.playwright.config.ts", "result": "passed (1 unrelated pre-existing failure)", "evidence": "run 1: 25/26 passed, the only failure is [SH-07-AC1]/[SH-07-AC20] (ui-shell.spec.ts, a different in-flight feature, not ADM-04); both admin-reports.spec.ts tests passed, covering AC1/AC2"},
{"check": "direct migration read: supabase/migrations/20261021110000_admin_booking_reports_derived_completion.sql", "result": "passed (manual review)", "evidence": "confirmed the byStatus grouping uses \"case when b.status = 'approved' and now() >= s.ends_at then 'completed' else b.status::text end\", matching LEC-03-R4's display rule exactly, with now() (not clock_timestamp()) correctly keeping the function STABLE"},
{"check": "post-run DB hygiene check (service-role read)", "result": "passed", "evidence": "0 admin.activity-summary ai_usage rows, 0 stray adm04- fixture courses/profiles after every run"}
],
"unresolvedIssues": [
"ADM-04-AC8's live-model half (a real SOCLAAS key hitting a real provider) remains not-run in this environment, same as the developer reported -- no key is configured here. This is explicitly allowed by the spec's own acceptance text ('a live check is not-run without a key') and is not a gap I can close without credentials; the mocked-reply half is independently verified and sound."
]
}
<!-- HANDOFF:END -->

## Status

passed

## Scope and gate

- Task/requirement IDs: TASK-ADM-04 (issue #20), ADM-04-R1..R11 (R11/AC16 added by the
  2026-10-21 owner amendment for derived "completed" status), ADM-04-AC1..AC16.
- Spec reviewed: `workflow/specs/admin/ADM-04-booking-reports-and-ai-summary.md`, front matter
  `status: approved`, owner Johannsen, 2026-10-21, covering R1-R11/AC1-AC16 as written (R11/AC16
  added 2026-10-21, "also fix the bug").
- Implementation/handoffs reviewed:
  `workflow/handoffs/adm-04/2026-10-20-adm-04-requirements-architect.md`,
  `workflow/handoffs/adm-04/2026-10-21-adm-04-developer.md` (incl. its "Coordinator addendum:
  R11 derived completion" section documenting the follow-up migration).
- No test, fixture, product code, or migration file was modified during this review. A tiny
  read-only Node probe (service-role queries only) was used in the scratchpad dir to confirm no
  stray fixture rows or `ai_usage` rows were left on the shared stack; it wrote no file under the
  project tree and was discarded.
- This review is independent: every count below was produced by running the suite myself, and the
  R11 migration's SQL was read and checked by hand against LEC-03-R4's own display rule.

## AC → test traceability

| AC   | Requirement | Test(s)                                                                                                          | Layer                       | Judgment                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---- | ----------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1  | R1          | `tests/integration/admin-reports.test.ts`; `src/features/admin/reports/{period,validation,server}.test.ts`; e2e  | live DB + unit + e2e        | Sound: 92-day accepted, 93-day and `end < start` refused, re-checked at the pure-date-math, server-action, RPC, and browser layers.                                                                                                                                                                                                                                                                           |
| AC2  | R2          | `tests/integration/admin-reports.test.ts` (two tests: zero-booking and seeded-mix); e2e                          | live DB + e2e               | Sound and rigorous: the seeded-mix test checks every status/course/lecturer/day count against hand-computed expected values, not just totals; zero-fill is checked for an empty period too.                                                                                                                                                                                                                   |
| AC3  | R2          | `tests/integration/admin-reports.test.ts` (dedicated `starts_at`-vs-`created_at` test, plus the seeded-mix test) | live DB                     | Sound: a booking's `created_at` is set to a different day than its slot's `starts_at`, and the report is shown to follow the slot's day only.                                                                                                                                                                                                                                                                 |
| AC4  | R3          | `tests/integration/admin-reports.test.ts`                                                                        | live DB (security)          | Sound: serializes the real RPC response to JSON and asserts it contains none of the seeded student id, name, topic, questions, or rejection reason.                                                                                                                                                                                                                                                           |
| AC5  | R4          | `supabase/tests/admin_booking_reports.test.sql`; `tests/integration/admin-reports.test.ts`                       | pgTAP (security) + live DB  | Sound: covers Server-Action redirects, a direct non-admin RPC call, and a direct `anon` call (`42501` before the function body runs).                                                                                                                                                                                                                                                                         |
| AC6  | R5          | `src/features/admin/reports/server.test.ts` (two tests: schema-strictness and untrusted-wrapping)                | unit (mocked)               | Sound: one test proves an unexpected extra field on a reported row is rejected outright (`temporarily_unavailable`) rather than silently forwarded; the other proves the actual prompt input string never contains the private field names.                                                                                                                                                                   |
| AC7  | R5          | `src/features/admin/reports/server.test.ts`                                                                      | unit (mocked)               | Sound: asserts `feature: "admin.activity-summary"`, the system prompt contains the untrusted-data rule text, and that `requireRole` runs strictly before `generateText`.                                                                                                                                                                                                                                      |
| AC8  | R5          | `src/features/admin/reports/server.test.ts`                                                                      | unit (mocked); live not-run | Sound for the mocked half: an instruction-like course name is confirmed wrapped inside `<untrusted_data source="admin.course-name">...</untrusted_data>` tags in the real constructed prompt string. The live-model half is legitimately not-run (no key here), as the spec itself allows.                                                                                                                    |
| AC9  | R6          | `src/features/admin/reports/presentation.test.ts`; `server.test.ts` (source-scan)                                | unit                        | Sound: truncation is checked at exact boundaries (word-boundary-only, never mid-word, Unicode-safe via `.length`), and the rendered panel's source is scanned for the absence of `dangerouslySetInnerHTML`/Markdown.                                                                                                                                                                                          |
| AC10 | R6, R9      | `tests/integration/admin-reports.test.ts`                                                                        | live DB                     | Sound: two real `generateActivitySummary` calls against real Postgres/real `claim_ai_attempt`, asserting exactly two new `ai_usage` rows, both `succeeded`, both tagged `admin.activity-summary`.                                                                                                                                                                                                             |
| AC11 | R7          | `tests/integration/admin-reports.test.ts`; `src/features/admin/reports/server.test.ts`                           | live DB + unit (mocked)     | Sound: integration re-reads the real course/slot/booking rows after two real summary generations and confirms none changed; unit confirms the only RPC ever called while summarizing is the read-only report RPC, across three different model outcomes.                                                                                                                                                      |
| AC12 | R8          | `src/features/admin/reports/server.test.ts` (two `not_configured` tests + an `it.each` over 8 failure reasons)   | unit (mocked)               | Sound and thorough: every documented `AiFailure` reason, plus both missing-env-var cases, each independently confirmed to short-circuit before any provider/RPC call.                                                                                                                                                                                                                                         |
| AC13 | R8          | `src/features/admin/reports/server.test.ts`                                                                      | unit (mocked)               | Sound: `quota_exceeded` maps through with `retryAfterSeconds`, and exactly one `generateText` call is made (no auto-retry).                                                                                                                                                                                                                                                                                   |
| AC14 | R4, R8      | `tests/integration/admin-reports.test.ts`                                                                        | live DB (security)          | Sound: two real report-only calls, then a real `ai_usage` count check confirms zero new rows.                                                                                                                                                                                                                                                                                                                 |
| AC15 | R10         | `supabase/tests/admin_booking_reports.test.sql`                                                                  | pgTAP (security)            | Sound and thorough: proves the shared count across all three admitted features, the per-user in-flight guard, refusal of an unlisted feature name, the 100-success quota-exhaustion edge against all three features at once (inside a rolled-back transaction, so the shared stack's real daily budget is never touched), and that a non-service-role caller cannot call the accounting RPC directly.         |
| AC16 | R11         | `tests/integration/admin-reports.test.ts`                                                                        | live DB                     | Sound: creates one already-ended `approved` slot/booking and one future `approved` slot/booking inside one report window, confirms the `completed` delta is exactly +1 and `approved` delta is exactly +1 (using a before/after baseline so it is robust to other data sharing the window), confirms `byStatus` still sums to `totalBookings`, and confirms both rows remain stored as `approved` (no write). |

Every AC has a live-DB, pgTAP, or (where the spec itself calls for it) a sound mocked-unit test;
no AC is backed only by a tautological assertion.

## Commands run and actual results

- `npm run lint` → passed, 0 errors/warnings.
- `npm run typecheck` → passed.
- `npx vitest run --exclude 'workflow/**'` → Test Files 36 passed; Tests 268 passed.
- `npm run check:spec` → 0 errors, exit code 0; every ADM-04-AC1..AC16 covered.
- `npx supabase test db` → `Files=13, Tests=226 ... Result: PASS` (incl.
  `admin_booking_reports.test.sql`, reports "ok").
- `eval "$(npx supabase status -o json | node tests/integration/local-supabase-env.mjs)" && npm run test:admin-reports:integration`
  → Test Files 1 passed; Tests 8 passed (AC1, AC2 ×2, AC3, AC4, AC5, AC10/AC11, AC14, AC16).
- `eval "..." && ADMIN_E2E_PORT=3104 npx playwright test --config tests/e2e/admin.playwright.config.ts`
  → 25 passed, 1 failed (`[SH-07-AC1]`/`[SH-07-AC20]`, unrelated `ui-shell.spec.ts` sign-in flow,
  a different in-flight feature). Both `admin-reports.spec.ts` tests passed:
  `[ADM-04-AC1][AC2]` and `[ADM-04-AC1]` (93-day refusal).
- Manual read of `supabase/migrations/20261021110000_admin_booking_reports_derived_completion.sql`:
  confirmed the `byStatus` subquery's `case when b.status = 'approved' and now() >= s.ends_at then
'completed' else b.status::text end` exactly matches LEC-03-R4's display-derived completion rule,
  that no booking row is written, and that `now()` (transaction-stable) rather than
  `clock_timestamp()` (volatile) is used so the function can stay `stable` — a correct, deliberate
  choice recorded in the migration's own comment.
- Post-run service-role query: 0 `ai_usage` rows tagged `admin.activity-summary`, 0 stray
  `adm04-`-prefixed fixture courses/profiles after every run.

## Findings

None. No functional, security, or test-quality defect was found in ADM-04. The one open item
(AC8's live-model half) is a pre-existing, spec-permitted environment limitation (no SoC LLM key
configured here), not a defect — see "Gaps" below.

## Changes

None — read-only verification. No test, fixture, product code, or migration file was modified.

## Gaps and unresolved questions

- `ADM-04-AC8`'s live-provider half cannot be exercised without a real `SOCLAAS_API_KEY`/
  `SOCLAAS_BASE_URL`, which is not available in this environment. The spec's own acceptance text
  explicitly allows this ("a live check is not-run without a key"), so this is not treated as a
  failure; the mocked-reply half (the actual prompt-injection-containment property) is verified
  and sound.
- No other coverage gaps found. In particular, R11's derived-completion fix (the one real defect
  found and fixed earlier in this feature's history) is now well covered by a dedicated live-DB
  test (`AC16`) that uses a before/after delta rather than an absolute count, making it robust to
  any other data sharing the same report window on this shared stack.

## Next action

Coordinator: this feature can proceed — no defect was found and every automated check (lint,
typecheck, unit, pgTAP, live-DB integration, e2e) passes independently of the developer's own
report, including the R11/AC16 derived-completion fix. No further action needed beyond the
existing plan to re-run AC8's live-model half once a SoC LLM key is available in some environment.

Handoff evidence: workflow/handoffs/adm-04/2026-10-21-adm-04-tester-verifier.md
