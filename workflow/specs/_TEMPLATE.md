---
id: XXX-NN
title: Short feature name
owner: name
status: draft
---

<!--
ID prefixes: SH (shared), STU (student), LEC (lecturer), ADM (administrator).
Frontmatter is the only canonical status field.
Existing status convention: draft -> reviewed -> approved -> implemented.
"reviewed" records review evidence; only a teammate can approve a material specification.
After approval, CI requires a test for every acceptance criterion.
Material changes proceed spec -> tests -> code and may invalidate prior approval.
Remove drafting comments when they no longer help reviewers.
-->

# XXX-NN: Short feature name

## Document control

- Spec owner:
- Reviewed commit or content digest:
- Prior approved commit or digest invalidated by this revision:
- Parent/shared requirements:
- Related plan and latest handoff:
- Confirmed requirements:
- Proposed assumptions requiring review:
- Unresolved decisions:

## Product and feature description

What the feature does, who needs it, why it exists, and the observable outcome it enables.

## Scope, non-goals, and dependencies

### In scope

### Non-goals

### Dependencies

Reference shared project definitions instead of duplicating them.

## Users, roles, and permissions

| Actor | Responsibility or goal | Allowed actions/data | Refused actions/data |
| ----- | ---------------------- | -------------------- | -------------------- |

State ownership rules and the trusted source of identity and role. UI hiding is not authorization.

## Functional requirements

### XXX-NN-R1 — Requirement name

- Classification: `confirmed` | `proposed` | `unresolved`
- Source: approved spec/user decision/reference, or reason this is only proposed

Describe observable required behavior. Keep implementation proposals separately labelled.

Use the same stable-ID, classification, and source fields for every normative UI, non-functional, data,
API, and security requirement below. Proposed or unresolved requirements and their criteria are review
targets, not implementation authority.

## Non-functional requirements

Include only relevant measurable constraints: accessibility, performance, capacity, reliability,
privacy, observability, compatibility, retention, or recovery. Explain briefly when none apply.

## UI description

Describe entry points, role-specific views, controls, loading/empty/success/error/conflict states,
validation feedback, accessibility behavior, and recovery interactions. This is not a visual design spec.

## Use cases

### UC1 — Use-case name

- Actors:
- Preconditions:
- Trigger:
- Main flow:
- Alternative and failure flows:
- Postconditions and invariants:

## Technical constraints and proposals

Separate fixed project constraints from optional implementation proposals. Put detailed task sequencing in
the linked plan, not here.

## Data model and integrity rules

List data read/written, ownership, visibility, lifecycle, invariants, concurrency rules, retention, and
required new migrations. Never edit an existing migration.

## API and boundary contracts

Define relevant Server Action, Route Handler, database, provider, or event inputs/outputs; authentication;
validation; idempotency; error mapping; and versioning. Mark proposed shapes as proposals.

## Security requirements

- Inherited mandatory controls and entry-point mapping (page layouts, Server Actions, Route Handlers,
  database boundaries, and model calls):
- Authorization order and role/ownership checks:
- Trusted and untrusted inputs:
- Input and output validation:
- Data disclosure and privacy boundary:
- Resource limits and abuse cases:
- Sensitive actions and approval requirements:
- Failure handling and safe logging:

Keep application security separate from coding-agent safeguards.

## AI behavior (only when applicable)

- Data allowed into model context and its minimization:
- Direct and stored indirect prompt-injection cases:
- Allowed model capabilities and prohibited side effects:
- Output validation and plain-text rendering:
- Authorization before the model call:
- Quota, timeout, provider failure, and live-evaluation behavior:

If no AI is used, say so and prohibit unintended model calls/data transfer where that matters.

## Edge cases and failure paths

| Condition | Required observable outcome | Invariant preserved |
| --------- | --------------------------- | ------------------- |

Include invalid input, permission failure, conflict/concurrency, unavailable dependencies, bounded load,
and AI abuse/failure cases where relevant.

## Acceptance criteria and verification

Tests reference these IDs exactly, for example `it("[XXX-NN-AC1] ...")`. Link each criterion to a
requirement and prefer observable outcomes over implementation-shaped assertions.

| ID         | Requirement | Given / when / then outcome   | Verification method                                  | Mocked or live                  |
| ---------- | ----------- | ----------------------------- | ---------------------------------------------------- | ------------------------------- |
| XXX-NN-AC1 | XXX-NN-R1   | Given ..., when ..., then ... | unit / integration / e2e / manual / model evaluation | deterministic mock / live / N/A |

Cover normal behavior, invalid input, role/ownership boundaries, edge cases, relevant concurrency,
dependency failures, and AI-specific abuse cases. This table defines planned verification, not results.

## Review evidence

- Challenge record:
- Review type: `independent` or `self-review`
- Open findings and disposition:
- Human input required:

## Open questions blocking approval

For a material change to an approved spec, reset frontmatter to `draft`, retain the invalidated approved
digest under document control, and link the change-impact record. Do not leave a materially revised spec
apparently approved.

## Change log

| Date | Change and reason | IDs affected | Evidence invalidated | By  |
| ---- | ----------------- | ------------ | -------------------- | --- |
