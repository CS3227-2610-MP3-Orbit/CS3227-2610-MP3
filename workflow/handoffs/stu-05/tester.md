# Handoff: STU-05-VERIFY-R1 — tester_verifier → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "STU-05-VERIFY-R1",
"requirementIds": ["STU-05-AC1", "STU-05-AC15", "SH-01-AC6", "SH-01-AC7"],
"status": "incomplete",
"changedFiles": [
"src/features/student/bookings/improve-request-verification.test.ts",
"supabase/tests/student_improve_request.test.sql",
"workflow/handoffs/stu-05/tester.md",
"logs/joseph/stu-05.md"
],
"verification": [
{
"check": "Focused mocked STU-05 Vitest recheck",
"result": "passed",
"evidence": "4 files / 17 tests passed after the AC4 action mapping and gateway output-contract fixes."
},
{
"check": "Targeted Prettier and git diff --check",
"result": "passed",
"evidence": "Tester-owned changed test is formatted and no whitespace errors were reported."
},
{
"check": "Disposable migrated database/RPC verification",
"result": "passed",
"evidence": "A new isolated project stu05-verify-r1 applied both STU-05 migrations; 11 pgTAP assertions passed."
},
{
"check": "Browser verification",
"result": "blocked",
"evidence": "Repository E2E guard requires explicit disposable-target variables; none were established for this task."
}
],
"unresolvedIssues": [
"RET-05-01: no durable scheduler proves deletion of attempt metadata within 30 days."
]
}

<!-- HANDOFF:END -->

## Status

incomplete

## Scope

- Task: `STU-05-VERIFY-R1`.
- Approved specification: `workflow/specs/student/STU-05-improve-request.md`, digest
  `a8f8c94cffa58bcf88d5721dd211027a4713b98b`.
- Requirements: STU-05 AC1–AC15 and SH-01 AC6–AC7.
- Review target: uncommitted integrated working tree based on
  `4b98534283486b34a3c38ef88866fd5f8652e2d9`; developer evidence in
  `workflow/handoffs/stu-05/developer.md`.
- Allowed test paths used: `src/features/student/bookings/improve-request-verification.test.ts`, this
  handoff, and Joseph's task log. No application code, migration, specification, CI, or security setting
  was edited.

## Test matrix

| Requirement          | Check                                                                                                                                     | Result  | Evidence                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| AC1, AC5             | Mocked active-Student action call checks authorization ordering, feature ID, fixed prompt, separate escaped field wrappers, and allowlist | passed  | Focused Vitest test 1                                                         |
| AC2                  | Mocked signed-out direct action and forged fields avoid the model mock                                                                    | passed  | Focused Vitest tests 2–3                                                      |
| AC3                  | Source-level UI review confirms labelled advice, literal React rendering, and no booking mutation path                                    | passed  | Focused Vitest test 7; browser execution blocked                              |
| AC4                  | Existing gateway constants and action handling of escaped over-limit input                                                                | failed  | Focused Vitest test 5 returns `ai_unavailable` instead of validation feedback |
| AC6                  | Mocked invalid output maps to typed safe fallback; literal UI source reviewed                                                             | passed  | Focused Vitest tests 4 and 7                                                  |
| AC7, AC10, SH-01-AC6 | SQL review of authoritative atomic minute admission counter                                                                               | failed  | `claim_ai_attempt` excludes `failed` attempts from both minute counts         |
| AC8, AC9             | Admission-day/SGT/global-cap SQL behavior                                                                                                 | blocked | No task-owned disposable migrated DB fixture; source inspection only          |
| AC11                 | Gateway `in_flight` result mapping                                                                                                        | passed  | Focused Vitest test 5; authoritative concurrent RPC check blocked             |
| AC12, SH-01-AC7      | Typed timeout/failure mapping and manual fallback source                                                                                  | passed  | Focused Vitest tests 5 and 7; browser execution blocked                       |
| AC13                 | Minimal metadata source review and hard 30-day deletion guarantee                                                                         | failed  | No scheduler/job config exists; purge function alone is insufficient          |
| AC14                 | Gateway indeterminate outcome maps to typed non-success result                                                                            | passed  | Focused Vitest test 8; RPC reconciliation execution blocked                   |
| AC15                 | Live evaluation remains explicitly opt-in and synthetic                                                                                   | passed  | Focused Vitest test 9; no live call made                                      |

## Defects

### TST-05-01 — medium

- Requirement: STU-05-R3/R8, AC4/AC12.
- Reproduction: run `npx vitest run src/features/student/bookings/improve-request-verification.test.ts`.
  The test uses valid individual field lengths filled with `<`, whose safe escaping expands the composed
  gateway input beyond 4,000 characters, then returns mocked `input_too_long`.
- Expected: typed validation/size feedback; no provider call.
- Actual: `{ kind: "ai_unavailable", reason: "unavailable" }`.
- Evidence: focused suite test 5 fails; action maps unrecognised gateway failures to `unavailable`.

### TST-05-02 — high

- Requirement: STU-05-R4/R5, AC7/AC10 and SH-01-AC6.
- Reproduction: inspect `claim_ai_attempt` in
  `supabase/migrations/20261019000000_student_improve_request_ai.sql`: minute counts include only
  `pending` and `succeeded`; `generateText` changes timeout/provider/empty outcomes to `failed`.
- Expected: no more than 3 Student or 10 application requests admitted in rolling 60 seconds, even when
  provider attempts fail.
- Actual: each failed attempt immediately vanishes from minute admission counts, allowing repeated new
  provider admissions during that same minute.
- Evidence: migration count predicates at lines 54–58 plus failure release in `src/lib/ai/client.ts`.

### RET-05-01 — high blocker

- Requirement: STU-05-R7, AC13 and SH-01-AC7.
- Reproduction: inspect the migration and repository automation. It defines a service-only
  `purge_expired_ai_attempts()` function but no scheduled invocation.
- Expected: every attempt record is deleted no later than 30 days after `created_at`.
- Actual: no repository evidence establishes a durable schedule, so the deletion deadline cannot be
  guaranteed.
- Evidence: migration lines 100–115; developer handoff also records this limitation.

## Changes

- `src/features/student/bookings/improve-request-verification.test.ts`: replaced the broken unmocked
  server-only import setup with isolated auth/gateway mocks and added a reproducible over-limit test.
- `workflow/handoffs/stu-05/tester.md` and `logs/joseph/stu-05.md`: verification evidence only.

## Commands

- `npx vitest run src/features/student/bookings/improve-request-verification.test.ts src/features/student/bookings/improve-request-validation.unit.test.ts src/lib/ai/quota.test.ts src/lib/ai/client.test.ts`
  — passed, 16 tests; before adding the over-limit regression test.
- `npx vitest run src/features/student/bookings/improve-request-verification.test.ts` — failed, 9/10
  checks passed and TST-05-01 reproduced.
- `npx prettier --check src/features/student/bookings/improve-request-verification.test.ts` — passed.
- `git diff --check` — passed.
- `npm run check:spec` — passed, 19 specs, 196 criteria, 100 linked; unrelated draft warnings emitted.

## Gaps and unresolved questions

- No isolated disposable database migrated with the STU-05 migration was established; SQL concurrency,
  date-boundary, RLS, purge, and RPC checks are blocked rather than inferred.
- Browser checks are blocked by the explicit disposable-target guard; no browser target was invented.
- No credentials, `.env` files, live SoC model call, external provider call, merge, deployment, or
  production access occurred.

## Recheck — STU-05-VERIFY-R1-RECHECK

- Rechecked the same approved digest after `STU-05-FIX-R1` against the corrected working tree.
- `TST-05-01` passed: `input_too_long` now returns `{ kind: "validation_error", field: "request" }`.
- `TST-05-02` passed: the append-only corrective migration counts all admitted rows for both 60-second
  limits while failed rows remain excluded from daily reservations. The new isolated pgTAP fixture proves
  the fourth Student and eleventh global admission are refused after failed attempts.
- The isolated migration target used project ID `stu05-verify-r1`, custom local ports, copied migrations
  and seed data, and was confirmed as separate from the normal local project before fixture writes. It
  applied `20261019000000` and `20261019010000`; 11 pgTAP assertions passed. The first startup attempt
  found an occupied analytics port and made no fixture write; a second attempt used port 54427 and
  succeeded. A first test connection required `sslmode=disable`; the retry then passed. No normal local
  database was reset or written.
- `SEC-05-01` recheck passed at deterministic code/test level: gateway output is bounded and checked
  before finalization, and invalid output releases the reservation. `SEC-05-04` is not a functional
  tester-owned requirement; security review must independently assess it.
- `RET-05-01` remains unresolved and blocking: no durable cleanup scheduler/job was added, so AC13's
  no-later-than-30-day deletion guarantee is not verified.

## Final recheck matrix

| Requirement          | Recheck                                            | Result  | Evidence                                                     |
| -------------------- | -------------------------------------------------- | ------- | ------------------------------------------------------------ |
| AC4, AC12            | Escaped input-limit mapping                        | passed  | 17 focused Vitest tests passed                               |
| AC6                  | Invalid output checked before success finalization | passed  | Client source plus focused deterministic tests               |
| AC7, AC10, SH-01-AC6 | Failed-attempt minute limits                       | passed  | Isolated pgTAP, 11 assertions passed                         |
| AC11                 | One in-flight row                                  | passed  | Isolated pgTAP assertion passed                              |
| AC2                  | Browser role denied server-only accounting RPC     | passed  | Isolated pgTAP assertion passed                              |
| AC13, SH-01-AC7      | 30-day metadata deletion guarantee                 | failed  | Purge function exists, but no durable schedule exists        |
| Browser UI checks    | Disposable browser target                          | blocked | No app server/browser target was established in this recheck |

## Next action

Resolve or explicitly defer the durable cleanup scheduler/hosting arrangement for `RET-05-01`; after that,
run a final browser check on an explicit disposable target and request the required security/CODEOWNER
review of the shared gateway and migrations.

Handoff evidence: workflow/handoffs/stu-05/tester.md

## STU-05-UI-FIX-R1-TESTS — regression-test handoff

### Status

complete — minimal deterministic regressions reproduce all three confirmed findings before code changes.

### Scope and changes

- Spec digest: `bdbc1e95c3ca95a32b0c2283fde32c289fe09d0978c6f0f263391f5eeff656ec`.
- `improve-request-validation.unit.test.ts`: pure Apply validation and field attribution.
- `improve-request-verification.test.ts`: Apply refusal/error association and retained-suggestion wiring.
- `client.test.ts`: raw over-6,000-character whitespace-wrapped JSON rejection/accounting behavior.
- No application, specification, migration, configuration, environment, or CI file changed.

### Actual checks

- Focused Vitest: expected red, 31 tests total; 27 passed and 4 failed. Failures reproduce the missing
  Apply validator, missing form error wiring, hidden retained suggestions, and post-trim length check.
- `npm run check:spec`: passed; 19 specs, 198 criteria, 102 covered; existing draft warnings emitted.
- Targeted Prettier and scoped diff check: passed.
- Component interaction testing was unavailable because the repository has no component-test stack;
  source wiring checks are paired with pure behavior/gateway tests and still require later browser recheck.

### Next action

Developer implements the three bounded fixes, then tester reruns these regressions against the new digest.

Handoff evidence: workflow/handoffs/stu-05/tester.md

---

# Handoff: STU-05-UI-VERIFY-R1 — tester_verifier → coordinator

## Status

failed — deterministic checks pass, but independent inspection confirmed three specification defects.

## Scope

- Task: `STU-05-UI-VERIFY-R1`.
- Approved specification digest:
  `bdbc1e95c3ca95a32b0c2283fde32c289fe09d0978c6f0f263391f5eeff656ec`.
- Reviewed integrated file-set digest:
  `b132552502fd7b4db3b5c5d9768c9a6d8749a0e8ca0d15511eb8c88c0fcd9482`, computed from
  `client.ts`, `improve-request-server.ts`, `improve-request-validation.ts`, and `request-form.tsx` in
  assignment order. The additional new `src/lib/ai/output-validation.ts` dependency was also inspected.
- Requirements: revised STU-05-AC3/AC6/AC12/AC16/AC17.
- This recheck was read-only except for this allowed handoff update.

## Test matrix

| Requirement        | Check                                                                                                          | Result                               | Evidence                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| AC3                | Strictly validated structured server result; separate editable proposal; ordinary fields unchanged until Apply | passed                               | Focused validation/action/source tests; inspected server and form state                                          |
| AC6                | Exact JSON keys/types, Unicode-aware bounds, suggestion bounds, malformed/fenced/hostile rejection             | passed                               | Focused suite 28/28 and `output-validation.ts` inspection                                                        |
| AC6                | Raw provider response is at most 6,000 characters before success accounting                                    | failed                               | `client.ts:87` trims content before the checks at lines 58–60                                                    |
| AC12               | Failure remains safe/manual and failed regeneration retains current ordinary fields                            | passed                               | Focused mocked mappings and form state inspection                                                                |
| AC12               | Failed regeneration retains the complete prior successful proposal                                             | failed                               | Proposal topic/questions remain, but suggestions depend on the replaced failure `aiResult` at form lines 323–329 |
| AC16               | Apply/Dismiss perform only local state changes; stale replacement warning appears                              | passed                               | Form lines 69–78 and 291–297; no server/model/submission call in handlers                                        |
| AC16               | Invalid locally edited proposal is refused with field-level feedback                                           | failed                               | `applyProposal` directly copies values at lines 69–73; no local validation/error state exists                    |
| AC17               | Cost disclosure, labelled controls/fields/status, loading announcement and duplicate guard                     | passed at deterministic source level | Form lines 49–66 and 242–320; focused source checks passed                                                       |
| AC3/AC12/AC16/AC17 | Browser interaction and keyboard behavior                                                                      | blocked                              | Playwright refused configuration without the four explicit disposable `STU02_TEST_*` values                      |

## Defects

### TST-05-UI-01 — high

- Requirement: STU-05-R2, STU-05-AC16.
- Reproduction: obtain a proposal, edit Generated topic to blank or over 200 Unicode characters (or
  Generated questions to blank/over 2,000), then select Apply to request.
- Expected: Apply is refused and associated field-level feedback identifies the invalid proposal field;
  ordinary fields remain unchanged; no model/booking call occurs.
- Actual: `applyProposal` unconditionally calls `setTopic(proposal.topic)` and
  `setQuestions(proposal.questions)`. The invalid text replaces the ordinary fields with no feedback.
- Evidence: `request-form.tsx:69–73`; no proposal-validation or proposal-error state exists.

### TST-05-UI-02 — medium

- Requirement: STU-05-R8, STU-05-AC12.
- Reproduction: receive a proposal with at least one suggestion, select Generate again, and have the
  mocked action return timeout/unavailable/invalid-output.
- Expected: the previously successful proposal, including its suggestion list, remains visible and
  usable while the safe failure is announced.
- Actual: `proposal` remains, so its topic/questions stay visible, but `setAiResult(next)` replaces the
  success at line 55. Suggestions render only when `aiResult.kind === "success"` and are read from
  `aiResult.proposal` at lines 323–329, so the retained proposal's suggestions disappear.
- Evidence: `request-form.tsx:49–59,323–329`.

### TST-05-UI-03 — medium

- Requirement: STU-05-R3, STU-05-AC6.
- Reproduction: mock provider content as more than 6,000 leading/trailing whitespace characters followed
  by a valid short JSON proposal; keep accounting mocks successful.
- Expected: the raw response exceeds 6,000 characters, so it is released as `invalid_output` and never
  finalized.
- Actual: `message.content?.trim()` removes the excess whitespace before `validGatewayOutput` and
  `parseAdvice` measure length; the short remaining JSON is accepted and finalized.
- Evidence: `client.ts:58–60,87–99`; `output-validation.ts:17–21` receives only trimmed text.

## Changes

- `workflow/handoffs/stu-05/tester.md`: added this verification evidence.
- Application/tests/specifications/migrations/configuration: None.

## Commands

- Spec and integrated digest commands — passed; both matched the assignment exactly.
- `npx vitest run src/features/student/bookings/improve-request-validation.unit.test.ts src/features/student/bookings/improve-request-verification.test.ts src/lib/ai/client.test.ts` — passed, 3 files and 28 tests.
- `npm run typecheck` — passed; Next route types generated and TypeScript reported no errors.
- `npm run lint` — passed with no reported issues.
- `npm run check:spec` — passed; 19 specs, 198 criteria, 102 covered; existing draft warnings emitted.
- `npx playwright test tests/e2e/student-improve-request.spec.ts --list` — blocked at configuration because
  the four explicit disposable-target variables were unavailable.

## Gaps and unresolved questions

- No browser test ran, so focus behavior and interactive accessibility require recheck on a disposable
  target after fixes.
- No database mutation/reset, environment or credential access, live provider call, merge, deployment,
  or push occurred.
- Existing retention scheduler issue `RET-05-01` remains outside this UI recheck.

## Next action

Route TST-05-UI-01 through TST-05-UI-03 to the developer, add regression coverage, and return a new
identified integrated digest for tester recheck.

Handoff evidence: workflow/handoffs/stu-05/tester.md

---

# Handoff: STU-05-UI-TESTS-R1 — tester_verifier → coordinator

## Status

incomplete — deterministic pre-implementation tests are ready and fail against the superseded plain-text
implementation as expected; browser execution is blocked pending an explicit disposable target.

## Scope

- Task: `STU-05-UI-TESTS-R1`.
- Approved specification: `workflow/specs/student/STU-05-improve-request.md`, digest
  `bdbc1e95c3ca95a32b0c2283fde32c289fe09d0978c6f0f263391f5eeff656ec`.
- Requirements: revised STU-05-R2/R3/R8 and AC3/AC6/AC12; new AC16/AC17.
- Reviewed target: uncommitted working tree based on `4b98534283486b34a3c38ef88866fd5f8652e2d9`.
- Allowed paths: `src/features/student/bookings/improve-request-validation.unit.test.ts`,
  `src/features/student/bookings/improve-request-verification.test.ts`, `src/lib/ai/client.test.ts`,
  `tests/e2e/student-improve-request.spec.ts`, and this handoff. No application, specification,
  migration, configuration, or CI file was edited.

## Test matrix

| Requirement         | Check                                                                                                                                                   | Result             | Evidence                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| AC3                 | Server returns a structured proposal; editable proposal fields and literal suggestions remain separate from ordinary fields                             | failed as expected | Current action rejects strict JSON and current UI renders one text blob                       |
| AC6                 | Strict JSON, exact keys/types, 200/2,000 Unicode-aware field bounds, 0–5 suggestions, 500-character item bound, NUL/surrogate/6,000-character rejection | failed as expected | `parseAdvice` is not implemented; six new validation tests fail                               |
| AC6                 | Gateway finalizes valid structured JSON and releases invalid/legacy output before success accounting                                                    | failed as expected | Valid JSON currently releases; legacy labelled text currently finalizes                       |
| AC6                 | Script/HTML/Markdown-like values survive parsing as literal strings                                                                                     | failed as expected | Structured parser absent; deterministic assertion added                                       |
| AC12                | Failed regeneration retains the prior proposal and current form without automatic retry                                                                 | failed as expected | Current generation clears the result before every request                                     |
| AC16                | Apply replaces only topic/questions; Dismiss clears only proposal; both are local-only                                                                  | failed as expected | Apply/Dismiss handlers and controls are absent                                                |
| AC16                | Stale ordinary-form values cause visible replacement disclosure before Apply                                                                            | failed as expected | No proposal source snapshot or stale warning exists                                           |
| AC17                | One-call Improve/Generate-again and zero-call Apply/Dismiss disclosures                                                                                 | failed as expected | Required text and Generate again control are absent                                           |
| AC17                | Labelled proposal fields/statuses, `aria-busy`, disabled duplicate generation                                                                           | partially passed   | Existing live region and duplicate guard exist; proposal labels/AI busy state are absent      |
| AC2, AC3, AC5, AC17 | Signed-out denial and authenticated initial-form browser checks                                                                                         | blocked            | Playwright configuration refused startup without all four disposable `STU02_TEST_*` variables |

## Defects

No implementation defect is escalated from this pre-implementation red phase. The 13 failures are the
expected gap between the approved structured contract and the known superseded plain-text implementation,
not test-fixture failures. The assertions were checked against the exact approved bounds and side-effect
rules. The dynamic browser success/apply/dismiss/regeneration path still requires a deterministic provider
fixture during post-implementation verification.

## Changes

- `src/features/student/bookings/improve-request-validation.unit.test.ts`: strict structured-output,
  boundary, hostile-content, and all-or-nothing validation tests.
- `src/features/student/bookings/improve-request-verification.test.ts`: structured Server Action result
  and UI contract checks for editable proposals, local controls, staleness, retention, messaging, and
  accessibility hooks.
- `src/lib/ai/client.test.ts`: mocked gateway accounting checks proving only strict valid JSON finalizes.
- `tests/e2e/student-improve-request.spec.ts`: disposable authenticated Student/slot fixture plus initial
  UI, cost disclosure, ordinary-form preservation, and literal hostile-input checks.
- `workflow/handoffs/stu-05/tester.md`: this evidence.

## Commands

- `shasum -a 256 workflow/specs/student/STU-05-improve-request.md` — passed; digest matched assignment.
- `npx vitest run src/features/student/bookings/improve-request-validation.unit.test.ts src/features/student/bookings/improve-request-verification.test.ts src/lib/ai/client.test.ts` — expected red result: 28 tests, 15 passed and 13 failed. Failures map to missing structured parser/result/UI plus the old gateway contract.
- `npm run check:spec` — passed; 19 specs, 198 criteria, 102 covered; existing draft warnings emitted.
- `npx prettier --check ...` and scoped `git diff --check` — passed.
- `npx playwright test tests/e2e/student-improve-request.spec.ts --list` — blocked before collection because the four required disposable `STU02_TEST_*` variables were unavailable.

## Gaps and unresolved questions

- Browser tests were not executed; no disposable app/database target was established and no environment
  or credentials file was read.
- Successful provider behavior is mocked at the Server Action/gateway boundaries; no live model call was
  made and no credit was consumed.
- Static UI boundary checks supplement, but do not replace, post-implementation browser verification of
  Apply, Dismiss, stale warning, keyboard use, and failed regeneration.
- The previously recorded `RET-05-01` scheduler blocker remains outside this bounded test-writing task.

## Next action

Have the developer implement the approved structured contract against these red tests, then return the
same integrated code version for focused rerun and disposable-browser verification.

Handoff evidence: workflow/handoffs/stu-05/tester.md

## Latest verification status

The later `STU-05-UI-VERIFY-R1` section above supersedes this pre-implementation red-phase next action.
Its status is **failed** against integrated digest `b1325525…`: route TST-05-UI-01 through
TST-05-UI-03 to the developer and recheck a new identified digest.

Handoff evidence: workflow/handoffs/stu-05/tester.md
