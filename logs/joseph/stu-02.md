# STU-02 — request a consultation

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
