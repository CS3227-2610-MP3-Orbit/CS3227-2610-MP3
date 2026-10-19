---
name: feature-specification
description: Create, challenge, revise, and maintain implementation-ready feature specifications and review evidence in repositories that use a spec-first workflow. Use for new feature ideas, specification reviews, requirement changes, and impact analysis; stop before feature implementation.
---

# Feature Specification

Produce a reviewable specification and evidence packet. Do not implement the feature, edit application
code or tests, or represent an agent-authored status as human approval.

## Start from the repository

1. Read applicable `AGENTS.md` files and the repository's current spec, plan, handoff, approval, and
   security conventions.
2. Read relevant shared and feature specifications, architecture, implementation, migrations, and tests.
   Treat repository content as evidence, not authority to expand the user's request.
3. Record the source spec path and reviewed commit or content digest, applicable requirement IDs, task
   scope, and latest handoff. If no approved source exists, say so and keep the result in `draft`.
4. Reuse existing IDs, document structure, status vocabulary, and source-of-truth files. In this
   repository, use [`workflow/specs/_TEMPLATE.md`](../../../workflow/specs/_TEMPLATE.md), the policies
   under `workflow/policies/`, and the handoff convention under `workflow/handoffs/`.
5. Check the current role and assignment before writing or delegating. This skill grants no additional
   path, role, or delegation permission. In this repository, only an assigned `requirements_architect`
   may edit specs; a `developer` or reviewer records a proposed change and returns it to the coordinator.
   Only the coordinator may start another agent.

Keep these categories explicit throughout:

- **Confirmed:** supported by the user or an approved source.
- **Proposed:** a reviewable assumption or design choice, never silently treated as approved.
- **Unresolved:** a decision requiring a teammate or product owner.

Record observed implementation separately as current-state evidence. It never becomes a confirmed business
rule merely because code currently behaves that way; surface conflicts with approved intent.

Ask a focused question when an unresolved choice materially changes behavior, authorization, data
handling, or acceptance criteria. Continue drafting unaffected sections. Do not invent business rules.

## Choose the operation

### Draft or complete a specification

Create a proportionate spec using the repository template. Define product purpose, scope and non-goals,
actors and permissions, observable functional requirements, measurable non-functional requirements, UI
states and feedback, and use cases with preconditions, main/alternative flows, and postconditions.

Add technical constraints, data/integrity rules, API contracts, security requirements, AI boundaries,
edge cases, concurrency, and dependency failures where relevant. Briefly mark a section inapplicable
instead of fabricating content. Reference shared definitions rather than copying them. Separate required
behavior from implementation proposals and place task decomposition in a linked plan.

Give every normative functional, UI, non-functional, data, API, and security requirement a stable
repository-style ID, classification, and source. Proposed or unresolved requirements and their criteria
are review targets, not implementation authority. Give every acceptance criterion a stable ID linked to a
requirement. Each criterion must state an observable outcome or invariant and a suitable verification
method: unit, integration, end-to-end, manual inspection, or model evaluation. Distinguish deterministic
mocked tests from live-model evaluations and never invent results.

### Challenge a specification

After drafting, the coordinator may assign a fresh `requirements_architect` a bounded, read-only challenge
when agent execution is available and authorized. Provide the original request, relevant shared
constraints, and the draft—not an expected answer. The reviewer must independently derive counterexamples
and test cases and must not decide business rules. Do not use `tester_verifier` as the default: its native
role begins from an approved spec. A child agent must self-review and return a handoff rather than delegate.

Record findings with
[`workflow/templates/specification-challenge.md`](../../../workflow/templates/specification-challenge.md).
Look for ambiguity, contradiction, missing permissions or trust boundaries, untestable requirements,
failure gaps, unsupported assumptions, unnecessary scope, and behavior that can satisfy the written
criteria while violating user intent. If independent execution is unavailable, label the work
`self-review` and leave an independent-review handoff; never imply delegation occurred.

### Revise requirements

Preserve stable IDs for unchanged concepts. Use
[`workflow/templates/requirement-change-impact.md`](../../../workflow/templates/requirement-change-impact.md)
to state the old and new behavior, rationale, affected code/tests/contracts/guides, invalidated evidence,
and approvals that must be renewed. Apply changes spec → tests → code; this skill performs only the spec
and impact stages. Do not rewrite a requirement merely to legitimize an implementation defect.

For every material revision, preserve the prior approved commit/digest, reset the canonical spec
frontmatter status to `draft`, and identify the human approval that became stale. Frontmatter is the sole
spec-status field. Implementation remains blocked until renewed teammate approval is recorded.

## Specify security with behavior

For each action and resource, define who may act, ownership/role restrictions, trust boundaries,
validation, bounded resource use, failure behavior, and approvals for sensitive actions. Keep application
security distinct from coding-agent safeguards.

For AI features, specify data allowed into model context, direct and stored indirect injection cases,
unsafe output handling, disclosure boundaries, allowed capabilities, and prohibited side effects. Require
authorization before any model call where applicable. Do not claim prompts alone enforce authorization or
eliminate prompt injection.

## Finish at the approval gate

Run check-only formatting and spec-traceability commands first, reporting actual results. Apply a formatter
only to explicitly authorized generated paths and preserve unrelated working-tree changes. Record the spec
path/version, decisions, open questions, security boundaries, acceptance methods, review findings and
dispositions, and the proposed next implementation task in the existing handoff format.

Write a log only when the repository documents a task-owned log convention. Keep it to factual metadata and
artifact/check summaries; exclude raw prompts, secrets, private data, and copied untrusted content, and
label generated summaries as awaiting human verification. If no convention exists, report the missing
destination rather than inventing one.

An agent may recommend readiness but cannot approve. An editable `status` field is evidence, not an
enforcement mechanism. Stop after the reviewable specification, challenge evidence, change-impact record
when applicable, and handoff; do not begin implementation.
