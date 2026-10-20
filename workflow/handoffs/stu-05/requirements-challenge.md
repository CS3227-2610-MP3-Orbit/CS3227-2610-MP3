# Handoff: STU-05 independent specification challenge — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "STU-05-APPROVAL-R2",
"requirementIds": ["STU-05-R1", "STU-05-R2", "STU-05-R3", "STU-05-R4", "STU-05-R5", "STU-05-R6", "STU-05-R7", "STU-05-R8", "STU-05-AC1", "STU-05-AC15", "SH-01-R6", "SH-01-AC6", "SH-01-AC7"],
"status": "passed",
"changedFiles": ["workflow/reviews/stu-05/independent-specification-challenge.md", "workflow/handoffs/stu-05/requirements-challenge.md"],
"verification": [
{"check": "Independent specification/code/test/policy inspection", "result": "passed", "evidence": "Found the daily-reservation/midnight and metadata-retention decisions; Joseph has now resolved both, while test-strengthening and implementation gaps remain."},
{"check": "npx prettier --check assigned STU-05 revision artifacts", "result": "passed", "evidence": "All assigned revision artifacts use Prettier style."},
{"check": "npm run check:spec", "result": "passed", "evidence": "19 specs, 196 criteria, 100 covered; warnings are draft-spec warnings only."},
{"check": "git diff --check", "result": "passed", "evidence": "No whitespace errors were reported."}
],
"unresolvedIssues": [
"Tester correction required: current STU-05 pre-code tests are insufficiently assertive for key authorization/accounting/security requirements."
]
}

<!-- HANDOFF:END -->

## Status

passed

## Scope

- Task: `STU-05-SPEC-CHALLENGE`.
- Requirements: `STU-05-R1`–`R8`, `STU-05-AC1`–`AC15`, `SH-01-R6`, `SH-01-AC6/7`.
- Prior version reviewed: STU-05 approved digest reported by the coordinator,
  `74eeb61f192e0073343fed708ad694b671268fbc`; revised team-reviewed draft digest
  `e871e34b126b0e624e1b88f06f47eac917e548c2`; final approved digest
  `a8f8c94cffa58bcf88d5721dd211027a4713b98b`.
- Inspected: `AGENTS.md`; STU-05, SH-01, STU-02 and shared product/technical/integration specs;
  policies; tester pre-code handoff/tests; `src/lib/ai/client.ts`, `src/lib/ai/quota.ts`; initial
  `ai_usage` migration; request form/action/validation boundaries.
- Allowed edits used: this handoff and `workflow/reviews/stu-05/independent-specification-challenge.md` only.

## Proposed decisions and assumptions

Confirmed: authorization must precede model/accounting access; only unsaved topic/questions reach the
model; daily successes, minute admissions, no automatic retry, literal output, and manual booking
fallback are intended.

Assumptions: none added as implementation authority.

Resolved decisions: reserve daily capacity at admission and attribute valid outputs to the original
admission day; retain allowed minimal usage metadata for no more than 30 days. Joseph now reports the
team approved the revised draft; identities and remote review evidence are unverified.

## Artifacts

- `workflow/reviews/stu-05/independent-specification-challenge.md`: independent challenge findings,
  counterexamples, resolved dispositions, and readiness recommendation.
- `workflow/handoffs/stu-05/requirements-challenge.md`: revised structured coordinator handoff.

## Evidence

- Read-only inspection commands completed successfully for the specifications, policies, AI gateway/quota
  implementation, existing migration, pre-code tests, request form/action, and handoff.
- Targeted Prettier, `npm run check:spec`, and `git diff --check` passed.
- No application/unit/database/browser test, migration, credential, network, merge, or deployment command was run.

## Risks and unresolved questions

1. **High:** Tester must strengthen pre-code assertions/fixtures; otherwise success can be reported with
   missing authorization, provider-call, or accounting guarantees.
2. **High:** Existing client accounting/logging must be replaced as a shared sensitive integration task,
   not bypassed by feature UI code.
3. **Medium:** Cleanup scheduling is an implementation design that must reliably enforce the confirmed
   30-day deletion limit.

## Next action

Coordinator should sequence tester test strengthening before shared gateway/migration implementation.

Handoff evidence: workflow/handoffs/stu-05/requirements-challenge.md
