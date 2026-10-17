<!-- Feature PRs target `develop`. Only release PRs (develop → master) target `master`. -->

## Spec

- Spec: `workflow/specs/...` (status: approved)
- Acceptance criteria covered:
- Handoff notes: `workflow/handoffs/...`

## Changes outside my area

<!-- src/lib/, supabase/migrations/, .github/ — "None" if none -->

## Checklist

- [ ] Every new Server Action / Route Handler calls `requireRole`
- [ ] AI calls go through `generateText`, user text is wrapped with `wrapUntrusted`, output is shown as plain text
- [ ] No secrets, `.env` contents or real student data in code, tests or logs
- [ ] Tests reference acceptance criteria and `npm run check:spec` passes
- [ ] User Guide / Developer Guide updated for any visible change
- [ ] Session log summary added under `logs/<name>/`
