# Project work log

- Owner: Joseph
- Date: 2026-10-17
- Repository baseline referenced by the reviews: `87a8951`
- Branch observed by the specification-readiness review: `AI-workflow-initalization`
- Scope: documentation, specifications, agent workflow, review plans, development guardrails, and
  verification infrastructure
- Application feature implementation in this work: none
- Remote actions in this work: no push, merge, deployment, production access, database push, or
  GitHub settings change

This is a consolidated factual record of the artifacts created or materially updated during the
project work so far. Existing source code was inspected to distinguish implemented foundation work
from planned features. Secrets, raw environment values, private data, and full raw prompts are not
recorded here.

## 1. Consultation-system specification set

The proposed Student, Lecturer, and Administrator consultation-booking system was converted into a
five-document specification structure:

- `workflow/specs/PRODUCT-SPEC.md` — users, role capabilities, workflows, booking rules, and product
  acceptance criteria.
- `workflow/specs/TECHNICAL-SPEC.md` — application-level technical requirements and validation.
- `workflow/specs/SHARED-TECHNICAL-SPEC.md` — security, reliability, AI, testing, and other shared
  non-functional requirements.
- `workflow/specs/INTEGRATION-SPEC.md` — logical entities, state transitions, action boundaries, and
  integration contracts.
- `workflow/specs/PLAN.md` — staged delivery plan, dependencies, ownership, and validation work.

The existing shared foundation spec `workflow/specs/shared/SH-01-foundation.md` was also reviewed.
All six product/foundation specifications were still `draft`; no human approval was recorded. The
initial traceability result was 6 specs, 41 criteria, and 5 covered criteria, with uncovered draft
criteria correctly reported as warnings.

The analyst handoff was recorded in
`workflow/handoffs/2026-10-17-consultation-spec-set-analyst.md`. It preserved material unresolved
decisions instead of silently choosing them, including account provisioning, course eligibility,
timezone and cancellation rules, field limits, invitation/deactivation behavior, retention,
accessibility, scale, and browser support.

## 2. Specialized Codex development agents

Four project-native role definitions and their coordinator configuration were created or updated:

- `.codex/config.toml`
- `.codex/agents/requirements_architect.toml`
- `.codex/agents/developer.toml`
- `.codex/agents/tester_verifier.toml`
- `.codex/agents/security_reviewer.toml`

The supporting workflow was documented or updated in:

- `AGENTS.md`
- `workflow/README.md`
- `workflow/agents/README.md`
- `workflow/handoffs/_TEMPLATE.md`
- `docs/DeveloperGuide.md`

An isolated, fake-data validation exercise was added under
`workflow/evaluation/agent-validation/`. It contained a deliberate ownership defect, incomplete test
coverage, and a harmless malicious source comment. Both role-guided reviewers found the ownership
defect and missing acceptance test and ignored the injected instruction. The exercise also exposed
an important limitation: prompt-level path restrictions are not filesystem isolation.

The setup evidence was recorded in:

- `workflow/evaluation/README.md`
- `workflow/evaluation/RESULTS.md`
- `workflow/handoffs/2026-10-17-agent-setup-coordinator.md`
- `logs/agent-setup/2026-10-17-summary.md`

Observed tooling was `codex-cli 0.154.0-alpha.6.2`. Strict project configuration diagnostics loaded
successfully. The first native nested-agent experiment was incomplete because the invoked parent did
not receive collaboration tools and the read-only environment blocked a nested session; that result
was recorded as incomplete rather than passed.

## 3. Specification-readiness review and first proposed slice

The requirements architect inspected the existing specifications, source, tests, migrations, CI,
deployment definitions, ownership rules, and documentation without implementing an application
feature. The work produced:

- `workflow/reviews/2026-10-17-spec-readiness-review.md`
- `workflow/plans/2026-10-17-first-vertical-slice.md`
- `workflow/handoffs/2026-10-17-spec-readiness-requirements-architect.md`

The review distinguished the existing foundation from planned work:

- Present: Next.js/React/TypeScript configuration, login UI, password sign-in, role mapping,
  server-side role guards, role dashboard shells, Supabase session refresh, initial profiles and AI
  usage schema, RLS foundation, AI untrusted-text wrapper, CI, and deployment definitions.
- Partial or insufficiently verified: the draft `SH-01` foundation, inactive-user behavior, exact
  Server Action authorization wording, AI quota/error handling, AI output validation, detailed RLS
  tests, acceptance-criterion coverage, and end-user documentation.
- Planned only: courses, lecturer-course assignments, consultation slots, bookings, booking
  concurrency/state transitions, announcements, account-management UI, reporting, and all three
  role-specific AI features.

The smallest proposed end-to-end feature was administrator publication and student reading of
plain-text announcements. It remains a proposal, not authorization to implement. Before work can
start, humans must resolve announcement representation, publication behavior, role visibility,
editing ownership, deletion, field bounds, ordering/pagination, stale edits, retention, and how to
approve or split the shared foundation. A detailed `ADM-03` spec must then be drafted and approved.

At the time of that read-only review, application tests and lint were blocked because dependencies
were not installed in that checkout, and database/browser suites were not started. Later guardrail
verification installed the necessary local dependencies and ran the relevant suites; both results
are retained because they describe different points in the timeline.

## 4. Development approval gates and guardrails

Five new workflow-governance specifications were drafted:

- `workflow/specs/shared/WFG-01-development-security.md`
- `workflow/specs/shared/WFG-02-approval-gates.md`
- `workflow/specs/shared/WFG-03-codex-hooks.md`
- `workflow/specs/shared/WFG-04-verification-ci.md`
- `workflow/specs/shared/WFG-05-evaluation-evidence.md`

They remain `draft` and require independent human review. The local infrastructure was implemented
from the direct workflow request; it does not represent approval of those specifications or any
application feature.

### Policies and human gates

Created or updated:

- `workflow/policies/development-security.md`
- `workflow/policies/approval-gates.md`
- `workflow/policies/master-branch-protection.json`
- `.github/CODEOWNERS`
- `.github/pull_request_template.md`
- `workflow/scripts/setup-github.sh`
- `workflow/scripts/lib/secrets-file.sh`

The policies distinguish behavioral instructions, trusted local hooks, CI checks, and external
GitHub enforcement. They define gate triggers, eligible approvers, evidence, invalidation, enforcement
points, and known bypasses. Prepared branch protection requires a PR, approval, Code Owner review,
stale-approval dismissal, required checks, conversation resolution, and blocked force-push/deletion.
It has not been applied remotely.

Development and production credentials were separated into GitHub environments in the prepared
setup. Required values are validated before the first remote mutation, values are never printed, and
production reviewer and branch-policy settings are read back. A repository administrator must still
run and verify this setup.

### Codex hooks and handoff evidence

Created or updated:

- `.codex/hooks.json`
- `workflow/hooks/lib.mjs`
- `workflow/hooks/pre-tool-use.mjs`
- `workflow/hooks/stop-handoff.mjs`
- `workflow/hooks/hooks.test.mjs`
- `workflow/hooks/hook-integration.test.mjs`
- `workflow/scripts/lib/handoff.mjs`
- `workflow/scripts/check-handoff.mjs`
- `workflow/scripts/handoff.test.mjs`
- `workflow/templates/task-handoff.md`
- `workflow/logs/hooks/README.md`

The pre-action hook parses commands as data and does not execute them. It denies recognized force
pushes, destructive Git operations, direct production deployment commands, database pushes, and
malformed covered input. Sensitive edits are allowed with an explicit review warning rather than
being treated as human-approved.

The writer-agent completion hook checks an explicit structured handoff file for requirement IDs,
changed files, truthful verification results, and unresolved issues. It requests at most one retry.
Truthful `blocked` and `not-run` results are accepted. The read-only security reviewer is excluded
because it cannot create a persistent handoff during a genuinely read-only task.

Hook logs are gitignored, metadata-only records. They omit raw prompts, full arguments, handoff
contents, secrets, and environment values. Hooks remain editable, trust-dependent, pattern-based
local guardrails and may fail open if Codex reports a crash, timeout, or malformed hook response.
Protected branches, CI, CODEOWNERS, environment reviewers, application authorization, and RLS remain
necessary independent controls.

### Shared verification, CI, and secret scanning

Created or updated:

- `workflow/scripts/verify.mjs`
- `workflow/scripts/check-secrets.mjs`
- `.secretlintrc.json`
- `workflow/scripts/review-sensitive-changes.mjs`
- `workflow/scripts/review-sensitive-changes.test.mjs`
- `workflow/scripts/check-traceability.mjs`
- `workflow/scripts/check-traceability.test.mjs`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `package.json`
- `package-lock.json`

The shared verifier provides application, database, browser, and full profiles. Local documentation
and CI invoke the same implementation. The application profile covers formatting, lint, typecheck,
workflow-control tests, sensitive-path classification, application unit tests, spec traceability,
secret scanning, and build. Missing database/browser prerequisites are reported as `blocked` or
`not-run`, never passed.

CI uses minimum permissions, pinned actions, no privileged `pull_request_target`, and no production
credentials in PR jobs. Deployment credentials are limited to the relevant environment and command
steps. Secretlint was pinned and configured; its wrapper reports only safe file/rule locations rather
than matching secret text.

### Guardrail evaluation and evidence

Created or updated:

- `workflow/evaluation/guardrails/RESULTS.md`
- `workflow/evaluation/guardrails/fixtures/ordinary-pretool.json`
- `workflow/evaluation/guardrails/fixtures/prohibited-pretool.json`
- `workflow/evaluation/guardrails/fixtures/prompt-injection.txt`
- `workflow/evaluation/guardrails/fixtures/valid-blocked-handoff.md`
- `workflow/evaluation/hook-policy-injection/FIXTURE.md`
- `workflow/evaluation/hook-policy-injection/README.md`
- `workflow/evaluation/hook-policy-injection/RESULTS.md`
- `workflow/handoffs/2026-10-17-development-hooks-coordinator.md`
- `workflow/handoffs/2026-10-17-workflow-guardrails-coordinator.md`
- `logs/workflow-guardrails/2026-10-17-summary.md`

The requirements audit identified the WFG requirements and initially found missing hook registration,
shared verification, secret scanning, handoff validation, sensitive-path classification, approval
binding, remote enforcement evidence, PR evidence, and native-hook tests. The implementation addressed
the local gaps. After iterative fixes, the independent security reviewer found no remaining high- or
medium-severity defect in its focused scope.

## 5. Verification results actually observed

- `codex --version`: passed; `codex-cli 0.154.0-alpha.6.2`.
- `codex features list`: hooks reported stable and enabled.
- Strict Codex diagnostics: 21 checks passed, 0 failed, with one endpoint-protection warning.
- Shared application profile: passed all nine stages.
- Hook Node tests: 15/15 passed.
- Focused workflow Vitest: 3 files and 8 tests passed.
- Application unit tests: 2 files passed and 1 skipped; 6 tests passed and 4 remained `todo`.
- Spec traceability: passed with expected warnings for draft criteria; after WFG additions it found
  11 specs, 70 criteria, and 13 covered criteria.
- Database profile: database lint and 2 pgTAP files/2 tests passed.
- Browser profile: first failed because Chromium was missing; Chromium was installed, an orphaned
  local dev server from the failed attempt was stopped, and the final Playwright run passed 1/1.
- Missing-environment browser probe: correctly reported `blocked` and did not run the test.
- Native `PreToolUse` exercise: passed; a harmless nonexistent production-script invocation was
  denied before `npm` ran.
- Native `SubagentStop`: not run in a fresh trusted writer-agent session.
- Formatting, final secret scan, shell syntax checks, JSON parsing, and `git diff --check`: passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Full `npm audit`: 5 high findings remained in the existing development-only
  `eslint-config-next` dependency chain. The available forced fix was breaking and was not applied.
- Remote GitHub branch protection, environment review, bypass restriction, and production release
  behavior: not run and not claimed as enforced.

## 6. Current unresolved decisions and required human actions

1. Review the five WFG specs and guardrail patch independently; record the reviewed commit or digest.
2. Resolve the product and announcement decisions listed in the readiness review before drafting and
   approving `ADM-03`.
3. Open a fresh trusted Codex session, inspect `/hooks`, trust the exact hook definitions, and observe
   native `SubagentStop` with a writer agent.
4. Push/open a PR only through a human-controlled workflow and let `Verify`, `Database rules`, and
   `End-to-end` appear as check contexts.
5. Have a repository administrator install and verify `master` protection, narrow bypass rights, and
   configure independent production-environment reviewers with self-review prevented.
6. Use separate development and production credentials in the protected GitHub environments; do not
   expose production-capable credentials to PR jobs or coding-agent sessions.
7. Exercise a harmless PR and deployment approval flow and record URLs/screenshots before claiming
   remote enforcement.

## 7. Source evidence

This consolidation is based on the repository artifacts named above and these primary records:

- `workflow/handoffs/2026-10-17-consultation-spec-set-analyst.md`
- `workflow/handoffs/2026-10-17-agent-setup-coordinator.md`
- `workflow/handoffs/2026-10-17-spec-readiness-requirements-architect.md`
- `workflow/handoffs/2026-10-17-development-hooks-coordinator.md`
- `workflow/handoffs/2026-10-17-workflow-guardrails-coordinator.md`
- `workflow/reviews/2026-10-17-spec-readiness-review.md`
- `workflow/plans/2026-10-17-first-vertical-slice.md`
- `logs/agent-setup/2026-10-17-summary.md`
- `logs/workflow-guardrails/2026-10-17-summary.md`

Human approval fields in existing handoffs remain blank. This log is evidence of recorded work, not
human approval of a specification, merge, release, or production deployment.
