<!-- Feature PRs target `develop`. Only release PRs (develop → master) target `master`. -->

## Spec

- Spec: `workflow/specs/...` (status: approved)
- Reviewed spec commit or content digest:
- Human spec reviewer (not the author):
- Acceptance criteria covered:
- Handoff notes: `workflow/handoffs/...`
- PR head commit reviewed:

## Changes outside my area

<!-- src/lib/, supabase/migrations/, .github/ — "None" if none -->

## Sensitive-change review

- Classifier result: required / not triggered
- Categories and paths:
- Independent reviewer required before merge: yes / no

## Checklist

- [ ] Every new Server Action / Route Handler calls `requireRole`
- [ ] AI calls go through `generateText`, user text is wrapped with `wrapUntrusted`, output is shown as plain text
- [ ] No secrets, `.env` contents or real student data in code, tests or logs
- [ ] Tests reference acceptance criteria and `npm run check:spec` passes
- [ ] `npm run verify -- --profile=app` results are recorded accurately
- [ ] Failed, blocked, and not-run checks are listed; none are presented as passed
- [ ] Material spec changes received renewed review; agent output is not counted as approval
- [ ] User Guide / Developer Guide updated for any visible change
- [ ] Session log summary added under `logs/<name>/`
