---
id: PLN-01
title: Specification, implementation, and validation plan
owner: team
status: draft
---

# PLN-01: Specification, implementation, and validation plan

## Purpose

This plan decomposes the umbrella specifications into reviewable work. It is an execution plan, not
authorization to implement a feature: every feature task first needs a smaller spec under
`workflow/specs/{shared,student,lecturer,admin}` with human-approved status and testable acceptance
criteria.

## Required order

```text
umbrella draft review
→ detailed feature spec
→ human approval
→ acceptance/security tests
→ implementation and unit tests
→ independent tester_verifier and security_reviewer review
→ documentation and handoff
→ pull request and CI
→ development deployment
→ release review
→ production approval and deployment
```

Requirement changes follow spec → tests → code. Agents may draft or implement according to their
role, but only humans approve specs, pull requests, and production deployment.

## Work breakdown and progress

| ID  | Work item                                                                                         | Owner                 | Depends on                  | Required evidence                                       | Status               |
| --- | ------------------------------------------------------------------------------------------------- | --------------------- | --------------------------- | ------------------------------------------------------- | -------------------- |
| P0  | Review these five umbrella documents and resolve open questions                                   | Team                  | None                        | Human decisions and approved/revised drafts             | In review            |
| P1  | Finalize shared authentication, role, RLS, and AI-gateway spec (`SH-01`)                          | Shared                | P0                          | Approved spec; AC-linked unit/database/E2E tests        | Draft exists         |
| P2  | Specify shared courses, lecturer assignments, slots, bookings, state transitions, and concurrency | Shared/lecturer       | P0, P1                      | Approved shared child specs and schema review           | Not started          |
| P3  | Specify and implement student slot browsing and filters                                           | Student owner         | P2                          | Student spec, tests, handoffs, guide update             | Not started          |
| P4  | Specify and implement student request/list/edit/cancel flows                                      | Student owner         | P2                          | Student spec, concurrency/access tests, handoffs        | Not started          |
| P5  | Specify and implement student improve-request AI                                                  | Student owner         | P1, P4                      | AI/security spec, injection/failure tests, handoffs     | Not started          |
| P6  | Specify and implement lecturer availability management                                            | Lecturer owner        | P2                          | Lecturer spec, overlap/database tests, handoffs         | Not started          |
| P7  | Specify and implement lecturer decisions, upcoming view, and completion                           | Lecturer owner        | P2, P4, P6                  | Lecturer spec, transition/access tests, handoffs        | Not started          |
| P8  | Specify and implement lecturer briefing AI                                                        | Lecturer owner        | P1, P7                      | Data-scope/injection/failure tests, handoffs            | Not started          |
| P9  | Specify and implement administrator account management                                            | Administrator owner   | P1                          | Admin spec, privilege/deactivation tests, handoffs      | Not started          |
| P10 | Specify and implement courses and lecturer assignments                                            | Administrator owner   | P2, P9                      | Admin spec, integrity/access tests, handoffs            | Not started          |
| P11 | Specify and implement announcements and student reading view                                      | Administrator/student | P1                          | Admin/shared spec, publication/access tests             | Not started          |
| P12 | Specify and implement aggregate statistics                                                        | Administrator owner   | P2, P7                      | Admin spec, aggregation/privacy tests                   | Not started          |
| P13 | Specify and implement administrator activity-summary AI                                           | Administrator owner   | P1, P12                     | Aggregate-only prompt tests, failure tests              | Not started          |
| P14 | Perform cross-role security and concurrency review                                                | Tester-security       | P3–P13                      | Findings, adversarial tests, resolved high findings     | Not started          |
| P15 | Complete user guide, developer guide, product website, logs, and reflections                      | Team                  | Continuous; final after P14 | Reviewed documents matching the release                 | Started placeholders |
| P16 | Validate development and production deployment separation                                         | Administrator/shared  | P14, P15                    | Passing CI, dev smoke test, human-approved prod release | Pipeline exists      |

## Proposed detailed specs

The analyst should create these individually as work begins; identifiers are reserved here for
planning and may be adjusted during review.

| Proposed ID | Area          | Scope                                                           |
| ----------- | ------------- | --------------------------------------------------------------- |
| SH-02       | Shared        | Courses and lecturer assignments                                |
| SH-03       | Shared        | Slots, bookings, state transitions, and concurrency constraints |
| STU-01      | Student       | Browse and filter available slots                               |
| STU-02      | Student       | Request, view, edit, and cancel bookings                        |
| STU-03      | Student       | Improve-request AI                                              |
| LEC-01      | Lecturer      | Create, edit, and delete availability                           |
| LEC-02      | Lecturer      | Review, decide, view, and complete consultations                |
| LEC-03      | Lecturer      | Consultation-briefing AI                                        |
| ADM-01      | Administrator | Accounts and roles                                              |
| ADM-02      | Administrator | Courses and lecturer assignments                                |
| ADM-03      | Administrator | Announcements and guidelines                                    |
| ADM-04      | Administrator | Booking statistics                                              |
| ADM-05      | Administrator | Activity-summary AI                                             |

## Definition of ready

A feature may enter implementation only when:

- Its detailed spec status is `approved` by a named human reviewer.
- Behaviour, permissions, data, failure cases, AI boundaries, and out-of-scope behaviour are explicit.
- Every acceptance criterion is observable and testable with concrete Given/When/Then conditions.
- Dependencies and migrations are identified, including review for shared files.
- Open questions capable of changing implementation are resolved.

## Definition of done

A feature is done only when:

- Acceptance, security, and unit tests reference the approved criteria and pass.
- Lint, type checking, unit tests, traceability, build, database lint/tests, and applicable Playwright
  tests pass.
- The tester_verifier and security_reviewer have recorded findings, and all high-severity findings
  are resolved.
- No unauthorized shared-area changes or migration edits remain.
- User/developer documentation, interaction-log summary, and agent handoffs match the behaviour.
- A human has reviewed the pull request.

## Validation strategy

- Unit tests: validation, state-transition, filtering, quota, sanitization, and aggregation logic.
- Database tests: RLS boundaries, constraints, triggers, active-booking uniqueness, and overlap rules.
- End-to-end tests: representative role journeys, direct URL/action denial, conflicts, AI fallback, and
  generated-script rendering.
- Manual review: usability, truthful AI wording, data minimization, docs accuracy, environment
  separation, and production approval evidence.

## Risks and mitigations

| Risk                                       | Mitigation                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Scope is too large for the deadline        | Approve and deliver vertical slices in dependency order; AI remains optional to core booking        |
| Concurrent booking creates duplicates      | Enforce invariants in PostgreSQL and test simultaneous requests                                     |
| Stored prompt injection crosses roles      | Wrap every free-text source, minimize prompt data, validate/render output as plain text             |
| Agent changes requirements while coding    | Freeze approved specs; requirement changes return to analyst and human review                       |
| Tests mirror wording but miss intent       | Independent tester_verifier and security_reviewer add adversarial and direct-action/database checks |
| Dev credentials reach production or agents | Separate GitHub environments, least privilege, secret scanning/review, human prod gate              |
| Docs drift from release                    | Treat guide updates as definition-of-done evidence and verify before release                        |

## Acceptance criteria

- **PLN-01-AC1** Given any feature implementation task, when work begins, then an approved detailed
  spec and analyst handoff exist and all implementation-affecting questions are resolved.
- **PLN-01-AC2** Given a requirement change after approval, when the change is accepted, then the spec
  changes first, its tests change second, and implementation changes last with new review evidence.
- **PLN-01-AC3** Given a feature pull request, when it is proposed for merge, then its acceptance
  criteria map to non-skipped tests and its developer, tester_verifier, and security_reviewer
  handoffs record results.
- **PLN-01-AC4** Given a release candidate, when production deployment is requested, then all required
  CI checks pass, documentation matches the candidate, high-severity findings are closed, and a human
  reviewer approves the production environment.

## Open questions blocking plan approval

- Resolve every product decision listed in `PRODUCT-SPEC.md` that affects booking permissions or
  state transitions.
- Confirm the final division of shared work and required reviewers.
- Confirm which detailed specs form the minimum first release if schedule pressure requires staging.
- Confirm GitHub Pages ownership and how release documentation is verified against production.

## Change log

| Date       | Change               | By      |
| ---------- | -------------------- | ------- |
| 2026-10-17 | First execution plan | analyst |
