# Handoffs

Handoffs are grouped by purpose so the root does not become a chronological file dump.

- `stu-01/latest.md` is the current summary for the Student browse-slots feature.
- `project-setup/` contains project-wide agent, specification, hook, and guardrail setup records.
- `archive/<feature-id>/` preserves superseded feature handoffs and detailed review rounds.
- `_TEMPLATE.md` is the required structure for a new handoff.

For future feature work, keep one `<feature-id>/latest.md` summary. Put detailed active records under
that feature directory and move superseded records to `archive/<feature-id>/`. Do not delete old
evidence. Nested handoff paths are supported by the repository's handoff validator.
