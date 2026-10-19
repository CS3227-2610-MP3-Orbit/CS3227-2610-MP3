# Workflow index

This is the starting point for current status. Detailed historical evidence remains in the linked
feature and archive directories.

| Area                            | Canonical source                                          | Current status                                                                   | Current handoff / next action                                                                              |
| ------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Project setup                   | `workflow/README.md`                                      | Agent roles, hooks, policies, templates, and CI guardrails exist                 | Records: `workflow/handoffs/project-setup/`                                                                |
| STU-01 — browse available slots | `workflow/specs/student/STU-01-browse-available-slots.md` | Four browse ambiguities resolved in draft; implementation/test alignment remains | `workflow/handoffs/stu-01/latest.md`; review clarified specs, then add acceptance fixtures and option caps |
| Shared SH-01–SH-05              | `workflow/specs/shared/`                                  | Draft after requirement-boundary and traceability revisions                      | Review records: `workflow/reviews/stu-01/`                                                                 |

## Directory convention

### Student request consultations

- Approved specification: `workflow/specs/student/STU-02-request-consultation.md`.
- Implementation: local application commit `2396f26`; both round-1 findings fixed and rechecked.
- Bounded plan: `workflow/plans/stu-02-request-consultation.md`.
- Current handoff: `workflow/handoffs/stu-02/latest.md`.
- Reviews: `workflow/reviews/stu-02/preflight.md`, `workflow/reviews/stu-02/security-review.md`,
  and `workflow/handoffs/stu-02/tester.md` (independent acceptance matrix and remaining gaps).
- Joseph's log: `logs/joseph/stu-02.md`.
- Scope: create a pending request only; listing, editing, cancellation, and AI assistance are deferred.

### File locations

- Current feature status: `workflow/handoffs/<feature-id>/latest.md`
- Detailed active reviews: `workflow/reviews/<feature-id>/`
- Superseded handoffs: `workflow/handoffs/archive/<feature-id>/`
- Project-wide setup: `workflow/handoffs/project-setup/` and `workflow/reviews/project-setup/`
- Owner's consolidated feature log: `logs/<name>/<feature-id>.md`
- Owner's original detailed logs: `logs/<name>/archive/<feature-id>/`
