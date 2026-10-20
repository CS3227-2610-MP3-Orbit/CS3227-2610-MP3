# STU-05 — improve request AI specification

## Draft specification record — 2026-10-19

- Requested scope: Student advisory AI that improves unsaved consultation topic/questions while limiting
  SoC LLM spend.
- Confirmed product decisions recorded: 3 admitted requests/minute per active Student; 10 successful
  responses per active Student per Asia/Singapore day; 500 successful responses globally per
  Asia/Singapore day; 00:00 SGT resets; failures/refusals do not consume daily quota; duplicate in-flight
  requests are prevented; manual booking remains usable after any AI failure/limit.
- Artifacts created: STU-05 draft specification, bounded plan, self-review challenge, shared SH-01 quota
  change-impact record, updated SH-01 draft, and handoff.
- Observed gateway evidence recorded separately: placeholder quota values and TODO implementation do not
  meet this specification. No application code, tests, migrations, CI, credentials, commits, merges,
  deployments, or production access occurred.
- Blocking decisions recorded, not invented: whether the legacy global-per-minute safeguard remains and
  the exact atomic in-flight/success-accounting/recovery mechanism.
- Traceability correction: added parser-recognized bold references for `STU-05-AC1`–`AC13` without
  changing their requirements or verification methods.
- Verification after correction: targeted Prettier and `git diff --check` passed; `npm run check:spec`
  passed with 19 specs, 194 criteria, and 84 covered, with expected warnings for draft criteria.
- Identifier correction: renamed the unapproved draft and associated plan/reviews/handoff/log to STU-05
  because STU-04 is Manage My Bookings; no feature behaviour changed.
- Accepted decision revision: retain the global guard at 10 admitted app-wide requests per rolling 60
  seconds, and use atomic minimal-attempt reservation/finalization/release/expiry behaviour. A stale or
  indeterminate attempt never triggers an automatic provider retry or false success claim; a resolved
  retry is new deliberate user action. This materially revises the drafts, so earlier reported approval
  is stale and renewed teammate approval is required.
- Verification after the material revision: targeted Prettier, `npm run check:spec` (19 specs, 196
  criteria, 84 covered with expected draft warnings), and `git diff --check` passed. No implementation
  checks ran because both specifications remain draft.
- Reported approval: Joseph reported on 2026-10-19 that he and the team approved revised STU-05 and the
  SH-01 quota subset. STU-05 is now `approved`; broader SH-01 remains `draft`. Individual identities and
  remote PR approval were not independently verified, and this is not merge/deployment/sensitive-change
  approval. After STU-05 became approved, `npm run check:spec` correctly failed (exit 1) because
  STU-05-AC1 through AC15 have no linked tests. Tester-owned pre-code acceptance/security tests are next;
  implementation remains blocked until they pass.
- Tester pre-code test task `STU-05-PRECODE-TESTS`: added deterministic gateway/quota/action-contract
  and UI-contract test artifacts referencing every STU-05 acceptance criterion plus SH-01 quota criteria.
  `npm run check:spec` passed (19 specs, 196 criteria, 100 covered), and `npm run typecheck` passed. The
  focused new Vitest tests intentionally failed because `decideQuota` remains TODO with placeholder
  values and the STU-05 action/UI do not exist; no feature behaviour was claimed verified. Playwright
  collection was blocked by the repository's required disposable-target environment guard; no credentials
  or live model calls were used. Evidence: `workflow/handoffs/stu-05/tester-precode.md`.

Generated summary awaiting independent human verification.

## Shared daily quota revision — 2026-10-20

- Joseph authorized replacing the previous minute and per-Student daily limits. The confirmed policy is:
  no per-minute quota; one in-flight improvement attempt per Student; no per-Student daily cap; and at
  most 100 successful AI responses app-wide per Asia/Singapore calendar day.
- STU-05 and the approved SH-01 quota subset now state that pending reservations count atomically against
  the shared daily capacity, failures release capacity, and the daily counter uses trusted SGT time.
- Added append-only migration `20261020000000_student_improve_request_daily_quota.sql`; it replaces the
  claim RPC without editing existing migrations. The migration was applied to the local development DB.
- Evidence: focused quota unit tests (2/2), local pgTAP quota/RPC test (12/12), typecheck, lint, spec
  traceability, and diff check passed. No live provider call, credential access, merge, push, deployment,
  or production access occurred. Sensitive migration/shared gateway review remains required before merge.

Generated summary awaiting independent human verification.

## Apply-confirmation and post-apply flow — 2026-10-20

- Joseph requested that a successful Apply close the generated proposal and show confirmation, while an
  overwrite of ordinary fields changed after generation requires an explicit confirmation first.
- The request form now validates the edited proposal, asks for confirmation only when the source snapshot
  differs from current ordinary fields, then applies topic/questions, closes the proposal, and announces
  that the fields remain editable before normal submission. The control becomes “Generate another
  suggestion”; no automatic generation, booking submission, persistence, or extra AI call is introduced.
- Evidence: focused STU-05 tests (3 files / 31 tests), typecheck, lint, targeted Prettier, and scoped
  `git diff --check` passed. No live provider call, credential access, database action, merge, push,
  deployment, or production access occurred.

Generated summary awaiting independent human verification.

## Proposal-card readability and action-control polish — 2026-10-20

- Joseph reported that the implemented structured-proposal card was difficult to read and that Apply/Dismiss
  controls were difficult to target. The request-form UI was refined without changing AI, authorization,
  data, or booking behavior.
- The optional AI area now has a clearer heading and call-cost notice; generated content uses a separate
  high-contrast proposal card; suggestions use a readable list container; stale/error feedback is visually
  distinct; and Apply/Dismiss are full-size, high-contrast responsive actions (stacked on narrow screens).
- Evidence: focused STU-05 tests (3 files / 31 tests), typecheck, lint, targeted Prettier, and scoped
  `git diff --check` passed. No browser/live-provider call, credential access, database action, merge,
  push, deployment, or production access occurred.

Generated summary awaiting independent human verification.

## Structured editable-proposal implementation and fix round 1 — 2026-10-20

- Tester added acceptance/security coverage for the approved structured-proposal contract before code:
  strict JSON `{topic, questions, suggestions}`, all-or-nothing output validation, local-only Apply and
  Dismiss, stale-form disclosure, regeneration retention, and one-call/zero-call UI messaging.
- The developer implemented the proposal UI and parser. Independent functional/security review found three
  reproducible issues: Apply initially accepted invalid locally edited fields; failed regeneration hid the
  retained suggestions; and trimming before validation permitted over-6,000-character raw provider output.
- Tester added red regression coverage before the fix. The developer fixed all three: Apply now validates
  and reports a generated-field error without changing ordinary fields; suggestions render from retained
  proposal state; and the gateway checks raw provider content before trimming/parsing.
- Final integrated deterministic evidence: focused STU-05 suite passed 35 tests. `npm run verify --
--profile=app` passed formatting, lint, typecheck, workflow controls, sensitive-change classification,
  77 application unit tests, traceability, secret scan, and production build. No live provider call, secret
  file access, database reset, merge, push, deployment, or production access occurred.
- Limitation: the tester and security-reviewer final rechecks could not complete because the workspace
  agent spend cap was exhausted. Browser E2E is also not run because no disposable `STU02_TEST_*` target
  was supplied. These are unperformed checks, not passes. `RET-05-01` remains open: no durable scheduler
  proves deletion of minimal AI-attempt metadata within 30 days.

Generated summary awaiting independent human verification.

## Tester verification round 1 — 2026-10-19

- Assignment `STU-05-VERIFY-R1` independently reviewed the integrated uncommitted implementation against
  approved STU-05 digest `a8f8c94cffa58bcf88d5721dd211027a4713b98b` using isolated server-action
  mocks only. No live SoC call, credential access, normal database mutation, merge, push, deployment, or
  production access occurred.
- Corrected the tester test setup so it mocks `server-only`, role authorization, and the gateway before
  importing the protected Server Action. The focused action tests now exercise authorization order,
  allowlisted inputs, wrappers, typed failures, literal output source, and advisory live-evaluation
  wording.
- Confirmed findings: escaped within-field-limit input is presented as generic availability failure rather
  than validation feedback; failed provider attempts are excluded from the rolling minute admission count;
  and no durable scheduler proves 30-day attempt-metadata deletion. Details and actual commands are in
  `workflow/handoffs/stu-05/tester.md`.
- Database and browser verification remain blocked because no task-owned disposable migrated target was
  established. This is not evidence that those checks passed.

## Tester recheck — 2026-10-19

- `STU-05-VERIFY-R1-RECHECK` independently re-ran the confirmed functional fixes against the same approved
  STU-05 digest. Focused mocked tests passed (4 files, 17 tests).
- A new isolated temporary Supabase project (`stu05-verify-r1`) applied both STU-05 migrations. Its
  dedicated pgTAP fixture passed 11 assertions covering failed-attempt minute counting, Student/global
  admission caps, one in-flight attempt, and denied browser-role RPC access. The normal local database
  was not reset or written. One startup port conflict and one TLS connection setup error were corrected
  within the allowed setup retries and recorded in the tester handoff.
- Corrected findings `TST-05-01` and `TST-05-02` are verified fixed. `RET-05-01` remains unresolved:
  no durable scheduler proves the required deletion of attempt metadata within 30 days. Browser testing
  remains unexecuted because no disposable app target was established.

## Developer implementation record — 2026-10-19

- Assignment: `STU-05-IMPLEMENT-R1`, approved STU-05 digest
  `a8f8c94cffa58bcf88d5721dd211027a4713b98b`; shared quota subset `SH-01-R6/AC6/AC7`.
- Implemented server-only atomic attempt claim/resolve support, fixed approved quota values, typed gateway
  failure behavior, draft-only Student action, request-form AI control, and append-only migration
  `20261019000000_student_improve_request_ai.sql`. No prompt/output/provider response is stored or
  logged by the new code. No live model call, credentials, merge, push, deployment, or production access occurred.
- Structured messages: developer reported `RET-05-01` to the coordinator; coordinator decided to continue
  safe remainder but not claim scheduler compliance. This message was coordination evidence, not approval.
- Checks: typecheck, focused developer unit tests (7), local DB lint, existing pgTAP suite (52), lint,
  traceability, build, targeted formatting, and diff check passed. Tester-owned STU-05 action contracts
  currently fail at server-only module import because their setup does not mock `server-only`; this is a
  test-setup defect pending independent tester correction. The new migration was not installed into a
  disposable database, so its RPC semantics remain unverified.
- Remaining blocker `RET-05-01`: repository evidence contains no durable scheduler/hosting job for the
  mandated deletion of minimal attempt metadata no later than 30 days. A service-only purge function is
  included as support only; it is not represented as a compliant schedule. See
  `workflow/handoffs/stu-05/developer.md`.

## Developer fix round 1 — 2026-10-19

- Coordinator routed independent findings `SEC-05-01`, `SEC-05-02`/`TST-05-02`, `TST-05-01`, and
  `SEC-05-04` to `STU-05-FIX-R1`. The developer added output-contract validation before successful
  accounting finalization, safe input-too-long validation feedback, and append-only corrective migration
  `20261019010000_student_improve_request_ai_fix.sql` so every admitted attempt is rate-counted for 60
  seconds while failures release daily capacity.
- Recheck evidence: TypeScript, independent action verification plus developer tests (17 assertions),
  lint, traceability, production build, and diff check passed. No migration reset/install, live model
  call, credentials, merge, push, deployment, or production access occurred.
- `RET-05-01` remains: a purge function is not a configured durable 30-day deletion scheduler. This has
  not been represented as resolved. Awaiting independent database/security recheck.

## Developer fix round 2 — 2026-10-19

- Coordinator routed `SEC-05-06`: blank `Improved draft:` / `Suggestions:` bodies could previously pass
  output validation. The gateway and feature validator now require non-whitespace content in both labelled
  sections before a result can be finalized, and a developer-owned regression test covers the blank case.
- Recheck: TypeScript, independent action tests plus developer tests (18 assertions), lint, targeted
  formatting, and diff check passed. The first typecheck attempt exposed unsupported named regex capture
  groups for the repository target; numbered captures corrected it. No live model, credentials, merge,
  push, deployment, or production access occurred.
- `RET-05-01` remains unresolved; no scheduler/hosting configuration was changed. This was the second and
  final automatic fix round.

## Renewed team-reported specification approval — 2026-10-19

- Joseph reported that the team approved revised STU-05 reviewed at draft digest
  `e871e34b126b0e624e1b88f06f47eac917e548c2` and the applicable SH-01 quota subset reviewed at draft
  digest `07f3f1e5d6c0148076157447ccf584edacc3620e`.
- STU-05 status is now `approved`. SH-01 remains `draft`; only the quota subset is reported approved.
- Limitation: reviewer identities and remote GitHub/PR evidence were not independently verified. This is
  product/specification approval only, not merge, deployment, or sensitive implementation approval.
- Next gate: tester strengthens isolated pre-code mocks/fixtures before developer work. No code, tests,
  migrations, CI, credentials, commits, merges, deployments, or live-model calls occurred in this record.

Generated summary awaiting independent human verification.

## Material specification revision — 2026-10-19

- Human decision recorded: reserve applicable daily AI capacity atomically at admission. Attribute a valid
  provider response to that admission's Asia/Singapore calendar day even if it arrives after midnight;
  failures release the reservation; new post-midnight admissions use the new day.
- Human decision recorded: retain only user ID, feature, attempt state/outcome, and timestamps for no more
  than 30 days after `created_at`; never retain prompts, outputs, or raw provider responses.
- Effect: STU-05 changed materially from approved digest `74eeb61f192e0073343fed708ad694b671268fbc` and
  returned to `draft`; the prior reported STU-05/team quota-subset approval is stale. No application code,
  tests, migrations, CI, credentials, commits, merges, deployments, or live-model calls occurred.
- Next gate: renewed team approval of revised STU-05 and the applicable SH-01 quota subset, followed by
  tester strengthening of isolated pre-code mocks/fixtures before developer work.

## Combined multi-agent implementation workflow — 2026-10-19

- Orchestrator: the primary Codex session. Native agent assignment/follow-up messaging was used; no
  shared inbox or orchestration framework was created. Agent messages were treated as coordination
  evidence, not approval.
- Dependency map: independent requirements challenge → tester pre-code contracts → one developer-owned
  shared integration (quota/accounting migration, gateway, action, and request-form UI) → independent
  tester/security verification → up to two fix/recheck rounds. Parallel implementation was avoided
  because the action, shared gateway, and migration share the same attempt-state contract. Tester and
  security reviews ran independently in parallel after integration.
- Human interventions: Joseph reported team approval of the final revised STU-05/SH-01 quota subset;
  Joseph accepted admission-day accounting and 30-day retention decisions. Neither report is evidence
  of merge, deployment, hosting configuration, or remote PR approval.
- Coordination limitation: the first follow-up tester-agent turn stopped because its workspace agent
  spend cap was exhausted. A fresh tester verifier later completed the isolated-mock and disposable-
  database verification. No unsupported messaging or external capability was substituted.
- Independent challenge identified material accounting/retention gaps before code. The admission-day and
  30-day retention requirements were revised and re-approved before implementation. It also found the
  original pre-code contracts too broad; the verifier later repaired its own mock setup rather than
  changing application code to suit a broken test.
- Round 1 confirmed and fixed: invalid provider output was finalized before feature validation
  (`SEC-05-01`); failed provider attempts bypassed rolling-minute admission limits
  (`SEC-05-02`/`TST-05-02`); composed escaped input produced generic outage feedback (`TST-05-01`);
  and the labelled output contract was too weak (`SEC-05-04`). Functional recheck passed focused
  mocks (17 tests) and 11 pgTAP assertions on an isolated `stu05-verify-r1` database with both new
  migrations applied.
- Round 2 found the legacy heading form still allowed an empty improved-draft section (`SEC-05-06`).
  The developer attempted the final permitted automatic fix; security recheck found the legacy fallback
  still accepts that empty section. Per the two-round limit, no third automatic fix was started.
- Current blockers: `SEC-05-06` requires a human choice to remove the legacy output compatibility or
  change the approved contract; `RET-05-01` requires a human/hosting owner to configure and evidence a
  reliable least-privilege scheduler for deletion within 30 days, or a renewed specification decision.
  Browser verification was not run because no verified disposable app target was available. No live SoC
  call, credential access, merge, push, deployment, or production access occurred.
- Comparison with earlier feature workflows is limited to recorded evidence: STU-05 obtained isolated
  migration verification before stopping, whereas its initial tester setup and the original STU-04
  browser setup had collection/target limitations. This does not establish that using more agents
  improved the result.

Generated summary awaiting independent human verification.

## Structured editable-proposal specification revision — 2026-10-20

- Joseph manually exercised the live-configured UI and requested the previously proposed structured,
  editable improved topic/questions, suggestions list, Apply, Dismiss, visible original fields, no
  automatic submission, and limited-call disclosure. No prompt, response, credential, or private draft is
  recorded here.
- Requirements assignment `STU-05-UI-SPEC-R1` reviewed current code and prior workflow evidence. The
  current implementation still returns one text blob and requires manual copying; this is observed state,
  not approval to preserve it.
- The revision changes STU-05 R2/R3/R8 and AC3/AC6/AC12 and adds AC16/AC17. It proposes an exact strict
  JSON object, field/list/raw bounds, local-only Apply/Dismiss, source-snapshot overwrite disclosure,
  failed-regeneration retention, literal rendering, and accessible one-call/zero-call messaging.
- Because this materially changes the approved response and UI contract, STU-05 returned to `draft`.
  Prior approved digest `a8f8c94cffa58bcf88d5721dd211027a4713b98b` and related AC3/AC6/AC12
  implementation/test/review results are stale for this revision; unaffected authorization/quota evidence
  remains regression evidence only.
- No application code, tests, migrations, CI, authentication, environment configuration, credentials,
  model call, commit, merge, push, deployment, or production access changed in this assignment.
- Evidence: targeted Prettier passed for all five authorized artifacts; `npm run check:spec` passed with
  19 specs, 198 criteria, and 100 covered while correctly warning that draft AC16/AC17 have no tests;
  `git diff --check` passed. Application, browser, database, and provider checks were not run for this
  specification-only task.
- Next gate: teammates review the exact revised draft digest and proposed bounds/stale/retry semantics;
  after approval, tester updates acceptance/security tests before developer implementation. `RET-05-01`
  remains unresolved and this UI revision does not claim to close it.

Generated summary awaiting independent human verification.

## Structured editable-proposal team-reported approval — 2026-10-20

- Joseph stated, “My team and I approve the revised STU-05 specification. Implement it.” The reviewed
  draft digest was `d0c86cfacf4dcd445dd883e7e5c28f120dde58adac7e5a8692d8323ea1ef5feb`.
- Requirements assignment `STU-05-UI-APPROVAL` recorded this as team-reported product/specification
  approval only. Individual teammate identities and remote protected-PR evidence were not independently
  verified; no test, sensitive-code, merge, deployment, or production approval is inferred.
- STU-05 is now `approved`. Exact JSON keys/types and bounds, structured editable proposal, Apply/Dismiss,
  stale-form disclosure, failed-regeneration retention, accessibility and call-cost behavior are confirmed
  without changing the behavior reviewed in the draft.
- The final approved digest after approval-record formatting is
  `bdbc1e95c3ca95a32b0c2283fde32c289fe09d0978c6f0f263391f5eeff656ec`.
- Application code and tests were not changed. The next gate is tester-owned updates for revised
  AC3/AC6/AC12 and new AC16/AC17 before developer implementation. `RET-05-01` remains unresolved.
- Evidence: targeted Prettier and `git diff --check` passed. `npm run check:spec` failed as expected after
  approval because new approved criteria AC16/AC17 have no linked tests (19 specs, 198 criteria, 100
  covered). The check was not weakened; this failure defines the required tester-owned next gate.

Generated summary awaiting independent human verification.

#Reflection

Reflection on the Multi-Agent Implementation Workflow
What went well
The combined multi-agent workflow provided useful separation between specification, implementation, functional verification, and security review. The requirements architect challenged the original specification before implementation and identified important ambiguities involving daily quota reservation, midnight attribution, metadata retention, and AI-output validation. These decisions were escalated for human approval instead of being decided silently by an agent.
The task decomposition also reduced conflicting edits. Because the AI gateway, quota accounting, database migration, server action, and UI depended on the same contract, they were assigned to one developer rather than several agents editing shared files simultaneously. Independent work, such as functional and security reviews, was performed in parallel where appropriate.
The generator–verifier pattern found several genuine defects that ordinary happy-path testing might have missed. These included:

- Invalid AI output being counted as a successful request.
- Failed provider calls bypassing rolling rate limits.
- Incorrect handling of oversized composed prompts.
- Weak validation of the AI response format.
- Locally edited AI suggestions bypassing field-length validation.
- Suggestions disappearing after a failed regeneration.
- Oversized raw model responses bypassing the limit because they were trimmed too early.
  The tester and security reviewer independently reproduced several of the same problems, increasing confidence that they were implementation defects rather than incorrect tests. Regression tests were added before fixes, and the final deterministic checks passed, including 77 application tests, 35 focused STU-05 tests, linting, type checking, formatting, specification traceability, secret scanning, and the production build.
  The workflow also maintained important security boundaries. The LLM credentials remained server-only, user input was labelled and escaped, generated content was rendered as plain text, and AI actions could not submit or modify a booking automatically. No deployment, merge, production access, or unapproved database push occurred.
  What went wrong
  The workflow consumed substantially more time, context, and agent budget than expected. Maintaining assignments, handoffs, review records, requirement digests, and logs created significant administrative overhead for a relatively small feature. The long conversation context also made the process harder to follow and contributed to repeated explanations and confusion about whether specification work, testing, or implementation was currently happening.
  Some verification work initially failed because of the test setup rather than the application. For example, a test imported server-only code without the required mock. Although the tester corrected its own setup before escalating defects, this still caused unnecessary delay.
  The final tester and security rechecks could not complete because the workspace agent spend limit was exhausted. Therefore, although the final application verification passed, the final integrated version did not receive the planned independent agent sign-off. Browser end-to-end testing was also blocked because a disposable authenticated test target was unavailable.
  Local configuration caused additional friction. The application initially expected SOC_LLM_* environment variables, while the actual service used the SOCLAAS_* convention. This made the feature appear unavailable even though the user had configured the provider correctly. The application and documentation had to be updated to use the official variable names.
  The 30-day AI usage-metadata deletion requirement also remains unresolved. A purge function exists, but there is no durable scheduled job proving that deletion will occur within the required period. This requires a hosting or deployment decision rather than another application-code fix.
  What I would improve next time
  For future features, I would keep the same role separation but use a smaller workflow:

1. Start a fresh chat for each feature and provide only the approved specification, latest handoff, and relevant files.
2. Use one requirements review, one developer, and two independent reviewers.
3. Keep one consolidated handoff per feature instead of many small handoff files.
4. Establish the disposable database and browser fixtures before implementation begins.
5. Confirm provider environment-variable names and API response formats during specification review.
6. Reserve multi-agent collaboration for genuinely independent tasks instead of using additional agents by default.
7. Set an agent-call or token budget before starting and preserve capacity for the final verification round.
8. Resolve operational requirements, such as scheduled data deletion, before claiming the feature is release-ready.
   Overall, the multi-agent workflow improved defect detection, traceability, and security review, but it did not automatically make development faster. Its main value was independent verification. The biggest lesson is that multi-agent work should be narrowly scoped and supported by prepared test infrastructure; otherwise, coordination overhead and context usage can outweigh the benefits.
