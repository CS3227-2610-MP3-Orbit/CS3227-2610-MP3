# Security review: ADM-04 (booking reports and AI activity summary)

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
{"check": "npm run lint", "result": "passed", "evidence": "eslint: no output, zero errors/warnings"},
{"check": "npm run typecheck", "result": "passed", "evidence": "next typegen + tsc --noEmit clean"},
{"check": "npx supabase test db (full pgTAP suite, rolled back)", "result": "passed", "evidence": "Files=13 Tests=226 Result: PASS, incl. supabase/tests/admin_booking_reports.test.sql and student_improve_request.test.sql (claim_ai_attempt allowlist regression)"},
{"check": "npx vitest run --exclude 'workflow/**' (full unit suite, mocked)", "result": "passed", "evidence": "Test Files 36 passed; Tests 268 passed, incl. [ADM-04-AC6]/[AC7]/[AC8]/[AC9] in src/features/admin/reports/server.test.ts"},
{"check": "npm run check:spec", "result": "passed", "evidence": "no ADM-04 errors; grep for ADM-04/error/FAIL on the output found nothing"},
{"check": "grep for dangerouslySetInnerHTML across src/", "result": "passed", "evidence": "zero live usages; only test files asserting its absence"},
{"check": "static review of 20261021100000_admin_booking_reports.sql and 20261021110000_admin_booking_reports_derived_completion.sql", "result": "passed", "evidence": "see Findings/Checks below"},
{"check": "static review of src/features/admin/reports/**, src/app/admin/reports/**, src/lib/ai/client.ts, src/lib/ai/untrusted.ts", "result": "passed", "evidence": "see Findings/Checks below"},
{"check": "data-minimization check: read public.bookings column list and admin_get_booking_report's query against it", "result": "passed", "evidence": "see Findings/Checks below; no student_id/topic/questions/rejection_reason is ever selected"}
],
"unresolvedIssues": [
"ADM-04-AC8's live-model half (a real SOCLAAS_* call with an instruction-like name) could not be run by this review: no SoC LLM key is configured here either, same as the developer's own session. Covered by the mocked-reply unit test only.",
"The ADM-04 developer's own handoff (workflow/handoffs/adm-04/2026-10-21-adm-04-developer.md) self-reports a High-severity rule violation: `npx supabase status -o json` was run directly (not piped through local-supabase-env.mjs) once during that session, printing the local stack's ANON_KEY/SECRET_KEY/SERVICE_ROLE_KEY/JWT_SECRET into that session's own tool output. This review did not re-trigger or verify that exposure (this review only ever used the mandated eval \"$(... | node tests/integration/local-supabase-env.mjs)\" pattern, and in fact ran no command that touches Supabase status/keys at all), but the coordinator's decision on whether to rotate that disposable local stack's keys, recorded as 'Open' in the developer handoff, is still outstanding and is called out again here for visibility.",
"The live-DB integration suite (test:admin-reports:integration) and e2e suite (admin-reports.spec.ts) were not re-run by this review, per the assignment's instruction to avoid the shared integration/e2e suites that tester_verifier is running concurrently in this worktree."
]
}
<!-- HANDOFF:END -->

## Status

passed — no blocking findings in the code reviewed. One Medium-severity residual item carried
forward from the developer's own self-report (local key exposure, not something this review
caused or can remediate) and two Info-level notes. No Critical/High finding in the feature code
itself.

## Scope and effective restrictions

- Role: `security_reviewer`, operating on `feature/admin-announcements` at commit
  `72b6e363b17d9c83009f6bbc3da69d20d5bd6698` (clean working tree, verified via `git status --short`).
- Task/requirement IDs: `TASK-ADM-04` (issue #20), `ADM-04-R1`..`R11`, `ADM-04-AC1`..`AC16`.
- Spec: `workflow/specs/admin/ADM-04-booking-reports-and-ai-summary.md` (`status: approved`, owner
  Johannsen, 2026-10-21, incl. the R11/AC16 bugfix amendment). Developer handoff read for context:
  `workflow/handoffs/adm-04/2026-10-21-adm-04-developer.md` (incl. its coordinator addendum on
  R11's derived-completion fix).
- Files reviewed: `supabase/migrations/20261021100000_admin_booking_reports.sql`,
  `supabase/migrations/20261021110000_admin_booking_reports_derived_completion.sql`,
  `supabase/tests/admin_booking_reports.test.sql`,
  `src/features/admin/reports/{validation,period,prompt,presentation,server}.ts`,
  `src/app/admin/reports/{actions,summary-panel}.tsx`, `src/lib/ai/client.ts`,
  `src/lib/ai/untrusted.ts`, and (for data-minimization context)
  `supabase/migrations/20261018000000_student_browse_available_slots.sql`'s `bookings` table
  definition and `20261020030000_student_improve_request_daily_quota.sql`'s original
  `claim_ai_attempt`.
- Effective restriction: this session carries the coordinator's full Claude Code toolset, not the
  restricted Read/Grep/Glob set `.claude/agents/security-reviewer.md` describes for a genuine
  read-only subagent, so "read-only" here is behavioral/instructional except for the three
  handoff files this task explicitly directed me to write. No product code, migration, or test
  file was created, edited, or deleted. No destructive, state-changing, or push/commit/deploy
  command was run. No `.env` file was read; no secret was printed; this review never ran
  `npx supabase status` at all (directly or piped) since no live-DB probe was needed beyond the
  rolled-back pgTAP suite. The only commands executed were `git rev-parse`/`git log`/`git status`,
  `npm run lint`, `npm run typecheck`, `npx supabase test db` (pgTAP, every file wraps in
  `begin ... rollback`), `npx vitest run` (mocked unit tests), `npm run check:spec`, and
  source-tree `grep`s — all read-only, leaving zero rows behind.

## Threat model / attack surfaces considered

1. Student-content disclosure: any student id/name/`topic`/`questions`/`rejection_reason`
   reaching the report RPC's response, the AI prompt, or the rendered output.
2. Prompt injection: an admin-entered course or lecturer name containing instruction-like text
   (e.g. "ignore previous instructions and...") reaching the model unwrapped, or the untrusted
   wrapper being escapable/closable from inside the wrapped text.
3. Output-handling risk: the model's reply rendered as HTML/Markdown, used to mutate data, or
   returned unbounded in length.
4. Quota/abuse: a caller bypassing `claim_ai_attempt`'s shared daily cap via a direct call, a
   retry, or a race; the quota allowlist re-creation accidentally admitting an unintended feature
   or silently dropping `student.improve-request`'s existing admission.
5. Availability/config risk: a missing SoC LLM key or a provider failure blocking the (unrelated)
   read-only report, or leaking the key's presence/absence in a way useful to an attacker.
6. Non-admin/signed-out direct RPC or Server Action calls into either the report or the summary
   path.
7. Date-range abuse: an unbounded or malformed period causing an expensive query or a crash.
8. The regression risk of re-creating a shared function (`claim_ai_attempt`) that other features
   (`student.improve-request`, `lecturer.ai-briefing`) already depend on.

## Checks performed, with evidence

| Area                                    | Check                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Result | Evidence                                                                                                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization order                     | `admin_get_booking_report` checks `current_app_role() = 'admin'` as its first statement, before any date parsing or query.                                                                                                                                                                                                                                                                                                                                                  | passed | `20261021100000_admin_booking_reports.sql:32-34` (unchanged by the R11 re-creation, `20261021110000_...sql:21-23`)                                                                                                     |
| Authorization order (app layer)         | `getBookingReport`/`generateActivitySummary` both call `requireRole("admin")` first; `src/app/admin/reports/actions.ts` re-checks `requireRole("admin")` before delegating to either. The documented order (`requireRole` -> range validation -> `not_configured` guard -> prompt build -> `generateText`) is followed exactly in code, not only in the spec prose.                                                                                                         | passed | `src/features/admin/reports/server.ts:46,99-116`; `src/app/admin/reports/actions.ts:11,16`                                                                                                                             |
| Date/range validation                   | Both the RPC (`^[0-9]{4}-[0-9]{2}-[0-9]{2}$` regex + round-trip `to_char` re-check + calendar validity via the `date` cast's own exception handler) and the app's zod schema (`isValidIsoDate`/`isBoundedPeriod`) refuse a malformed date, `end < start`, or a span over 91 days (92 inclusive), before any query runs.                                                                                                                                                     | passed | `20261021100000_admin_booking_reports.sql:36-63`; `src/features/admin/reports/validation.ts:30,37-44`                                                                                                                  |
| Data minimization (R3)                  | `public.bookings` has columns `student_id`, `topic`, `questions`, `rejection_reason` (confirmed by reading the table DDL); `admin_get_booking_report`'s query only ever selects/joins `b.status`, `b.slot_id`, `s.course_id`, `s.lecturer_id`, `s.starts_at`, `s.ends_at`, `c.id/code/name`, and `p.id/full_name` (lecturer profile only) — none of the four sensitive columns, and no student profile join at all.                                                         | passed | `20261018000000_student_browse_available_slots.sql:96-106` (table DDL); `20261021100000_admin_booking_reports.sql:74-141` and the R11 re-creation (same minimization, only the `byStatus` grouping expression changed) |
| Data minimization (prompt)              | `src/features/admin/reports/prompt.ts` takes only the already-fetched `ReportSummaryForPrompt` (period, totals, byStatus/byCourse/byLecturer) as its input type; it has no access to any raw booking/student row, so it cannot leak a field the RPC never returned even if misused. Confirmed by reading the function signature and body, not only the docstring.                                                                                                           | passed | `src/features/admin/reports/prompt.ts:10-16,60-65`                                                                                                                                                                     |
| Prompt injection mitigation             | Every admin-entered course name and lecturer name is individually wrapped with `wrapUntrusted("admin.course-name"/"admin.lecturer-name", ...)` before being placed in the prompt; the fixed system prompt (`ACTIVITY_SUMMARY_SYSTEM_PROMPT`) ends with `UNTRUSTED_DATA_RULE` verbatim. Confirmed the actual call sites, not only that the import exists.                                                                                                                    | passed | `src/features/admin/reports/prompt.ts:6,18-26,35,42`                                                                                                                                                                   |
| Untrusted-wrapper escape resistance     | `wrapUntrusted` escapes `<`/`>` in the wrapped text before emitting the `<untrusted_data source="...">...</untrusted_data>` tags, so a course/lecturer name containing a literal `</untrusted_data>` (or any tag) cannot close the block early and smuggle attacker text back into "instruction" position.                                                                                                                                                                  | passed | `src/lib/ai/untrusted.ts:12-16`                                                                                                                                                                                        |
| Output rendering                        | `SummaryPanel` renders `{state.summary}` as plain JSX text with a `whitespace-pre-wrap` class only; no `dangerouslySetInnerHTML`, no Markdown renderer anywhere in this feature. Confirmed by reading the component and by a repo-wide grep.                                                                                                                                                                                                                                | passed | `src/app/admin/reports/summary-panel.tsx:88`; grep (see JSON block)                                                                                                                                                    |
| Output length bound                     | `truncateSummary` caps at 1,200 Unicode code points, truncating at the last space/newline boundary, never mid-word, never over the bound; applied unconditionally in `generateActivitySummary` before returning. The underlying `generateText` gateway also independently caps any feature's raw output at 6,000 chars and `max_tokens: 600` at the API-call level, so the pre-truncation text itself is already bounded.                                                   | passed | `src/features/admin/reports/presentation.ts:13-22`; `src/features/admin/reports/server.ts:126-127`; `src/lib/ai/client.ts:14-15,59,81`                                                                                 |
| AI cannot mutate data (R7)              | `generateActivitySummary` only ever calls `getBookingReport` (read-only RPC) and `generateText` (which itself only calls the model API and `claim_ai_attempt`/`resolve_ai_attempt`/`releaseAttempt`/`markAttemptIndeterminate` — all `ai_usage`-table-only operations); no booking/slot/course/profile write exists anywhere on this path. Confirmed by reading every function this module calls, transitively.                                                             | passed | `src/features/admin/reports/server.ts:96-128`; `src/lib/ai/client.ts:69-116`                                                                                                                                           |
| Quota admission / allowlist correctness | `claim_ai_attempt` is re-created with the allowlist widened to exactly `('student.improve-request', 'admin.activity-summary', 'lecturer.ai-briefing')`; the shared 100-per-SGT-day count, the advisory lock (`pg_advisory_xact_lock(hashtext('public.ai_usage.student-improve-request'))`), the per-user in-flight guard, and the refusal of any other feature name are byte-for-byte unchanged from the original `20261020030000` version except that one `in (...)` list. | passed | `20261021100000_admin_booking_reports.sql:156-201` vs. `20261020030000_student_improve_request_daily_quota.sql` (same lock key, same logic, only the feature list widened)                                             |
| Quota bypass resistance                 | No retry path exists in `generateText`/`server.ts` on a `quota_exceeded`/`in_flight` result — both are returned straight to the caller as `ai_unavailable`, with no loop or re-claim. `getLlm().chat.completions.create` is only reached after a successful `claimAttempt`; a `quota_exceeded`/`in_flight`/`unavailable` claim result returns before any provider call.                                                                                                     | passed | `src/lib/ai/client.ts:69-77` (early return on every non-`admitted` claim kind, before the provider call at line 79)                                                                                                    |
| Quota allowlist regression test         | pgTAP `admin_booking_reports.test.sql` directly exercises the "100 existing successes exhausts all three features" edge inside a rolled-back transaction (never touching the shared stack's real quota), plus the in-flight guard and the other-feature-name refusal. `student_improve_request.test.sql` (pre-existing, unmodified) still passes, confirming no regression to the student feature's own admission behavior.                                                 | passed | pgTAP run: both files pass; `admin_booking_reports.test.sql:40-117`                                                                                                                                                    |
| `not_configured` guard                  | `aiNotConfigured()` checks only `process.env.SOCLAAS_BASE_URL`/`SOCLAAS_API_KEY` presence (never logs or returns the values) and runs before any quota claim or provider call, matching owner decision (d).                                                                                                                                                                                                                                                                 | passed | `src/features/admin/reports/server.ts:40-42,103`                                                                                                                                                                       |
| Failure-family normalization            | Every handled `generateText` failure and the `not_configured` guard are mapped to the same `ai_unavailable` discriminated-union shape in both the server action and the UI's `describeAiFailure`, so no internal reason leaks beyond a small closed enum; the report itself is unaffected by any AI-path failure (`reportFailure`/the action only touches the summary panel's own state).                                                                                   | passed | `src/features/admin/reports/validation.ts:107-122`; `src/app/admin/reports/summary-panel.tsx:19-38`                                                                                                                    |
| No new tables / no persistence (R9)     | No table/column is created or altered by either migration beyond the one new RPC and the `claim_ai_attempt` re-creation; the summary is never written anywhere (`generateActivitySummary` returns it to the caller only).                                                                                                                                                                                                                                                   | passed | both migration files (no `create table`/`alter table`)                                                                                                                                                                 |
| R11 derived-completion correctness      | The second migration's `byStatus` subquery marks a row `'completed'` when `b.status = 'approved' and now() >= s.ends_at`, else the stored status — matching LEC-03-R4's display rule exactly, without writing any `bookings` row; the function stays `stable` (uses `now()`, not `clock_timestamp()`, consistent with other `stable` functions in this codebase).                                                                                                           | passed | `20261021110000_admin_booking_reports_derived_completion.sql:76-88`                                                                                                                                                    |
| Grants                                  | `execute` revoked from `public`/`anon`/`authenticated`, granted to `authenticated` only, for `admin_get_booking_report` in both migrations (the re-creation repeats the same revoke/grant, so no window exists where the function is briefly more permissive).                                                                                                                                                                                                              | passed | `20261021100000_...sql:145-146`; `20261021110000_...sql:140-141`                                                                                                                                                       |
| Non-admin/signed-out direct calls       | pgTAP confirms a non-admin `authenticated` caller gets `forbidden_or_not_found` from `admin_get_booking_report` directly, `anon` is refused before execution (`42501`) for both `admin_get_booking_report` and `claim_ai_attempt`.                                                                                                                                                                                                                                          | passed | `admin_booking_reports.test.sql:119-150`                                                                                                                                                                               |
| No raw error leakage                    | Every path returns a typed `kind`; handled `generateText`/RPC failures map to a closed enum, never a raw SQLSTATE/provider error message.                                                                                                                                                                                                                                                                                                                                   | passed | as above                                                                                                                                                                                                               |
| Static analysis                         | `npm run lint`, `npm run typecheck`                                                                                                                                                                                                                                                                                                                                                                                                                                         | passed | see JSON block                                                                                                                                                                                                         |
| Database rules                          | `npx supabase test db` (full suite, rolled back)                                                                                                                                                                                                                                                                                                                                                                                                                            | passed | Files=13 Tests=226, PASS                                                                                                                                                                                               |
| Unit tests                              | `npx vitest run --exclude 'workflow/**'`                                                                                                                                                                                                                                                                                                                                                                                                                                    | passed | Test Files 36 passed; Tests 268 passed                                                                                                                                                                                 |
| Spec traceability                       | `npm run check:spec`                                                                                                                                                                                                                                                                                                                                                                                                                                                        | passed | no ADM-04 warnings/errors in output                                                                                                                                                                                    |

## Findings

1. **Medium (residual, not introduced by this review)** — the ADM-04 developer's own handoff
   (`workflow/handoffs/adm-04/2026-10-21-adm-04-developer.md`, "Findings and open questions" #1,
   status "Open") self-reports running `npx supabase status -o json` directly once, which printed
   the local disposable stack's `ANON_KEY`/`SECRET_KEY`/`SERVICE_ROLE_KEY`/`JWT_SECRET` into that
   session's own tool output — a violation of the environment rule even though every other
   key/env load in that session used the mandated non-printing pipe. This review did not
   reproduce, re-trigger, or further investigate that exposure (no command in this review touches
   Supabase status or keys at all), and these are local-only disposable dev-stack credentials, not
   production secrets. The coordinator's decision on whether to rotate the local stack's keys is
   still recorded as open in that handoff; I am re-surfacing it here because it is a live,
   unresolved item in this same feature's history that a human reviewer should close out
   explicitly rather than let drop between handoffs.
2. **Info** — `src/features/admin/reports/validation.ts:110-122`'s `aiUnavailableReasonSchema` is
   "re-declared rather than imported" from `src/lib/ai/client.ts`'s `AiFailure` union (by the
   developer's own documented design choice, to keep this feature module importable without
   pulling in the `server-only` directive). This creates a maintenance coupling: if
   `src/lib/ai/client.ts` ever adds a new `AiFailure` member, this feature's schema would silently
   fail closed (a result with the new reason would fail `generateActivitySummaryResultSchema`
   parsing and surface as `temporarily_unavailable` rather than the specific reason) rather than
   fail open — the safe direction for a security boundary, so this is not a vulnerability, only a
   future-maintenance note worth a code comment or a shared-type extraction.
3. **Info** — `admin_get_booking_report`'s `byLecturer`/`byCourse` arrays include every course/
   lecturer with at least one booking in the period (owner decision b, "no zero-fill"); an admin
   with a narrow custom date range could infer that a specific lecturer had very few bookings by
   the small count, but this is explicitly in-scope, counts-only disclosure to an admin who
   already has full account/course visibility via `ADM-01`/`ADM-02`, matching the spec's own
   "Specific ... refusal reasons ... caller is always an admin" precedent. Not a finding requiring
   action; recorded only because it was a threat-model item considered and ruled out.

No Critical or High finding was identified in the ADM-04 code reviewed. Data minimization,
prompt-injection mitigation, quota enforcement, and output handling are each enforced at the
database and/or `src/lib/ai/client.ts` gateway layer (not solely at this feature's own layer), so
a defect confined to this feature's code would not by itself create exposure for the four
excluded `bookings` columns or bypass the shared quota.

## Approval-gate assessment

Enforced outside model/agent output: `security definer`/`set search_path = ''` and the
`current_app_role() = 'admin'` first-statement check on `admin_get_booking_report`; the
`claim_ai_attempt` advisory lock and `ai_usage` row-count query as the real quota authority (not
app-level bookkeeping); `wrapUntrusted`'s tag-escaping as the real prompt-injection boundary (not
only the system-prompt instruction, which a sufficiently adversarial model could in principle
ignore — the escaping prevents the wrapper itself from being broken out of, which is the part under
this codebase's control); and React's default JSX-text escaping for output rendering. This spec's
own Security requirements section explicitly calls for independent human review before merge
(first Administrator AI feature, new RPC); that has not yet happened and this report does not
substitute for it. The shared-stack key-exposure item (Finding 1) is an environment/process gate,
not an application-security control, and sits outside this spec's own approval-gate table — it
needs a human operational decision (rotate or accept), not a code change.

## Limitations and unresolved questions

- Static plus read-only automated checks only (lint, typecheck, pgTAP, unit tests, check:spec);
  the live-DB integration suite (`test:admin-reports:integration`, which exercises two real
  `generateText` calls against a mocked `openai` client but a real `claim_ai_attempt`) and the e2e
  suite (`admin-reports.spec.ts`) were read but not re-executed, per the assignment's instruction
  to avoid the shared integration/e2e suites that `tester_verifier` is running concurrently in
  this worktree.
- `ADM-04-AC8`'s live-model half (a real `SOCLAAS_*` call with an instruction-like course name) is
  not-run in this environment, same as the developer's own session — no SoC LLM key is
  configured here. The mocked-reply half is independently covered by a real unit test
  (`src/features/admin/reports/server.test.ts`), which this review confirmed exists and passes.
- I cannot grant human/PR approval, and I cannot determine from this checkout whether the local
  stack's keys (Finding 1) were ever rotated or whether that question was otherwise resolved
  outside this repository.

## Next action

Coordinator: (1) route this feature (first Administrator AI feature, new RPC — flagged
security-sensitive by the spec itself) to an independent human reviewer before merge; (2)
explicitly close out Finding 1 (local dev-stack key exposure from the developer's own session) —
either confirm rotation happened or make an documented, deliberate decision to accept the risk for
this disposable local stack, rather than leaving it open across handoffs. No code changes are
required from this review; Findings 2 and 3 are informational and non-blocking.

Handoff evidence: workflow/handoffs/adm-04/2026-10-21-adm-04-security-reviewer.md
