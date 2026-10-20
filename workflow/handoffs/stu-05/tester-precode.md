# Handoff: STU-05 pre-code acceptance tests — tester_verifier → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "STU-05-PRECODE-TESTS",
"requirementIds": [
"STU-05-AC1",
"STU-05-AC2",
"STU-05-AC3",
"STU-05-AC4",
"STU-05-AC5",
"STU-05-AC6",
"STU-05-AC7",
"STU-05-AC8",
"STU-05-AC9",
"STU-05-AC10",
"STU-05-AC11",
"STU-05-AC12",
"STU-05-AC13",
"STU-05-AC14",
"STU-05-AC15",
"SH-01-AC6",
"SH-01-AC7"
],
"status": "incomplete",
"changedFiles": [
"src/lib/ai/client.test.ts",
"src/lib/ai/quota.test.ts",
"src/features/student/bookings/improve-request-verification.test.ts",
"tests/e2e/student-improve-request.spec.ts",
"workflow/handoffs/stu-05/tester-precode.md",
"logs/joseph/stu-05.md"
],
"verification": [
{
"check": "npm run check:spec",
"result": "passed",
"evidence": "19 specs, 196 criteria, 100 covered; all STU-05 AC1–AC15 now have non-todo test references. Draft-spec warnings remain."
},
{
"check": "npm run typecheck",
"result": "passed",
"evidence": "next typegen and tsc --noEmit completed successfully."
},
{
"check": "targeted Vitest STU-05 tests",
"result": "failed",
"evidence": "11 expected pre-code failures: quota decision remains TODO/placeholder and improve-request Server Action does not exist. One documentary AC15 check passed."
},
{
"check": "Playwright collection",
"result": "blocked",
"evidence": "The repository correctly refused E2E collection without all four explicit disposable STU02_TEST target variables. No target was invented."
},
{
"check": "git diff --check",
"result": "passed",
"evidence": "No whitespace errors were reported before the E2E guard stopped the chained command."
}
],
"unresolvedIssues": [
"STU-05 implementation and durable accounting migration are absent, so the pre-code acceptance suite is intentionally red.",
"The test contract currently establishes only deterministic checks; live model evaluation remains manual, opt-in, synthetic, and unexecuted."
]
}

<!-- HANDOFF:END -->

## Scope

- Approved spec: `workflow/specs/student/STU-05-improve-request.md`, digest
  `74eeb61f192e0073343fed708ad694b671268fbc`.
- Test-only scope used: `src/lib/ai/*.test.ts`,
  `src/features/student/bookings/*.test.ts`, `tests/e2e/student-improve-request.spec.ts`, this handoff,
  and the task log. No application code, migration, specification, CI, or policy changed by this task.

## Test matrix

| Requirement           | Check                                                     | Result     | Evidence                                                                                             |
| --------------------- | --------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| AC1, AC2, AC5         | Action module and direct authorization/input contract     | failed     | `improve-request-server.ts` is absent; tests fail with the intended precise contract message.        |
| AC3, AC6, AC12        | UI advice, literal output and manual fallback             | unexecuted | E2E is collection-blocked without the disposable target; current UI lacks the specified control.     |
| AC4                   | Gateway cap contract                                      | passed     | Source-inspection test confirms the existing 4,000-character, 600-token, and 20-second gateway caps. |
| AC7–AC10, SH-01-AC6   | Per-Student/global rate and daily quota contracts         | failed     | `decideQuota` throws TODO; defaults are 30/day and 20 global/minute; global daily cap is absent.     |
| AC11, AC14, SH-01-AC7 | One in-flight reservation, failure release/reconciliation | failed     | Required action/accounting boundary is absent.                                                       |
| AC13                  | Minimal usage metadata                                    | failed     | Required action source is absent; no implementation review possible.                                 |
| AC15                  | Live evaluation remains opt-in/synthetic/advisory         | passed     | Spec wording is asserted; no live model request ran.                                                 |

## Confirmed pre-code findings

1. **High — AC7–AC10 / SH-01-AC6:** `decideQuota` is explicitly unimplemented and current defaults do
   not match the approved 10 Student successes/day, 500 global successes/day, and 10 global/minute
   policy. Reproduction: run the targeted Vitest command below.
2. **High — AC1–AC3, AC5–AC6, AC11–AC14 / SH-01-AC7:** the specified STU-05 Server Action and UI do
   not exist. Reproduction: the action-contract test dynamically loads the named module and reports its
   missing path without breaking test collection.

These are pre-existing implementation gaps, not regressions introduced by this tester-only task.

## Next action

Developer should implement the approved Server Action, UI, and append-only accounting migration against
these tests; then the tester should replace broad contract assertions with mocked action and disposable
database fixture assertions and re-run the complete suite.
