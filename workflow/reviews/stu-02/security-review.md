# STU-02 independent security review — round 1

Coordinator record: collaboration agent creation hit the thread limit. An independent native Codex
session was run with a read-only sandbox and the existing security_reviewer instructions instead.
This reviewer did not generate the implementation. Original report follows; later tester findings
and final-version reconciliation will be recorded separately below.

## Status

incomplete

No confirmed security defect was found in implementation commit `afe888c544ae00cc8fe147e9cc9476424a50bf49`. Completion remains blocked on live database, concurrency, browser/CSRF, and fault-injection verification, which would mutate disposable fixtures or require running services.

## Scope and effective restrictions

- Baseline: `56209dd58dfefb2f7d31c93488cf980490f95e79`
- Approved spec: [STU-02-request-consultation.md](/Users/josephkwok/Desktop/Website/cs3227/MP3/CS3227-2610-MP3/workflow/specs/student/STU-02-request-consultation.md), verified `git hash-object` digest `fa2e3f2e68810ad6ab5e1603a753b21bd8c4c384`
- Requirements: STU-02-R1–R10; AC1–AC19
- Reviewed implementation diff: 10 committed files, 729 inserted lines; scope matches the developer handoff.
- Shared SH-01/02/03/05 and integration-spec digests match the approval handoff. No spec or shared-dependency changes occurred between baseline and implementation.
- Reviewed application boundaries, migration/RPCs, preceding RLS/grants, session authorization, Next.js Server Action CSRF behavior, preflight, handoffs, independent tester files, CODEOWNERS, and CI/deployment gates.
- Technical restriction: parent filesystem was read-only; network was restricted.
- Instruction restrictions: no delegation, external connectors, `.env`/secret access, repository edits, database mutations, commits, merge, or deployment. All were observed.

## Findings

No confirmed findings.

Static and unit evidence supports:

- Page, layout, Server Action, and data-layer `requireRole("student")` enforcement.
- Independent database authorization from `auth.uid()` and active role.
- Revoked direct table access and narrowly granted RPC execution.
- Owner-scoped recovery and no cross-student receipt disclosure.
- Strict application response allowlists and minimal database projections.
- ECMAScript trimming, Unicode code-point limits, malformed-surrogate/NUL rejection, unknown/duplicate-field refusal, UUID checks, and 16 KiB decoded-input bounds.
- Per-student and per-slot locking, overlap checks, fresh post-lock database time, stale-version refusal, retained idempotency records, and rollback-safe handled failures.
- Framework Origin/Host CSRF protection with no extra allowed origins.
- No AI calls, prompts, `ai_usage` access, admin client, unsafe HTML rendering, or private/raw error logging.

Potential gap, not promoted to a defect: [migration lines 40–79](/Users/josephkwok/Desktop/Website/cs3227/MP3/CS3227-2610-MP3/supabase/migrations/20261018020000_student_request_consultation.sql:40) apply `SET statement_timeout = '10s'` as function configuration. PostgreSQL may start the top-level statement timer before entering the function, so this setting may not arm that invocation. Application aborts at [request-server.ts:42](/Users/josephkwok/Desktop/Website/cs3227/MP3/CS3227-2610-MP3/src/features/student/bookings/request-server.ts:42), but client cancellation is not itself proof of database termination or rollback. The write path truthfully reports post-dispatch uncertainty. A controlled live PostgreSQL timing test is still needed for STU-02-R7/AC16.

## Checks

| Area                    | Check                                                               |     Result | Evidence                                                                                                |
| ----------------------- | ------------------------------------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| Commit                  | Baseline ancestry and exact implementation HEAD                     |     passed | Baseline is an ancestor; HEAD is exactly `afe888c…`                                                     |
| Scope                   | `git diff --name-status/stat baseline..implementation`              |     passed | Only the 10 handoff-listed implementation files changed                                                 |
| Spec                    | Approved digest                                                     |     passed | `git hash-object` returned exactly `fa2e3f…`                                                            |
| Dependencies            | Shared/integration digests and implementation diff                  |     passed | Digests match latest approval handoff; no dependency-spec diff                                          |
| Static diff             | `git diff --check baseline implementation`                          |     passed | No output                                                                                               |
| Unit/security boundary  | Vitest validation plus independent server-boundary tests            |     passed | 2 files, 11 tests passed using non-writing config loader                                                |
| Initial unit attempt    | Default Vitest config loader                                        |    blocked | Read-only sandbox denied Vite temporary config creation; non-writing retry passed                       |
| Traceability            | `npm run check:spec`                                                |     passed | 17 specs, 169 criteria, 72 covered; unrelated draft warnings remain                                     |
| Sensitive change        | `npm run check:sensitive -- --base=56209dd…`                        |     passed | Correctly requires security review for the migration                                                    |
| Auth/RLS/grants         | Static inspection                                                   |     passed | Active role derived in RPC; base tables and key table ungranted; RPCs narrowly granted                  |
| Privacy/allowlists      | Static schemas and SQL projection inspection                        |     passed | Exact slot/receipt allowlists; no booking text, competing owner, audit/contact, or raw error disclosure |
| AI/rendering/logging    | Static search and render inspection                                 |     passed | No AI/admin client/unsafe HTML/private logging in committed feature                                     |
| Real DB/pgTAP           | Direct RPC, grants, deactivation, code-point boundaries             | unexecuted | Tests write transactional fixtures; prohibited by this review’s read-only scope                         |
| Concurrency             | Same-slot, same-student overlap, idempotency, lifecycle locks       | unexecuted | Requires live independent PostgreSQL connections and fixture writes                                     |
| Browser/CSRF            | Authenticated cross-origin action, response loss, literal rendering | unexecuted | Requires running app/auth/database and fixture creation                                                 |
| Timeout/fault injection | Effective statement timer and uncertain outcomes                    | unexecuted | Requires controlled live database/transport instrumentation                                             |

The untracked tester files were inspected for setup and assertion validity. Their fixture identity checks, synchronized concurrency barriers, ownership assertions, and cross-origin request construction appear appropriate, but their tests were not treated as passing merely from inspection.

## Approval-gate assessment

- Specification gate: latest handoff records whole-team approval of the exact digest. This is repository evidence, not independently authenticated external approval.
- Sensitive-change gate: the migration triggers the local classifier and is owned by shared Supabase CODEOWNERS. Independent human/CODEOWNER review is still required.
- Merge gate: CI defines `Verify`, `Database rules`, and `End-to-end` jobs. Actual remote branch protection, stale-approval dismissal, and bypass restrictions were not verified because connector/network access was prohibited.
- Production gate: workflow targets the GitHub `production` environment and uses environment secrets, but actual reviewer configuration was not externally verified.
- No merge, deployment, migration push, or production action occurred.

## Limitations and unresolved questions

- Live database, concurrency, E2E, CSRF, response-loss, and fault-injection scenarios remain unexecuted.
- The effective top-level PostgreSQL ten-second timeout remains unresolved.
- Remote branch/environment enforcement was not verified.
- Worktree tester files are independent evidence, not part of implementation commit `afe888c…`.

## Next action

The coordinator should run the reviewed independent pgTAP, separate-connection concurrency, and Playwright suites against a disposable snapshot of `afe888c…`, adding a controlled PostgreSQL timeout probe before deciding whether STU-02-R7 requires remediation.

Outcome: incomplete  
Task ID: STU-02-P4-SECURITY  
Requirement IDs: STU-02-R1–R10, STU-02-AC1–AC19  
Changed files: None — read-only security review.  
Checks run and actual results: Commit/digest/scope checks passed; static security review passed; 11 focused unit tests passed; traceability passed with draft warnings; sensitive classifier required review.  
Checks not run and reasons: Live DB, concurrency, E2E/CSRF, and fault injection require stateful disposable infrastructure outside this read-only assignment.  
Unresolved issues: Effective database `statement_timeout`; live security scenarios; remote approval enforcement.  
Next action: Execute the stateful independent verification suite and timeout probe on a disposable environment, then obtain human/CODEOWNER review of the migration.

# Application fix recheck (independent read-only reviewer)

The following report was produced before the tester finalized its reconciled report. Its stale
tester-handoff limitation is historical: the tester now records final commit2396f26 and10017ms API
timeout evidence. A final bounded CI/evidence reconciliation follows separately; the coordinator
does not attribute its own stateful test results to the security reviewer.

## Status

**Passed — bounded final security recheck.** No new security findings in candidate `2396f26dfc2004ae64bb28a0893637319dde03d8`.

Approved specification digest: `fa2e3f2e68810ad6ab5e1603a753b21bd8c4c384`  
Prior reviewed implementation: `afe888c544ae00cc8fe147e9cc9476424a50bf49`

## Findings and fix disposition

No findings after reviewing the exact `afe888c…2396f26` diff.

| Prior defect                                     | Disposition                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-TV02-01: consultation text serialized into URL | Addressed                                   | The form now uses explicit POST and server-rendered controls remain disabled until hydration in [request-form.tsx](/Users/josephkwok/Desktop/Website/cs3227/MP3/CS3227-2610-MP3/src/app/student/slots/[slotId]/request/request-form.tsx:124). This prevents pre-hydration/native GET serialization and introduces no new mutation route.                                                                                                                                                                                  |
| F-TV02-02: timestamps emitted as `+00:00`        | Addressed                                   | The append-only migration emits UTC `Z` timestamps in [20261018021000_student_request_consultation_fixes.sql](/Users/josephkwok/Desktop/Website/cs3227/MP3/CS3227-2610-MP3/supabase/migrations/20261018021000_student_request_consultation_fixes.sql:1), retaining role authorization, narrow projection, safe `search_path`, and timeouts. [request-validation.ts](/Users/josephkwok/Desktop/Website/cs3227/MP3/CS3227-2610-MP3/src/features/student/bookings/request-validation.ts:62) now rejects offset alternatives. |
| Effective total timeout                          | Executable evidence inspected; not run here | The current integration test authenticates through the real API, confirms three independent lock holders, exercises 4s/8s/12s releases, requires ≤11s, asserts zero partial writes, and retries the same key in [student-request-concurrency.test.ts](/Users/josephkwok/Desktop/Website/cs3227/MP3/CS3227-2610-MP3/tests/integration/student-request-concurrency.test.ts:393). The coordinator reported a passing focused run.                                                                                            |

## Checks

| Area                    | Check                                                                                            |              Result | Evidence                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------: | ---------------------------------------------------------------------------------------------------------------- |
| Version                 | HEAD, ancestry, spec digest                                                                      |              passed | HEAD is `2396f26…`; `afe888c…` is its parent; current spec hashes to `fa2e3f…`                                   |
| Diff                    | Exact five-file diff and regression review                                                       |              passed | Privacy and UTC changes are bounded; no auth, grant, projection, logging, AI, or error-contract regression found |
| Formatting              | `git diff --check afe888c…2396f26`                                                               |              passed | No output                                                                                                        |
| Focused unit/security   | `npx vitest run --configLoader runner …request-validation.test.ts …request-verification.test.ts` |              passed | 2 files, 14/14 tests                                                                                             |
| Sensitive gate          | `npm run check:sensitive -- --base=afe888c…`                                                     |              passed | Correctly classified the new migration as requiring sensitive-change review                                      |
| Stateful DB/API/browser | Source and assertions inspected                                                                  |     unexecuted here | Read-only assignment prohibited stateful execution                                                               |
| Tester report           | Current handoff inspected                                                                        | incomplete evidence | It remains the pre-fix `afe888c…` report and does not yet contain the promised final elapsed metric              |

## Scope and restrictions

The technical filesystem sandbox was read-only and network access restricted. No files, database state, secrets, `.env` files, external connectors, plugins, or agents were accessed or changed. The prohibition on database mutations and delegation was additionally instruction-enforced.

## Approval-gate assessment

The spec digest was verified locally. The migration is correctly classified as sensitive and still requires independent human/CODEOWNER review. Remote GitHub branch protection, approvals, bypass restrictions, CI status, and production-environment reviewers were not externally verified.

## Limitations

The stateful timeout, database, and browser suites were not run in this session. The current tester handoff is stale, so the coordinator-reported passing timeout run cannot yet be tied to its exact elapsed metric in repository evidence. Manual keyboard/200% zoom review also remains external.

## Next action

Have the tester finalize `workflow/handoffs/stu-02/tester.md` with candidate `2396f26…`, the focused rerun results, and the observed timeout metric; then obtain human/CODEOWNER review of the migration.

Outcome: complete  
Task ID: STU-02-P4-SECURITY-FINAL  
Requirement IDs: STU-02-R6–R9, STU-02-AC15, STU-02-AC16, STU-02-AC19  
Changed files: None — read-only security recheck.  
Checks run and actual results: Commit/digest/ancestry and diff checks passed; focused Vitest passed 14/14; sensitive classifier required review.  
Checks not run and reasons: Stateful DB/API/Playwright suites were prohibited by the read-only assignment.  
Unresolved issues: Tester handoff still needs the final candidate results and exact timeout metric; remote approval enforcement and manual accessibility remain unverified.  
Next action: Finalize the tester handoff, then obtain independent human/CODEOWNER migration review.

---
