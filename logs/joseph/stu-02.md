# STU-02 — request a consultation

## Latest implementation verification — 2026-10-18

This section supersedes historical drafting/status statements below. Joseph requested continued
implementation; no merge, push, deployment or production access is authorized or performed.

- Approved specification digest: `fa2e3f2e68810ad6ab5e1603a753b21bd8c4c384`.
- Initial generator commit: `afe888c544ae00cc8fe147e9cc9476424a50bf49`.
- Fixed application commit: `2396f26dfc2004ae64bb28a0893637319dde03d8`.
- Assignments: requirements architect preflight, developer generator, tester_verifier functional
  verification, security_reviewer independent read-only review. Native subagent thread limit required
  the security role to run through a separate read-only Codex CLI session using the existing role
  instructions; this was not a developer self-review.
- Round 1 findings: F-TV02-01 (high), native form fallback could serialize private descriptions in
  URLs; F-TV02-02 (medium), timestamp offsets violated canonical UTC `Z`. Developer fixed explicit
  POST/pre-hydration controls and added an append-only migration/strict timestamp parsing. Tester
  and security reviewer rechecked application commit `2396f26`; both findings are closed.
- Independent tester results: 9 unit, 29 real-database integration, 20 feature pgTAP, and 3 Chromium
  tests passed. Actual authenticated API timeout measured 10,017ms, with safe unavailable result,
  no partial booking and successful same-key retry. These counts are overlapping suites, not a
  single combined total or proof that every manual acceptance clause has been exercised.
- Coordinator reran all database suites on the pristine disposable regression database: **44/44
  assertions across four files passed**, including existing browse/auth rules. Retained fictional
  integration data had previously broken a baseline global-count assertion; clean schema isolation
  resolved that test setup issue without changing the assertion.
- Full-project traceability passes: **72/169 criteria referenced**, with draft coverage warnings.
  STU-02 has **19/19 IDs referenced**; semantic coverage and unexecuted clauses are separately
  documented in the tester's acceptance matrix. Secret scan and tester handoff validation passed.
- Round 2 runner-integration finding: default Playwright discovers the new fixture-bearing suite,
  but original CI uses API54321 while its defaults target disposable API55321. Coordinator assigned
  bounded CI/runner wiring to developer, preserving all tests and requiring explicit isolated
  targets. This expands the original plan's CI exclusion only for test execution wiring; CI changes
  remain sensitive and need human review. GitHub execution itself is not locally verified.
- Remaining verification work at this checkpoint: reconcile final runner changes and final reviewer
  evidence; browser unauthorized-actor/pre-write-outage cases; actual manual 200% zoom/readability.

Review artifacts: `workflow/handoffs/stu-02/tester.md`,
`workflow/handoffs/stu-02/developer.md`, `workflow/reviews/stu-02/security-review.md`.

## Implementation request (verbatim, requested by Joseph)

```text
Continue implementing feature 2.

Complete its implementation and verification using the workflow below. Log the prompt i gave u in my logs under joseph



For feature 2, retain our developer-as-generator and
tester/security-reviewer-as-verifiers workflow.

Apply these improvements from feature 1:

1. Before further implementation, check this feature's spec against
   relevant shared specs for conflicting permissions, response fields,
   and unresolved decisions. Escalate blocking contradictions.

2. Identify this feature's acceptance criteria and shared dependencies.
   Report scoped traceability separately from full-project coverage.
   Do not hide uncovered requirements or weaken checks.

3. Prepare a disposable test database and authenticated role fixtures
   where needed. Clearly report anything unavailable.

4. Require verifiers to validate their test setup and assertions before
   reporting an implementation defect.

5. Have both reviewers identify the implementation commit reviewed.
   After fixes, recheck affected behaviour and reconcile their final
   reports against the final code version.

Keep the existing review-round limit and human approval gates.
Record actual findings, test defects, coordination problems,
verification gaps, and results for comparison with feature 1.
```

Implementation baseline: `668e7435805b3aec1140653b8ea12d14e2380a68`. Existing uncommitted STU-02
specification/documents are preserved. Preflight must distinguish reported team approval from stale
draft metadata, and verification must distinguish acceptance coverage from full-project traceability.

## Implementation session — setup and preflight

- Joseph interrupted and resumed the run. On resume the baseline was
  `56209dd58dfefb2f7d31c93488cf980490f95e79` (the specification was committed between turns).
- Requirements architect found no blocking slice contradiction; report:
  `workflow/reviews/stu-02/preflight.md`. Frozen approved specification digest:
  `fa2e3f2e68810ad6ab5e1603a753b21bd8c4c384`.
- Initial scoped coverage: 0/19 STU-02 criteria; full project: 53/169 referenced. `check:spec`
  correctly failed for the 19 uncovered approved criteria. No enforcement was weakened.
- Started disposable Supabase project `stu02-disposable-u65dd8`, API port 55321/database port 55322,
  under `/tmp/stu02-verify.U65dd8`; existing development stack was not reset or migrated.
- Baseline three migrations applied successfully to the empty disposable database. Tester owns fake
  role/slot fixtures and validates identity/eligibility before defect claims.
- Tester first ran six actual database tests: fixture identity checks passed, then all six failed
  because the not-yet-implemented `get_request_slot(uuid)` function was absent. This is expected
  tests-first evidence, not an implementation defect.
- Developer then created the request implementation and new migration. The new migration applied
  successfully to the disposable database and was frozen; later fixes must append migrations.
- Browser setup issue: a second Next dev server in the existing checkout refused the existing user's
  running server lock. Created an isolated runtime source copy excluding `.env*`, `.git`, and build
  output, with explicit disposable API environment. A dependency symlink then failed Turbopack's
  filesystem boundary; replaced only that temporary symlink with a local cloned dependency copy.
  These are test-environment failures, not product defects.

## Round 1 — implementation and independent verification

- Generator froze implementation commit `afe888c544ae00cc8fe147e9cc9476424a50bf49`. Coordinator
  created this local review commit; it was not pushed, merged or deployed.
- Tester verified its RPC mock against the actual Supabase fluent builder. Three initial unit failures
  were mock defects (missing `.abortSignal()`), corrected in tester-owned code; seven boundary tests
  then passed. Generator did not edit verifier tests.
- Two browser setup problems were identified: 50 seeded earlier slots required more than one 20-slot
  page; corrected fixture to 20. Then Next dev hydration failed at `127.0.0.1:3102`; a separate
  diagnostic confirmed React attached correctly at `localhost:3102`, and the corrected browser flow
  passed. These were not classified as implementation defects.
- Confirmed functional findings: `F-TV02-01` high, native form fallback puts topic/questions in the
  URL; `F-TV02-02` medium, request lookup timestamps use `+00:00` rather than shared canonical `Z`.
  Both were routed to developer fix round 1, preserving the two-round limit and append-only migrations.
- Functional browser success covered authenticated later-page selection, no GET reservation, stale
  details and explicit re-review, real cross-origin action rejection, discarded committed response,
  same-intent recovery, pending confirmation and fresh-browse removal. Native fallback regression failed.
- Initial integration tests passed 17/17; new UTC regression failed as expected. Initial request pgTAP
  passed 15/15. Scoped semantic status is documented by the tester; label presence is not a full pass.
- Full pgTAP first ran against accumulated disposable fixtures and failed STU-01's global booking count
  (22 rather than 5). A separate empty schema-only database isolated this baseline assumption:
  all 4 files / 39 assertions passed. No STU-01 test was weakened. Initial schema clone failed owner
  permissions; a new empty clone with the local Supabase database owner succeeded. `pg_prove` was not
  installed in the DB container, so the existing Supabase test runner executed the clean database.
- Security-review agent spawning hit the collaboration thread limit. An independent native Codex
  read-only session used the existing security-reviewer instructions. It inspected the same commit,
  ran 11 focused units and found no confirmed static defect, while explicitly leaving live security
  evidence and effective database timeout unresolved. Its initial ordinary Vitest invocation was
  blocked by read-only temporary-bundle writes; its supported no-bundle invocation passed.
  Original report is retained in `workflow/reviews/stu-02/security-review.md`.
- Coordinator checks: lint/typecheck passed; unit suite 37 passed, 4 todo, 1 skipped file;
  workflow tests 23 passed; isolated production build passed; secret scan passed. Full-project
  traceability passed at 72/169 referenced, with existing draft gaps. STU-02 has 19/19 named criteria,
  but this is separate from semantic/test-execution completion.
- Sensitive classifier with explicit baseline correctly requires migration review. Default invocation
  saw only the post-commit worktree and missed the committed migration; use `--base=56209dd...`.
- Formatting tools do not support SQL in this repository; passing an explicit `.sql` path produced
  a no-parser error, not an SQL syntax defect. SQL was validated by actual PostgreSQL execution.

Generated summary awaiting human verification.

## Assignment and baseline

- Task: `STU-02-SPEC`.
- Requester: Joseph, explicitly using the feature-specification skill.
- Role: `requirements_architect`, assigned to draft a request-only feature specification, separate
  bounded implementation plan, challenge evidence, and current handoff.
- Inspected repository baseline: `668e7435805b3aec1140653b8ea12d14e2380a68`; working tree was clean
  before this task.
- Specification and shared dependencies remain draft; no approval or implementation is claimed.

## Scope

A Student selects an available slot, reviews its trusted course/Lecturer/time, enters topic and
questions, and submits a pending request for Lecturer approval. The specification covers trusted
ownership, reservation, overlapping-booking prevention, concurrent submissions, validation, safe
retry/recovery, minimal confirmation, and refusal to call AI or let generated text authorize a booking.
Listing, editing, cancellation, Lecturer decisions, and improve-request AI remain separate work.

The existing database already has booking records and a unique active reservation index. It has no
Student mutation API, and the browse page currently has no request form/link. Database-enforced Student
overlap prevention, retry handling, and the request UI are planned work, not completed work.

## Evidence and decisions

- Canonical draft: `workflow/specs/student/STU-02-request-consultation.md`.
- Separate plan: `workflow/plans/stu-02-request-consultation.md`.
- Challenge and decision list: `workflow/reviews/stu-02/specification-challenge.md`.
- Current results and handoff: `workflow/handoffs/stu-02/latest.md`.
- Topic/questions limits, interval boundary semantics, and idempotency behavior are explicitly proposed
  for review where existing shared requirements do not decide them.

No application code, executable tests, database migrations, approval records, merges, or deployments
are part of this specification task.

## Actual specification checks

- `npm run check:spec`: passed; 17 specs, 169 criteria, 53 covered. The 19 new STU-02 criteria are
  draft warnings, not implemented/tested behavior.
- Initial formatting check found table formatting issues; only the assigned generated documents were
  formatted, and the final targeted check passed.
- Acceptance criteria use the repository's bold-list convention so its existing checker recognizes
  them; no checker or test was changed.
- Handoff schema validation and `git diff --check`: passed.
- Application/database/browser tests: not run for this specification-only task.
- Self-review is recorded; independent challenge and human review have not occurred.

## Subsequent team approval report — 2026-10-18

Joseph confirmed that the whole team reviewed and approved all current specifications for
implementation, including STU-02's proposed decisions. This supersedes the earlier pending human
review statements above. Approval source is Joseph's conversation report; individual reviewers and
external PR approval were not independently verified. Current STU-02 and shared dependency digests
are recorded in `workflow/handoffs/stu-02/latest.md`. Spec frontmatter was not changed by this
recording-only update. Joseph's instruction not to start coding remains in effect.
