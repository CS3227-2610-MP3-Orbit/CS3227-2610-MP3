# STU-02 independent functional verification

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "STU-02-TESTER-FINAL",
"requirementIds": ["STU-02-R1", "STU-02-R2", "STU-02-R3", "STU-02-R4", "STU-02-R5", "STU-02-R6", "STU-02-R7", "STU-02-R8", "STU-02-R9", "STU-02-R10"],
"status": "passed",
"changedFiles": ["src/features/student/bookings/request-verification.test.ts", "supabase/tests/student_request_consultation.test.sql", "tests/integration/student-request-concurrency.test.ts", "tests/integration/stu02-test-helpers.mjs", "tests/integration/stu02.vitest.config.mts", "tests/integration/README.md", "tests/e2e/student-request-consultation.spec.ts", "tests/e2e/stu02.playwright.config.ts", "workflow/handoffs/stu-02/tester.md"],
"verification": [
{"check": "Initial tests-before-code integration", "result": "failed", "evidence": "6 expected missing get_request_slot failures; validated authenticated active-Student fixtures first."},
{"check": "Independent request server unit tests", "result": "passed", "evidence": "7/7 after correcting fluent Supabase mock setup."},
{"check": "Rollback pgTAP request suite", "result": "passed", "evidence": "15/15 assertions, transaction rolled back."},
{"check": "Real database integration", "result": "passed", "evidence": "17/17 before adding UTC contract regression; actual independent connections and verified lock waits."},
{"check": "UTC-Z contract regression", "result": "failed", "evidence": "Actual startsAt 2098-01-01T01:00:00+00:00 fails shared ending-Z contract; targeted run leaves 17 other tests unexecuted in that run."},
{"check": "Authenticated localhost Chromium E2E", "result": "failed", "evidence": "2 passed, 1 failed: native form fallback puts consultation text in URL. Main stale/recovery/cross-origin journey passed."},
{"check": "npx tsc --noEmit", "result": "passed", "evidence": "Passed during test preparation; later additions need final rerun."},
{"check": "Manual keyboard/200-percent zoom review", "result": "not-run", "evidence": "320px automation, keyboard Tab, labelled controls and duplicate suppression exercised; not equivalent to manual accessibility review."},
{"check": "Final candidate 2396f26 independent unit suite", "result": "passed", "evidence": "9/9 passed including duplicate FormData and extra output-field rejection."},
{"check": "Final candidate 2396f26 real database integration suite", "result": "passed", "evidence": "29/29 passed including UTC fix, explicit role/terminal/overlap variants and real API total timeout."},
{"check": "Final candidate 2396f26 expanded rollback pgTAP", "result": "passed", "evidence": "20/20 passed, rollback completed; NUL and invalid UTF8 refusal verified."},
{"check": "Final candidate 2396f26 browser suite", "result": "passed", "evidence": "3/3 passed, including native fallback fix, keyboard Tab, pending duplicate suppression, actual cross-origin action rejection and lost-commit response recovery."},
{"check": "Actual authenticated API statement budget", "result": "passed", "evidence": "Verified three lock holders; observed 10017ms, HTTP200 temporarily_unavailable, zero bookings, same-key retry success after locks settle."},
{"check": "Final npx tsc --noEmit", "result": "passed", "evidence": "Exit0 after final test additions and configurable isolated targets."}
],
"unresolvedIssues": ["Manual true 200-percent browser zoom and visual focus/readability review unexecuted", "Hosted GitHub execution of the newly wired disposable runner not performed by this verifier"]
}
<!-- HANDOFF:END -->

## Scope and versions

- Approved spec: `workflow/specs/student/STU-02-request-consultation.md`, digest
  `fa2e3f2e68810ad6ab5e1603a753b21bd8c4c384`; whole-team approval reported by Joseph.
- Final reviewed implementation commit: `2396f26dfc2004ae64bb28a0893637319dde03d8`.
- Historical round-1 implementation: `afe888c544ae00cc8fe147e9cc9476424a50bf49`.
- Role: independent `tester_verifier`; generator owns application/migration fixes. No delegation.
- Allowed modifications: the nine test/support/handoff paths in the structured block; coordinator added README permission.
- Isolated target: `supabase_db_stu02-disposable-u65dd8`, API port 55321; no persistent project DB touched.
- Browser: coordinator-synchronized separate runtime copy, port 3102, corrected origin `localhost`.
- Tests are verifier-authored worktree files, not part of the reviewed implementation commit.

## Final reconciliation and feature-scoped matrix

Both confirmed round-1 defects are **fixed and independently rechecked** on `2396f26`.
Native fallback now uses POST and hydration gating; browser regression confirms no private URL fields.
New append-only migration emits canonical UTC-Z values and validation rejects noncanonical values.
The final automated suites pass. This does not replace the explicitly unexecuted human/manual checks.

| Criterion | Final evidence                                                                                                                                                            | Result                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| AC1       | Second-page browse navigation, fixed selected details, GET/refresh zero writes                                                                                            | passed                       |
| AC2       | Actual authenticated owned pending creation; reserved slot omitted from browse                                                                                            | passed                       |
| AC3       | Past/start-now/invalid-range/inactive endpoints/wrong role/missing assignment/completed history refusal                                                                   | passed                       |
| AC4       | Missing/duplicate/unknown/array fields and Unicode bounds; RPC BOM/NBSP, NUL and invalid UTF8 refusal                                                                     | passed                       |
| AC5       | Real simultaneous two-Student same-slot race, one winner                                                                                                                  | passed                       |
| AC6       | Same-Student concurrent overlaps, existing approved overlap, adjacent and disjoint sessions                                                                               | passed                       |
| AC7       | Cancelled/rejected histories preserved byte-for-byte with new intent; completed reuse refused                                                                             | passed                       |
| AC8       | All three RPCs and real captured submit/recover/refresh browser actions refuse Admin/Lecturer/inactive/signed-out; direct pages redirect without protected controls       | passed                       |
| AC9       | Forged identity/status/course application fields, owner derivation, cross-owner recovery and direct table denial                                                          | passed                       |
| AC10      | Same-key concurrency and lost committed browser response recover one identity; changed payload refused                                                                    | passed                       |
| AC11      | Cancelled/rejected/completed current receipt replay and eligible fresh-key rebooking                                                                                      | passed                       |
| AC12      | Stale material details refused; browser explicit refresh/review required                                                                                                  | passed                       |
| AC13      | Verified locks for course/assignment/Lecturer races and fresh time after wait; slot edit guard inspected; not every possible race ordering enumerated                     | passed for bounded scenarios |
| AC14      | Real verified-lock pre-write timeout shows temporary outage, preserves intent and zero rows; retry then stale refresh works; lost committed response recovers one booking | passed                       |
| AC15      | Literal script/SQL/model text, no execution, safe error/log checks, repaired native URL fallback                                                                          | passed                       |
| AC16      | Input bound, cross-origin actual action denial, GET nonmutation, 5s lock and observed 10.017s API statement budgets                                                       | passed                       |
| AC17      | Keyboard Tab/focus assertion, labelled controls, 320px, pending duplicate suppression and textual states pass; true 200% zoom/manual visual review unexecuted             | partial                      |
| AC18      | AI spy/source inspection plus real successful/failed mutation ai_usage count unchanged                                                                                    | passed for bounded scenarios |
| AC19      | Exact lookup allowlist/UTC-Z, receipt extra-field rejection, missing/owned lookup and redirect checks                                                                     | passed                       |

Final shared coverage: SH-05-AC3/6/7/9 pass for request creation, both rejected/cancelled history
variants now exercised; SH-05-AC10 completed reuse passes (early completion is out of this slice).
SH-05-AC12 tested role/stale/invalid requests preserve state; SH-05-AC13 now includes actual unchanged
AI-usage count. SH-03-R11/AC18 UTC contract defect is closed. SH-01/SH-03-AC19 data boundary checks pass.
Full-project criterion-label coverage remains coordinator-owned and is not this semantic result.

Final reruns: unit **9/9**, real DB **29/29**, pgTAP **20/20**, Chromium **3/3**, typecheck exit0.
After adding explicit target overrides, browser reran **3/3** and the focused real-API timeout check
passed with **10017ms / HTTP200 / temporarily_unavailable**, zero partial booking and successful replay.
That focused run filtered 28 other integration cases; it does not imply they reran in that command.
Target setup/reproduction is documented in `tests/integration/README.md`; the tester changed no CI/package settings.

### Bounded final browser-gap closure and runner inspection

The tester changed no application code; application version remains `2396f26`. Added verification:
all three genuine Server Action IDs captured from the successful browser workflow are replayed as
Lecturer/Admin/inactive/signed-out. Each redirects before protected work; direct request-page visits
also redirect, no topic controls render, and existing booking count stays one. The first extended run
wrongly expected only `x-action-redirect`; signed-out middleware correctly uses HTTP307 `Location`.
After validating actual transport semantics, the assertion accepts either redirect header and the
focused full journey passed. This was a test assertion defect, not an application defect.

A verified 6.5-second slot lock forces the application's 5-second database lock timeout before writing.
The real browser shows temporary-unavailable feedback, preserves draft/intent, and zero bookings;
same-intent retry progresses safely. This closes the earlier AC14 UI gap. Focused expanded journey
passed in 16.3s; prior complete suite was 3/3. The developer is independently running the full default
suite with these final tests; this verifier does not relabel that future result as its own execution.

Coordinator identified the default Playwright discovery mismatch: feature fixtures targeted isolated
55321 while default app used54321. Developer separately changed only CI/runner configuration.
Tester independently read `.github/workflows/ci.yml`, `playwright.config.ts` and
`workflow/scripts/stu02-ci.mjs`: default discovery retains all tests, demands explicit disposable
targets plus matching app/API URL; CI creates unique ephemeral stack, runs real races then all E2E.
Local secrets remain unprinted; no production access or test exclusion added. README now states
default discovery accurately. Hosted CI execution is unexecuted here, and CI changes require review.

Independent runner checks: `node --check workflow/scripts/stu02-ci.mjs` passed; executing the script
outside CI exited1 with its expected ephemeral-CI requirement before setup. Default Playwright
`--list` with the four overrides unset exited1 with its expected explicit-target requirement.
These are successful refusal checks, not passing end-to-end executions. Final typecheck, handoff
validation and whitespace checks passed after the bounded additions.

## Historical round-1 matrix — superseded by final reconciliation above

Passed checks below do not imply every clause of a compound criterion was exercised. Partial entries
name the passing evidence and unexecuted remainder explicitly.

| Criterion | Check and actual result                                                                                                                                                           | Coverage status |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| AC1       | Authenticated second browse page link loads exact slot; refresh count remains zero                                                                                                | passed          |
| AC2       | Real browser creates one owned pending booking, text preserved, reserved slot absent from browse                                                                                  | passed          |
| AC3       | Past/course inactive/Lecturer inactive/wrong role/missing assignment/completed history all refused; invalid range constrained by existing schema, not separately exercised        | partial         |
| AC4       | Application invalid strings/fields/Unicode and DB Unicode max/over-limit/blank cases passed; not every permutation at both layers                                                 | partial         |
| AC5       | Timestamp-synchronized independent PostgreSQL connections: exactly one winner and generic loser, count one                                                                        | passed          |
| AC6       | Concurrent same-Student overlaps refused, adjacent intervals both accepted; existing approved/disjoint variants not separately exercised                                          | partial         |
| AC7       | Cancelled history row byte-for-byte unchanged after new booking; completed history refuses; rejected-history variant unexecuted                                                   | partial         |
| AC8       | Signed-out browser, Lecturer RPC, inactive recovery, role-redirect unit checks passed; full Admin/inactive browser/action actor matrix unexecuted                                 | partial         |
| AC9       | Forged owner/status/course application fields, cross-Student key lookup, authenticated table read/write denial passed; every resource/field variant unexecuted                    | partial         |
| AC10      | Real concurrent same-key requests, different-payload refusal, other-Student recovery denial, browser lost committed response recovery all passed                                  | passed          |
| AC11      | Cancelled receipt replay returns same identity/current status; fresh key preserves history; rejected/completed replay variants unexecuted                                         | partial         |
| AC12      | SQL stale-version refusal and browser refresh plus explicit review before submission passed                                                                                       | passed          |
| AC13      | Verified held locks for course/assignment/Lecturer changes and wait crossing slot start all refuse safely; every ordering/slot-time update race not exercised                     | partial         |
| AC14      | Pre-client failure temporary; invalid result/transport unknown; real response discarded after commit and retry recovers one booking passed; every infrastructure error unexecuted | partial         |
| AC15      | Inert malicious text and safe unit error/log handling passed; native form leaks private text into URL                                                                             | failed          |
| AC16      | Oversize boundary, 5-second lock timeout/rollback/retry, GET no creation, actual cross-origin authenticated action rejected passed; native fallback disclosure fails              | failed          |
| AC17      | 320px form, label-linked controls, textual conflict/uncertainty/success exercised; manual keyboard, focus, 200-percent zoom and pending double-click checks unexecuted            | partial         |
| AC18      | No model-call spy on success/error and independent source inspection passed; exhaustive handled-failure/AI-usage before-after matrix unexecuted                                   | partial         |
| AC19      | Owned narrow receipt, missing refusal and redirects passed; shared canonical UTC-Z lookup timestamp contract fails                                                                | failed          |

## Historical round-1 shared dependencies — separate from full-project coverage

| Shared requirement                                     | Evidence in this bounded verification                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| SH-01 authorization / SH-03-AC19 direct table boundary | Trusted role checks, own receipt, direct authenticated booking read/write denial; partial actor matrix |
| SH-03-R11 / AC18 projection                            | Actual narrow lookup fields inspected; canonical ending-Z defect confirmed                             |
| SH-05-AC3 trusted owner                                | Forged application identity rejected, database owner asserted from authenticated browser               |
| SH-05-AC6 same-slot race                               | Passed real simultaneous two-Student connections                                                       |
| SH-05-AC7 Student overlap race                         | Passed real simultaneous same-Student requests                                                         |
| SH-05-AC9 history preservation                         | Cancelled variant passed; rejected variant unexecuted                                                  |
| SH-05-AC10 completed reuse                             | Completed-slot creation refused; early-completion operation outside this slice                         |
| SH-05-AC12 invalid/stale actor mutations               | No new rows on tested eligibility/stale/role failures; incomplete exhaustive matrix                    |
| SH-05-AC13 no AI                                       | Unit spy plus source inspection; exhaustive DB before/after not performed                              |

The coordinator reports full-project traceability separately. Acceptance-ID discovery is not semantic
coverage; this report does not claim all 19 criteria fully verified or unrelated shared mutations implemented.

## Historical confirmed implementation defects, round 1 — both closed in final candidate

### F-TV02-01 — High — private consultation text enters URL/history

- Requirement: STU-02-R6/R9, AC15/16: no private text in URLs; input is untrusted.
- Reproduce: authenticate a fictional Student; load eligible request form; fill topic/questions;
  exercise native HTML fallback using `HTMLFormElement.prototype.submit.call(form)`.
- Expected: fallback never serializes consultation text into URL, irrespective of React handler readiness.
- Actual: `/student/slots/<id>/request?topic=PRIVATE-TOPIC-MARKER&questions=PRIVATE-QUESTION-MARKER`.
- Cause: rendered form has named fields but no explicit method, so native fallback defaults to GET.
- Evidence: browser regression `native form fallback never puts private text in the URL` failed with
  exact fictional markers; initial non-hydrated-origin journey also navigated natively and lost draft.
- A separate JavaScript-disabled attempt stayed on Next's streamed loading shell and is not evidence
  of successful disabled-JS access. Native fallback test intentionally isolates browser form semantics.

### F-TV02-02 — Medium — lookup violates inherited UTC wire format

- Requirement: STU-02-R8/AC19 inherits SH-03-R11 eight-field `AvailableSlot` projection plus version.
- Reproduce: eligible lookup with authenticated Student; inspect startsAt/endsAt.
- Expected: ISO-8601 UTC values ending `Z`.
- Actual: `2098-01-01T01:00:00+00:00`; direct SQL JSON construction retains session timestamp format.
- Evidence: integration `lookup inherits canonical UTC-Z timestamp projection from SH-03-R11` fails;
  fixture first checks trusted identity and eligible lookup success. No requirement rewrite proposed.

## Test defects and coordination findings

1. Initial unit mock returned Promise directly; production uses Supabase fluent `.abortSignal()`.
   Three false failures corrected by modelling the builder plus transport. Recheck 7/7 passed.
2. Browser fixture initially seeded 50 earlier slots but advanced one page. Actual page size is 20.
   Corrected to 20, maintaining genuine second-page coverage; not an application bug.
3. `127.0.0.1:3102` runtime did not hydrate, repeated HMR handshake failures. After at most two retries,
   marked blocked; coordinator identified `localhost:3102` hydrates. Changed environment, then reran.
4. Native fetch Response uses boolean `.ok`; a new fixture wrongly called `.ok()`. Corrected before
   attributing any implementation finding.
5. JavaScript-disabled request shell remained streamed loading. Replaced the attempted disclosure
   reproduction with direct native form semantics; do not claim disabled-JS feature support verified.
6. Hydrated client navigation required waiting for request URL and scoping course text to selected-slot
   region; old-page dropdown options otherwise produced a strict-selector false failure.
7. DB integration leaves fictional rows in the disposable DB; coordinator reported existing browse
   pgTAP global-count assertion polluted (22 vs 5), then passed 39/39 in separate pristine schema DB.
   That coordinator report is not this verifier's independent execution; no original assertions weakened.

## Commands actually executed

- `npx vitest run --config tests/integration/stu02.vitest.config.mts`: initial 6 expected missing-RPC
  failures; after migration 15/15, then extended 17/17 passed.
- `docker exec -i supabase_db_stu02-disposable-u65dd8 psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/student_request_consultation.test.sql`: 15/15 passed, rollback completed.
- `npx vitest run src/features/student/bookings/request-verification.test.ts`: initial 4 pass/3 faulty
  mock failures; corrected mock 7/7 passed.
- `npx vitest run --config tests/integration/stu02.vitest.config.mts -t 'canonical UTC'`: 1 failed;
  17 filtered tests not executed by that targeted command.
- `npx playwright test --config tests/e2e/stu02.playwright.config.ts`: early setup/environment runs
  failed as detailed above; latest complete run 2 passed/1 failed (confirmed private URL disclosure).
- Focused browser runs: JavaScript-disabled initial fixture TypeError then streamed-shell timeout;
  focused hydrated journey initially failed old-page selector. Latest complete journey passed.
- `npx tsc --noEmit`: passed during preparation; final rerun remains coordinator/recheck task.
- `npx prettier --write` limited to owned generated test/support files: applied successfully.

## Next action

Coordinator records this final candidate and verification evidence, surfaces remaining manual/browser
coverage limits for human review, and preserves independent sensitive-change approval before merge.
No additional implementation defect remains confirmed by this verifier. No merge/deploy performed.
