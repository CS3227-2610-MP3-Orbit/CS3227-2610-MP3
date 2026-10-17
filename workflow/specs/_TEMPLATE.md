---
id: XXX-NN
title: Short feature name
owner: name
status: draft
---

<!--
id prefixes: SH (shared), STU (student), LEC (lecturer), ADM (administrator).
status: draft -> reviewed -> approved -> implemented.
Once a spec is approved, CI requires a test for every acceptance criterion.
Any requirement change is made here first, then in tests, then in code.
-->

# XXX-NN: Short feature name

## Context

Who needs this and why. One short paragraph.

## Behaviour

What the user can do, step by step, including what they see.

## Permissions

Who may do this, and what must be refused. Checked on the server, not only in the UI.

## Data

Tables and columns read or written. Any schema change needs a migration.

## Failure cases

Invalid input, conflicts, missing permissions, AI unavailable, and what the user sees for each.

## AI behaviour (if the feature uses the SoC LLM)

- Input sent to the model, and which parts are untrusted
- What the model must never do or reveal
- How the output is validated before use
- What happens when the AI fails or the quota is reached

## Acceptance criteria

Each criterion is testable. Tests reference it by ID in their name, e.g. `it("[XXX-NN-AC1] ...")`.

- **XXX-NN-AC1** Given ..., when ..., then ...

## Out of scope

## Open questions

## Change log

| Date | Change | By  |
| ---- | ------ | --- |
