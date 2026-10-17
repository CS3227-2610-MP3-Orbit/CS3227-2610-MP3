---
id: SHR-01
title: Shared non-functional and security requirements
owner: team
status: draft
---

# SHR-01: Shared non-functional and security requirements

## Context

These requirements apply to every role and feature. They supplement `SH-01-foundation.md`; where the
documents differ, the difference must be resolved during human review before either is approved.

## Authentication and authorization

- Supabase Auth provides email/password authentication and server-validated sessions.
- Every protected page layout, Server Action, and Route Handler calls `requireRole` for its owner.
- Authorization is repeated in PostgreSQL row-level security. Tables without an explicit user policy
  deny normal authenticated access.
- Administrative clients that bypass row-level security are server-only and are used only after an
  explicit permission check.
- Role values come from trusted profile data, not sign-up metadata or form fields.

## AI security and reliability

- All SoC LLM calls go through `generateText`; feature code must not instantiate another LLM client.
- API credentials remain in server-only environment variables and are never placed in logs, prompts,
  browser bundles, agent inputs, tests, or committed files.
- Fixed system instructions and untrusted data are separate. All user- or database-authored free text
  is wrapped with `wrapUntrusted`.
- Model output is untrusted: enforce a length bound, reject unusable responses, display it as plain
  text, and never interpret it as HTML, code, authorization, or a database command.
- AI features require human review before generated drafts are persisted or acted upon.
- The shared gateway enforces input length, output-token limits, timeout, per-user limits, and a
  team-wide limit. Accounting fails closed when usage cannot be recorded reliably.
- Timeout, quota exhaustion, rate limiting, empty output, and provider failure return typed outcomes;
  they do not make ordinary features unavailable.

## Data protection

- Collect and expose only data necessary for the requested feature.
- Student consultation topics and questions are visible only to that student and the lecturer owning
  the selected slot. They are excluded from administrator aggregate AI prompts.
- Server logs contain feature/error metadata but no passwords, tokens, secret keys, or full private
  consultation descriptions.
- Local and development environments use fake data. Production data and credentials are not supplied
  to development agents.
- All schema changes are append-only migrations; an existing merged migration is never edited.

## Integrity and concurrency

- Database-level constraints protect invariants that can be violated concurrently: one active
  booking per slot, no lecturer slot overlap, valid time ranges, and valid booking states.
- Mutations are atomic and conditional on both owner and current state.
- Times are stored as timezone-aware timestamps; presentation uses one documented timezone.
- Referential integrity prevents orphaned slots, assignments, bookings, announcements, and usage
  records.

## Usability and accessibility

- Each role has a clearly labelled, separate workspace and usable sign-out control.
- Forms have associated labels, keyboard-accessible controls, pending states, and readable validation
  messages.
- Status is communicated with text, not colour alone.
- AI-generated content is labelled as generated and editable where used as a draft.
- Core booking workflows work without JavaScript-only authorization assumptions and remain usable
  when the AI provider fails.

## Performance and operational requirements

- List queries are paginated or bounded and indexed by their main ownership, status, and time filters.
- The application does not call the LLM when deterministic code can answer the request or when the
  source dataset is empty.
- Development and production have separate Supabase projects and credentials.
- GitHub Actions runs lint, type checking, unit tests, traceability, build, database lint, and database
  tests before deployment.
- Production deployment requires a human approval gate. Deployment is managed by the team through
  GitHub Actions and Vercel, not a coding-agent hosting environment.
- A GitHub Pages product website links to accurate user and developer documentation.

## Verification requirements

- Vitest covers pure application rules and AI input/output handling.
- pgTAP covers schema constraints, triggers, row-level security, and cross-role access attempts.
- Playwright covers representative happy paths, authorization boundaries, conflict messages, AI
  failure fallbacks, and safe rendering in a browser.
- Test names or comments reference acceptance-criterion IDs, and `npm run check:spec` passes.
- A tester-security reviewer attempts direct action invocation, ID substitution, concurrent booking,
  stored prompt injection, generated-script output, excessive AI calls, timeout, and provider failure.

## Acceptance criteria

- **SHR-01-AC1** Given any table added to `public`, when database tests inspect the schema, then row-
  level security is enabled and the table has only the policies justified by its approved spec.
- **SHR-01-AC2** Given a user of one role, when they directly call another role's mutation without
  using its UI, then the server refuses the call before using an administrative client or changing
  data.
- **SHR-01-AC3** Given a development build, test log, browser bundle, or agent handoff, when it is
  inspected, then it contains no production credential, SoC LLM key, or Supabase secret key.
- **SHR-01-AC4** Given an LLM timeout, rate limit, provider error, or invalid response, when an AI
  feature is used, then it returns a handled failure and a user can still complete a non-AI workflow.
- **SHR-01-AC5** Given simultaneous requests that would violate a booking or slot invariant, when
  transactions commit, then the database accepts at most one valid outcome and preserves the
  invariant.
- **SHR-01-AC6** Given a pull request for a feature, when CI runs, then lint, type checking, unit
  tests, traceability, build, database lint, and database tests must succeed before deployment.
- **SHR-01-AC7** Given a production deployment, when the deployment job reaches the environment,
  then it waits for an authorized human reviewer and uses only production-scoped credentials.

## Out of scope

- Formal availability guarantees beyond the hosting providers' services.
- Processing payment, health, disability, or other special-category personal data.
- Granting autonomous tool use or database mutation capabilities to the LLM.

## Open questions

- Confirm the SoC LLM's actual per-minute and daily limits on the NUS network.
- Define retention and deletion periods for completed bookings, AI usage metadata, and logs.
- Choose the authoritative display timezone and accessibility target (for example, WCAG 2.1 AA).
- Decide the supported browser versions and expected dataset size for performance testing.

## Change log

| Date | Change | By |
| --- | --- | --- |
| 2026-10-17 | First shared technical draft | analyst |
