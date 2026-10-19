# Workflow index

This is the starting point for current status. Detailed historical evidence remains in the linked
feature and archive directories.

| Area                            | Canonical source                                          | Current status                                                                   | Current handoff / next action                                                                              |
| ------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Project setup                   | `workflow/README.md`                                      | Agent roles, hooks, policies, templates, and CI guardrails exist                 | Records: `workflow/handoffs/project-setup/`                                                                |
| STU-01 — browse available slots | `workflow/specs/student/STU-01-browse-available-slots.md` | Four browse ambiguities resolved in draft; implementation/test alignment remains | `workflow/handoffs/stu-01/latest.md`; review clarified specs, then add acceptance fixtures and option caps |
| Shared SH-01–SH-05              | `workflow/specs/shared/`                                  | Draft after requirement-boundary and traceability revisions                      | Review records: `workflow/reviews/stu-01/`                                                                 |

## Directory convention

- Current feature status: `workflow/handoffs/<feature-id>/latest.md`
- Detailed active reviews: `workflow/reviews/<feature-id>/`
- Superseded handoffs: `workflow/handoffs/archive/<feature-id>/`
- Project-wide setup: `workflow/handoffs/project-setup/` and `workflow/reviews/project-setup/`
- Owner's consolidated feature log: `logs/<name>/<feature-id>.md`
- Owner's original detailed logs: `logs/<name>/archive/<feature-id>/`
