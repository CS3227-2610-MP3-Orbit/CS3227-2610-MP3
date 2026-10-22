# Lecturer feature work log

## Lecturer AI briefing and consultation-slot fixes — 2026-10-22

- Owner: Jordan
- Branch: `branch-lecturer-fix`
- Scope: Lecturer consultation-slot access and the Lecturer AI briefing runtime path.
- The original Lecturer AI briefing implementation is already present on the branch base. This log
  records the follow-up fixes made while exercising the feature locally.

### Changes recorded

- Restored authenticated database grants for Lecturer access to assigned courses, course assignments,
  consultation slots, and booking reads after the shared Student migration revoked default table
  privileges. Row-level policies continue to restrict the visible rows.
- Fixed the Lecturer slot-deletion form so it passes a dedicated server action rather than an inline
  function across the Server/Client boundary.
- Added a dedicated briefing form server-action entry point and removed client-side action wrappers that
  caused Next.js to reject the form action during Lecturer dashboard rendering.
- Made briefing submission redirect back to the Lecturer dashboard with a safe success or error status,
  so a submitted form no longer appears to do nothing.
- Changed briefing input lookup to use the authorized `list_staff_consultations` projection. This avoids
  direct RLS-blocked reads of student profiles and courses while preserving Lecturer ownership checks.
- Preserved the existing safeguards: only upcoming approved consultations are eligible, student email is
  excluded from the model input, untrusted text is wrapped, output is validated, and generated content is
  stored only for the owning Lecturer.

### Verification actually run

- `npm.cmd run typecheck` passed after the final server-action and projection changes.
- Focused AI briefing tests passed: 1 test file, 2 tests.
- `git diff --check` passed for the changed implementation rounds.
- A live SoC LLM response was not independently verified in this workspace. Provider availability,
  configured environment variables, quota, and network access can still produce a user-facing briefing
  service error.
- No production credentials, deployment, database push, merge, or production access occurred.

### Follow-up

- Confirm one live briefing against the configured SoC LLM environment.
- Record the final CI result and any provider-specific setup details before marking the AI feature
  release-ready.

Generated summary awaiting independent human verification.

## Lecturer specification and implementation history — consolidated 2026-10-22

- Lecturer owner decisions were recorded for request rejection reasons, suggested generic messages,
  AI output behavior, administrator access, booking-only scope, the next-100-future-consultations
  briefing/history bound, shared limits, safe logging, and CI controls. These decisions were used to
  close the relevant Lecturer specification questions rather than inventing behavior during coding.
- The approved Lecturer specifications in the repository are LEC-01 availability, LEC-03 consultation
  completion, and LEC-04 AI briefing. The earlier LEC-03 lifecycle document is marked `superseded` by
  the approved completion specification. LEC-02 request decisions, LEC-05 dashboard, and LEC-06
  authorization/AI security remain marked `draft` in the current repository and should not be described
  as approved merely because their open-question sections say “None”.
- The Lecturer AI briefing implementation generates a summary, grouped question themes, and preparation
  topics for one upcoming approved consultation. It excludes student email, treats stored consultation
  text as untrusted content, uses the shared quota gateway, validates output, stores the result for the
  owning Lecturer, and displays the saved briefing history.
- CI work during the feature included correcting the shared quota test shape, resolving the develop-branch
  quota conflict, restoring traceability/format compliance, replacing a raw colour token with the semantic
  token `text-muted-foreground`, and fixing the seeded admin UUID collision that hid the protected admin
  account from the ADM-01 E2E test. The final seed reset is required for reliable local/CI admin fixtures.
- The Lecturer branch was separated from `develop` as `branch-lecturer-fix`; the two local commits that
  had been placed on `develop` were preserved on the new branch and `develop` was restored to its remote
  state.
- During local AI verification, the briefing first returned “temporarily unavailable” because the local
  environment used `SOC_LLM_*` and then `SOCLASS_*` names while the application expects the exact
  server-only names `SOCLAAS_BASE_URL`, `SOCLAAS_API_KEY`, and `SOCLAAS_MODEL`. After correcting the
  names and restarting Next.js, the AI feature worked locally and the SoC LLM request path was reached.
- This local success does not prove hosted CI or production configuration. The deployment environments
  still need the matching `SOCLAAS_*` variables, a live CI/provider verification, and independent review
  before release readiness is claimed.

### Final local evidence

- `npm.cmd run typecheck`: passed.
- Focused Lecturer AI briefing tests: 2/2 passed.
- Local browser flow: Lecturer login, upcoming approved consultation, Generate AI briefing, provider
  configuration correction, and successful briefing generation were exercised.
- No API keys, prompt contents, generated private consultation data, or provider responses are recorded
  in this log.

Generated summary awaiting independent human verification of hosted configuration and release gates.
