# Specification challenge record

- Feature and requirement IDs: `STU-01`, `STU-01-R1` through `STU-01-R8`, and
  `STU-01-AC1` through `STU-01-AC22`
- Draft spec path: `workflow/specs/student/STU-01-browse-available-slots.md`
- Draft commit or content digest: content digest
  `13fb2e0693210f4a97e75b395b167d2cf3f3d4f8`; repository commit inspected: `9dae2a0`
- Original request/reference: initialize the first Student feature, “Browse and filter available
  slots,” defining user behaviour, acceptance criteria, failure cases, data access, permitted AI
  actions, and abuse cases
- Shared constraints reviewed: `AGENTS.md`; `PRODUCT-SPEC.md`, `TECHNICAL-SPEC.md`,
  `INTEGRATION-SPEC.md`, `SHARED-TECHNICAL-SPEC.md`, and `PLAN.md`; `SH-01-foundation.md`;
  development-security and approval-gate policies; current auth source, initial migration, pgTAP and
  Playwright tests; the source requirements handoff
- Review type: `independent`
- Reviewer or agent: `requirements_architect` challenge agent
- Date: 2026-10-17

This record is independent review evidence, not human approval. The source specification remains
`draft`, and no approved source or human approver is recorded.

## Classification of review inputs

### Confirmed

- The requested feature is a read-only Student capability to browse and filter available slots.
- The umbrella drafts call for future available slots, lecturer/course/date filters, server-side
  role checks, database access control, bounded reads, and no reliance on browser time.
- The current repository contains only the Student placeholder, shared authentication/profile
  foundation, and `profiles`/`ai_usage`; it has no course, assignment, slot, booking, or browse
  implementation.
- No AI operation belongs in slot browsing. The separate Student AI feature is “Improve my request.”

### Proposed

- Singapore time, strict future-start availability, active reference checks, 20-row cursor pages,
  deterministic ordering, and enumeration-resistant identifier handling are reviewable proposals in
  the draft. They are not approved business rules.
- A narrowly scoped database function appears compatible with projection-level data minimization,
  but selecting that design belongs in the shared data specification and is not decided here.

### Unresolved

- The eight questions already listed in the draft remain unresolved.
- The additional material findings below require clarification before the spec is implementation
  ready. This review does not select among the alternatives.

## Independently derived scenarios

### Happy paths

1. An active student opens the list with no filters and receives at most 20 future available slots in
   deterministic order, containing only the allowed projection.
2. The student filters independently by lecturer, course, or Singapore calendar date, combines all
   three, clears them, and traverses a second page without duplicate rows.
3. Rejected or cancelled historical bookings do not hide a still-future slot, subject to the final
   approved booking-state rules.

### Invalid-input paths

1. Reject malformed and non-canonical UUIDs, impossible calendar dates such as `2026-02-30`, unknown
   keys, malformed or overlong cursors, repeated parameters, arrays in scalar fields, arbitrary sort
   and limit fields, and an oversized overall query before any slot query.
2. A cursor created for one filter set is replayed with another filter set, edited, truncated, or
   replayed after its underlying last row becomes unavailable.
3. SQL-like, HTML-like, and instruction-like values remain inert input; they neither become query
   syntax nor invoke AI.

### Authorization and data-boundary paths

1. Signed-out, inactive, Lecturer, and Administrator actors try both page navigation and direct
   invocation of the browse boundary.
2. A Student supplies a claimed role, student ID, another user's ID, an inactive lecturer/course ID,
   or an identifier they are not entitled to discover.
3. A Student uses the Supabase client directly to select slot, booking, course, assignment, and
   profile columns outside the browse projection.
4. Filter-option endpoints or page data are inspected for inactive or otherwise inaccessible
   lecturers/courses and for fields not permitted in slot results.

### Concurrency and staleness paths

1. A slot is reserved, cancelled, rejected, deactivated, reassigned, inserted, or deleted between
   page one and page two.
2. A slot crosses `starts_at` between the database query and display.
3. A completed booking is attached to a future slot due to invalid legacy/corrupt state, testing
   whether database invariants—not the browse query alone—make that state impossible.
4. Two equal-start-time rows straddle a cursor while another equal-start-time row is inserted.

### Dependency-failure and recovery paths

1. The database is unavailable on initial load and after filters are applied; the UI exposes a safe,
   retryable state without losing or falsely applying filter state.
2. The authentication/profile lookup succeeds but the slot query fails, and no partial protected data
   is rendered or cached.
3. A retry after a temporary failure remains a read-only operation and does not duplicate or mutate
   anything.

### Accessibility paths

1. A keyboard-only user applies and clears every filter, moves through pages, and reaches retry.
2. A screen-reader user receives meaningful labels and announced loading, validation, empty, error,
   and pagination state.
3. Long course/lecturer names and localized times remain understandable at the approved viewport and
   zoom targets.

### Resource-abuse paths

1. A caller requests an unbounded limit, arbitrary date range, expensive sort, wildcard search,
   repeated keys, very long cursor, or oversized URL.
2. A caller rapidly walks cursors or repeatedly refreshes to scrape the catalogue; the response stays
   bounded and does not disclose totals or hidden fields.
3. Timing and response-shape comparisons between nonexistent, inactive, and inaccessible identifiers
   do not expose distinctions beyond the explicitly allowed availability signal.

### No-AI paths

1. Filters and stored display strings contain prompt-injection text or a fake model instruction;
   browsing performs no model or `ai_usage` operation.
2. The LLM provider is unavailable; browsing continues unchanged because it has no AI dependency.
3. No model output can rank, filter, authorize, or mutate browse results.

## Findings

| #   | Severity | Affected requirement/AC                                                   | Counterexample or question                                                                                                                                                                                                                                   | Why it matters                                                                                                                                          | Proposed clarification                                                                                                                                                                                                                  | Human input needed                                                                  | Disposition             |
| --- | -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------- |
| 1   | High     | `STU-01-R4`, `AC1`, `AC8`, `AC15`, `AC21`; open question 7                | May every active student browse every active course, or only enrolled courses?                                                                                                                                                                               | This changes the authorization predicate, schema, indexes, filter options, RLS/function contract, and test actors.                                      | **Proposal:** choose one visibility rule and define how unenrolled, nonexistent, and inactive course IDs behave.                                                                                                                        | Product owner/team must decide whether enrolment exists and is enforced.            | Open; blocks readiness. |
| 2   | High     | `STU-01-R4`, `AC8`, `AC21`; shared `SH-02`/`SH-03`                        | Table RLS controls rows but does not by itself limit columns. A policy that lets Students select available slot rows could still expose internal slot columns, while `AC21` requires direct reads outside the projection to be denied.                       | The phrase “RLS, or a narrowly scoped database function” permits materially different trust boundaries and can make `AC21` impossible under one design. | **Proposal:** the shared spec must select an exact database exposure model, name callable roles, revoke direct table access where needed, and define the safe projection.                                                               | Team must approve the RLS/view/function design before migration or tests.           | Open; blocks readiness. |
| 3   | High     | `STU-01-R2`, `AC6`, `AC7`; proposed decision 3; `INT-01` booking protocol | `INT-01` calls completed bookings inactive “for future reservation purposes,” while STU-01 says a completed booking never makes a slot reusable and relies on a future-state invariant. What should happen if a completed row exists on a future slot?       | Different readings return different availability and affect the shared state machine and integrity constraints.                                         | **Proposal:** reconcile the umbrella wording, define whether the database forbids completion before slot end, and specify browse behavior for impossible/legacy state.                                                                  | Team must settle completed-slot semantics in `SH-03` and revise conflicting drafts. | Open; blocks readiness. |
| 4   | High     | `STU-01-R4`, `R8.8`, `AC15`; availability rule                            | The absence of a formerly visible slot necessarily lets an observer infer that it is no longer available and may have an active booking. The draft simultaneously says attempts to infer private bookings through timing/returned results must be addressed. | An impossible confidentiality promise could produce an untestable criterion or misleading security claim.                                               | **Proposal:** explicitly define availability as an allowed disclosure while prohibiting booking identity, content, exact status, history, and distinct error shapes; do not promise constant-time behavior without a measurable target. | Product/security owner must approve the permitted inference boundary.               | Open; blocks readiness. |
| 5   | High     | `STU-01-R2`, `AC5`; proposed decision 2                                   | “Currently assigned” has no lifecycle definition. Is an assignment a row's existence, an active flag, or an effective date range, and what happens when an assignment is removed after slots were created?                                                   | This determines whether valid future slots disappear and which schema/constraint is required.                                                           | **Proposal:** define assignment lifecycle and its relationship to existing slots in `SH-02`/`SH-03`, then link STU-01 to that rule.                                                                                                     | Team must choose assignment semantics.                                              | Open; blocks readiness. |
| 6   | Medium   | `STU-01-R1`, `R3`, `AC13`; proposed decision 5                            | Page one and page two can observe different database states. Inserts, reservations, or filter changes can cause omissions or confusing cursor failures; the draft only requires no duplication.                                                              | Tests may assume a stable snapshot that the implementation does not provide, or an implementation may accept a cursor under different filters.          | **Proposal:** state whether pages are independent point-in-time reads, bind each cursor to the exact filter set/order, define stale-cursor behavior, and state that real-time completeness is not guaranteed.                           | Team must choose stale-cursor UX and snapshot expectations.                         | Open.                   |
| 7   | Medium   | `STU-01-R3`, `R6`, `R8.4`, `AC14`, `AC22`                                 | “Oversized,” “stable,” and “validated” are not measurable. `YYYY-MM-DD` does not by itself reject impossible dates; scalar duplicate/array parameters and cursor length are unspecified.                                                                     | Implementations can pass nominal tests while allowing query amplification or inconsistent parsing.                                                      | **Proposal:** specify maximum encoded input/query length, cursor lifetime/length or signed-schema rules, duplicate-key handling, canonical UUID policy, and calendar-valid date parsing.                                                | Team/security reviewer must approve proportionate bounds.                           | Open.                   |
| 8   | Medium   | `STU-01-R4`, `R5`, `AC2`, `AC3`                                           | Page navigation behavior is described, but direct boundary behavior for signed-out callers is not an AC; `AC3` permits either redirect or refusal for both pages and direct calls.                                                                           | A test can pass one branch while a direct callable boundary returns an unsuitable redirect/HTML response or leaks data.                                 | **Proposal:** split page and callable-boundary criteria and reference the project's exact typed `forbidden_or_not_found` contract for direct calls.                                                                                     | Team must confirm the transport-specific response contract.                         | Open.                   |
| 9   | Medium   | `STU-01-R1`, `R4`; open question 6                                        | Filter choices may list every active lecturer/course or only those represented by visible availability. Either choice can disclose catalogue membership or enable selecting values outside the result boundary.                                              | Filter-option data is part of the feature's read surface but has no permission, projection, empty/error, or acceptance contract.                        | **Proposal:** define the filter-option source, safe fields, role/enrolment scope, availability sensitivity, ordering, bounds, and failure behavior—or explicitly defer dynamic options.                                                 | Product owner must choose the filter-control/data behavior.                         | Open.                   |
| 10  | Medium   | All acceptance criteria; “Required future validation”                     | Verification methods are grouped by tool rather than mapped to each criterion. `AC20` says “database activity is inspected,” `AC22` combines many inputs, and `AC13` does not distinguish static-data ordering from concurrent churn.                        | A nominal traceability match may not prove the intended invariant, and compound criteria can partly pass.                                               | **Proposal:** add a criterion-to-method matrix; split compound outcomes; define deterministic fixtures, direct database checks, and mocked dependency failures.                                                                         | Spec author should revise after product decisions.                                  | Open.                   |
| 11  | Medium   | `STU-01-R6`; open question 8                                              | “Supported viewport sizes,” “understandable,” and keyboard operability lack an approved accessibility/browser target and measurable focus/announcement expectations.                                                                                         | These clauses cannot be verified consistently across reviewers.                                                                                         | **Proposal:** inherit a named shared target (for example, approved WCAG level/browser matrix) and state observable keyboard, focus, label, status-announcement, zoom, and responsive outcomes.                                          | Team must approve the shared accessibility and browser target.                      | Open.                   |
| 12  | Medium   | `STU-01-R5`, `AC17`                                                       | The generic retry state does not say whether selected filters remain visible, whether partial results are cleared, or what retry reissues. Logging is described but has no verification criterion.                                                           | Failure recovery could display stale protected data, silently reset user intent, or log unbounded sensitive input while still satisfying `AC17`.        | **Proposal:** define retained UI state, no-partial-data behavior, retry semantics, and a safe metadata-only logging criterion.                                                                                                          | Product/security owner should confirm recovery behavior.                            | Open.                   |
| 13  | Low      | Requirement sections and acceptance criteria                              | The draft globally labels its decisions proposed but does not give each normative requirement/criterion an explicit classification and source; some clauses derive from draft umbrella documents rather than approved sources.                               | Reviewers may mistake detailed language for confirmed business rules.                                                                                   | **Proposal:** add a compact requirement/source/classification matrix and keep every unresolved criterion proposed until human approval.                                                                                                 | Spec author/coordinator should improve provenance during revision.                  | Open.                   |

## Criteria that could pass while violating intent

- `AC8` can pass at the application response layer while a Student can still select additional table
  columns directly unless the database exposure model in finding 2 is fixed.
- `AC13` can pass against static fixtures while filter-switched or stale cursors skip data, duplicate
  data, or disclose ordering information under concurrent changes.
- `AC15` can compare response bodies while distinguishable status codes, headers, filter-option
  contents, or explicitly asserted timing behavior still enumerate records.
- `AC17` can show a generic message while retaining stale protected rows or losing the student's
  selected filters.
- `AC19` can observe no model call while an unintended AI dependency still reads/writes usage data;
  tests should assert both gateway/provider calls and `ai_usage` remain untouched.
- `AC20` can pass through application mocks without proving database read-only behavior; pgTAP or a
  transactional before/after assertion is needed.
- `AC22` can pass one listed payload while another client-controlled field expands scope because it
  bundles several abuse classes into one criterion.

## Challenge checklist

- [ ] Scope, non-goals, dependencies, and source-of-truth hierarchy are unambiguous.
- [ ] Confirmed requirements, proposed assumptions, and unresolved decisions are distinct.
- [ ] Requirements are observable, internally consistent, and testable.
- [ ] Actor, role, ownership, authorization order, and data visibility boundaries are complete.
- [ ] Inputs, outputs, trust boundaries, validation, and safe logging are defined.
- [ ] Empty, invalid, conflict, concurrency, dependency, quota, and recovery paths are covered.
- [ ] Resource bounds and abuse cases are proportionate and measurable.
- [x] AI context, injection, output, disclosure, capability, and side-effect boundaries are covered when relevant.
- [ ] Acceptance criteria could not pass while a material part of user intent is violated.
- [ ] Verification methods distinguish deterministic tests, manual checks, and live-model evaluations.
- [x] The spec avoids unnecessary implementation detail and scope.
- [x] Material open findings and required renewed approvals are explicit.

## Readiness recommendation

- Recommendation: `not ready`
- Blocking findings: findings 1 through 5; the source spec also records eight approval-blocking open
  questions and depends on unapproved/missing `SH-01`, `SH-02`, and `SH-03` contracts
- Residual risks: cursor behavior during concurrent change, unmeasurable resource/accessibility
  clauses, incomplete direct-boundary criteria, filter-option disclosure, and verification gaps
- Required human decisions: course-enrolment visibility; exact database projection boundary;
  completed-booking behavior; permitted availability inference; assignment lifecycle; timezone/date
  semantics; pagination/stale-cursor UX; filter-option population; resource limits; and shared
  accessibility/browser target
- Next review step: the coordinator should return these findings to the spec author, obtain the
  material product/security decisions, revise the draft without renumbering unchanged concepts, and
  request human review of the revised digest. Do not begin implementation.
