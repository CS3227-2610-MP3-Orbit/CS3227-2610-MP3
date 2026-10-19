# STU-04 — manage my bookings

## Draft specification record — 2026-10-18

- Branch: `student-manage-bookings`; baseline inspected: `378e421`.
- Scope requested: Student-owned booking list/status view; pending-only edit; own pending/approved
  cancellation strictly before slot start.
- Artifacts created: STU-04 draft specification, bounded implementation plan, self-review challenge, and
  handoff under `workflow/`.
- No application code, tests, migrations, CI, credential access, commit, merge, deployment, or production
  access occurred in this draft task.
- The draft remains unapproved. It records material decisions requiring team review rather than treating
  an agent-authored proposal as a product decision: what “description” edits, edit timing, list/detail
  data and pagination, retry semantics, and a real Lecturer-transition race contract.
- Joseph then reported accepted team product decisions: edit both topic/questions while pending even
  after start; list course/Lecturer/date-time/literal status/topic summary with full content/actions in
  owned detail and no first-cycle pagination; use idempotency keys plus expected version; and resolve
  Student-cancel/Lecturer-decision races by first valid transition, including approval-first pre-start
  cancellation. The draft was revised to record them; it remains unapproved pending exact-digest review.
- Checks: targeted Prettier initially identified four draft artifacts and passed after formatting;
  `npm run check:spec` passed (18 specs, 181 criteria, 72 referenced) with expected draft-coverage
  warnings; handoff validation and `git diff --check` passed. No application/database/browser tests ran.

Generated summary awaiting human verification.

## Reported team approval — 2026-10-18

- Joseph reported that he and the whole team reviewed and approved the revised STU-04 specification for
  implementation.
- Exact approved specification digest: `9eafaec3a8a4a83ebd11beca09ecfd88ca7463b2`.
- Individual reviewers and remote PR approval are not independently verified. This records product approval
  only; it does not approve merge, deployment, or sensitive changes.
- `npm run check:spec` then correctly failed because approved STU-04-AC1 through AC12 have no tests yet.
  Targeted Prettier, handoff validation, and `git diff --check` passed. No tests were added or weakened.

## Pre-code acceptance tests — 2026-10-18

- The assigned tester added STU-04 database-contract and browser acceptance tests only; no application
  code, migrations, configuration, CI, credentials, commits, merges, or deployments changed.
- `npm run check:spec` passed with 84 covered criteria; STU-04 AC1–AC12 are referenced by the new tests.
- The focused local pgTAP command failed as expected because no STU-04 RPCs exist yet (4 absent-function
  assertions of 8). Existing direct booking read/write-denial assertions passed.
- The existing STU-02-specific Playwright configuration did not collect the new STU-04 browser file.
  This is recorded as a verification gap, not a passing browser result.
- The test handoff records proposed narrow RPC names and the need for a reviewed shared E2E collection
  change. Generated evidence awaits independent implementation/review verification.

## Functional verification attempt — 2026-10-18

- Tester independently reviewed the uncommitted implementation using approved spec digest
  `9eafaec3a8a4a83ebd11beca09ecfd88ca7463b2`; implementation diff SHA-256 at review was
  `2ee6cf8b79caacbd556042c5a2b94ca253407cc97b1d6f8aeebd291ec0820cb1`.
- Static/spec/type/unit evidence: traceability passed (84 covered criteria); focused validation unit tests
  passed (2/2); typecheck passed; lint had zero errors and one pre-existing unused-variable warning in the
  STU-04 E2E test.
- The tester attempted to create an isolated database but the CLI reset command did not retain its named
  target. To avoid further normal-local-stack changes, no fixture writes or authenticated DB/browser
  verification were performed after that point. Any normal local pgTAP result is excluded from feature
  verification evidence.
- Recorded as blocked rather than passing: database ownership/state/time/idempotency/concurrency checks,
  browser checks, and the genuine Student-versus-Lecturer transition race. See
  `workflow/handoffs/stu-04/tester.md`.

## Functional verification recheck — 2026-10-18

- A separate temporary project was created only after confirming a distinct project id
  (`stu04-verify-w2lb3n`), database-container prefix (`supabase_db_stu04-verify-w2lb3n`), and API/DB
  ports (`56321`/`56322`). Test fixtures were fictional and confined to that target.
- STU-04 pgTAP contract: 8/8 passed. Direct authenticated fixture checks confirmed owned five-status
  history, allowlisted list projection, identical foreign/missing response, inactive refusal, edit
  trimming/stale conflict/exact same-key replay, pre-start cancellation/exact same-key replay, and past
  start refusal.
- The recovery UI change was statically checked: it keeps the same action input/idempotency key after an
  unknown outcome and offers a retry control. No automated simulated-lost-response browser/component test
  was run.
- Remaining: dedicated STU-04 browser collection/configuration, browser accessibility, GET/cross-origin,
  timeout, concurrency, and real Lecturer race coverage. No confirmed application defect found.

## Generator–verifier implementation cycle — 2026-10-18

- Orchestration used the developer as generator, then independent tester and read-only security reviewer.
  The approved STU-04 digest was `9eafaec3a8a4a83ebd11beca09ecfd88ca7463b2`.
- Generator added the Student booking list/detail/edit/cancel boundary and append-only migration
  `20261018030000_student_manage_bookings.sql`. No Lecturer transition was added; therefore the real
  cross-role race remains a stated verification limitation.
- Security finding `SEC-04-01` (medium) was confirmed: an unknown mutation outcome caused the UI to
  discard its idempotency key and use a fresh key on retry. Round 1 fixed it by retaining the complete
  mutation attempt and replaying the same key/version/payload. The independent static recheck found the
  fix present and no bounded regression.
- Coordination problem: the first tester attempt used a CLI reset that did not preserve the intended
  named target. The tester stopped, excluded normal-local results, and later validated a distinct
  temporary stack before creating fixtures. This did reset the normal local stack before the problem was
  recognized; no remote/production system was accessed.
- Final isolated-target evidence: pgTAP 8/8 plus targeted authenticated role/state/idempotency checks
  passed. Final project checks run by coordinator: unit suite 42 passed/4 todo; lint 0 errors; typecheck,
  traceability (84 referenced), workflow tests, secret scan, and whitespace check passed.
- Unexecuted: automated response-loss UI test, dedicated STU-04 browser execution/accessibility,
  GET/cross-origin and timeout paths, real multi-connection mutation races, and the future Lecturer
  transition race. Hosted CI and human sensitive-change/CODEOWNER review are also unverified.

## Browser-test correction — 2026-10-19

- Independent tester correction `TEST-04-01`: the STU-04 browser test had incorrectly expected a
  changed/refresh conflict after cancelling an owned future pending booking. The approved STU-04-R5
  requires that cancellation to succeed.
- The corrected acceptance path saves changed topic/questions, checks that the live detail card immediately
  shows those committed values, then cancels and checks `Booking cancelled.`, `Status: cancelled`, and
  preserved committed content. It retains the existing STU-04 acceptance labels.
- `npx prettier --check tests/e2e/student-manage-bookings.spec.ts` passed. Browser execution remains
  unperformed because the existing dedicated configuration does not collect STU-04; no passing browser
  result is claimed. `git diff --check` reports a pre-existing trailing blank line in the STU-04 spec,
  outside the tester's permitted scope.
