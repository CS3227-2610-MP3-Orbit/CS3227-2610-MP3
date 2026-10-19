# STU-04 pre-code acceptance-test handoff

<!-- HANDOFF:BEGIN -->

{
  "schemaVersion": 1,
  "taskId": "STU-04-TEST-PRECODE",
  "requirementIds": ["STU-04-AC1", "STU-04-AC2", "STU-04-AC3", "STU-04-AC4", "STU-04-AC5", "STU-04-AC6", "STU-04-AC7", "STU-04-AC8", "STU-04-AC9", "STU-04-AC10", "STU-04-AC11", "STU-04-AC12"],
  "status": "incomplete",
  "changedFiles": ["supabase/tests/student_manage_bookings.test.sql", "tests/e2e/student-manage-bookings.spec.ts", "workflow/handoffs/stu-04/tester-precode.md", "logs/joseph/stu-04.md"],
  "verification": [
    {"check": "npm run check:spec", "result": "passed", "evidence": "84 covered criteria; approved STU-04 AC1–AC12 now have test references. Draft-spec warnings remain."},
    {"check": "npx supabase test db --local supabase/tests/student_manage_bookings.test.sql", "result": "failed", "evidence": "Expected red baseline: 4/8 pgTAP assertions failed because STU-04 list/detail/edit/cancel RPCs do not exist."},
    {"check": "npx playwright test --config tests/e2e/stu02.playwright.config.ts --list", "result": "blocked", "evidence": "The existing STU-02-specific config deliberately matches only student-request-consultation.spec.ts, so it did not collect the new STU-04 file."},
    {"check": "Targeted Prettier and git diff --check", "result": "passed", "evidence": "TypeScript browser test formatted; SQL has no configured Prettier parser; no whitespace errors."}
  ],
  "unresolvedIssues": ["The approved spec leaves RPC names proposed; test uses explicit proposed narrow names that developer/coordinator must reconcile before implementation.", "Existing default E2E configuration does not collect STU-04 tests; changing shared Playwright/CI configuration is outside this tester assignment.", "AC5/AC8 need two authenticated database connections and a Lecturer transition implementation before real concurrency assertions can run."]
}
<!-- HANDOFF:END -->

## Scope

- Task: `STU-04-TEST-PRECODE`.
- Approved specification digest: `9eafaec3a8a4a83ebd11beca09ecfd88ca7463b2`.
- Reviewed baseline: existing STU-02 migrations and request tests; no STU-04 implementation exists.
- Allowed paths: new STU-04 tests, this handoff, and the factual Joseph log.

## Test matrix

| Requirement | Check | Result | Evidence |
| --- | --- | --- | --- |
| AC1–AC3 | Narrow list/detail RPC contract; owned list/status projection browser expectations | failed / unexecuted | DB functions are absent; browser file is not collected by current STU-02-only config. |
| AC4–AC5 | Versioned, idempotent edit RPC contract | failed / unexecuted | `update_my_booking` absent; real concurrent edit tests require implementation. |
| AC6–AC8 | Versioned cancellation RPC contract and terminal/cancel race coverage | failed / unexecuted | `cancel_my_booking` absent; Lecturer transition is out of scope/not implemented. |
| AC9 | Direct booking reads/updates remain denied; signed-out browser route expectations | passed / unexecuted | Existing local DB denied direct table operations; browser file uncollected. |
| AC10 | Idempotent operation contract and browser conflict expectation | failed / unexecuted | Both mutating RPCs absent; browser file uncollected. |
| AC11 | 320px keyboard/focus browser expectation | unexecuted | Requires a config that collects STU-04 and implementation routes. |
| AC12 | Literal hostile-text browser expectation and no-AI contract through edit RPC | failed / unexecuted | Edit RPC absent; browser file uncollected. |

## Findings

- `F-STU04-PRE-01` — expected baseline failure: no STU-04 RPCs currently exist. This is not an implementation defect because no implementation was assigned yet.
- `F-STU04-PRE-02` — the repository's only dedicated Playwright config matches STU-02 only. The new STU-04 browser tests will not execute through it. A developer/coordinator must add/review shared test-runner integration without silently excluding the tests.

## Next action

Coordinator: assign the developer to reconcile the proposed RPC naming/interface, implement STU-04, and arrange approved shared E2E collection; then assign independent execution of the database/browser/concurrency tests.
