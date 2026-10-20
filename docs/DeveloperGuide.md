# Developer Guide

## Setting up

Install the project dependencies, copy `.env.example` to a local environment file, and provide
the required development values through the local environment. Keep `.env.local` untracked and
never paste secret values into commits, issues, pull requests, screenshots, chat, or command
output. If a secret is exposed, revoke it and create a replacement before continuing.

The normal development sequence is:

1. Start from an up-to-date feature branch based on `develop`.
2. Create or update a draft specification under `workflow/specs/`.
3. Resolve questions and obtain human approval for the specification.
4. Hand the approved specification to the Developer Agent.
5. Run the Tester/Security Reviewer independently and record the evidence.
6. Fix findings, rerun the relevant checks, and submit the pull request for human review.

## Architecture

## Data model and access rules

### Database migrations

Every schema change is a new file in `supabase/migrations/`, created with
`npx supabase migration new <name>` and reviewed in a pull request. The deploy workflow applies
migrations to the development project when `develop` changes and to the production project when
`master` changes, before the new code is deployed.

Because migrations run first, the code that is still live meets the new schema for a few minutes,
and for longer if the deployment then fails. Every migration must therefore keep working with the
code that is currently deployed:

- **Add first, remove later.** To rename or replace a column, add the new column in one release,
  switch the code to it, and drop the old column in a later release.
- **Never edit a migration that has been merged.** Write a new migration that changes it.
- **Never change the schema through the Supabase dashboard** on development or production; the
  pipeline would not know about the change.
- **Every new table enables row-level security** and has policies that use `current_app_role()`;
  `supabase/tests/rls_enabled.test.sql` fails otherwise.

## AI features and the SoC LLM gateway

AI features use the existing SoC LLM gateway configuration and quota controls. Keep prompts
limited to the data required for the feature. Student-provided topics and questions are untrusted
content: delimit them clearly, instruct the model not to follow instructions found inside them, and
validate the response before displaying or storing it. Provider failures, rate limits, malformed
responses, and persistence failures must produce a user-facing failure without exposing secrets or
silently claiming that a briefing was generated.

For the Lecturer AI briefing, the user selects one upcoming approved consultation. The application
generates a summary, grouped question themes, and preparation topics, stores the result in the
database, and displays only the latest ten saved briefings to the user. Student email is excluded
from the model input under the least-data principle. The feature still requires lecturer
authorization, booking ownership checks, row-level security, and tests for prompt injection,
quota boundaries, provider failure, and unauthorized access.

## Security

### Development-agent intervention hooks

The repository registers command hooks in `.codex/hooks.json`; the maintained logic and policy stay
under `workflow/`. Inspection on 17 October 2026 found `codex-cli 0.154.0-alpha.6.2` in the local
VS Code extension, with the `hooks` feature reported as stable and enabled. The installed environment
is the local macOS Codex client/CLI using project-scoped `.codex/` configuration. This setup is not
assumed to work in Codex Cloud: local command hooks require a local execution environment.

The configuration follows the current official [Codex hooks documentation](https://learn.chatgpt.com/docs/hooks):

- `PreToolUse` runs synchronously for documented shell/unified-exec and `apply_patch` paths. The hook
  reads the structured JSON input and explicitly denies recognized force-pushes, destructive resets,
  and direct production deployments. An edit to a review-sensitive path is allowed with a warning so
  teammate review, not an unsupported interactive `ask` result, provides the gate.
- `SubagentStop` checks writer-role completion. A missing structured handoff causes one continuation;
  `stop_hook_active` then makes the checker stop prompting to prevent a recursive loop. Complete,
  blocked, incomplete, failed, and not-run evidence are valid when required fields are present. The
  read-only security reviewer is excluded because a technically read-only run cannot create a file;
  its report is recorded by the coordinator.
- Hook input uses the parent `session_id` for subagents. The distinct `SubagentStop` event is needed
  for their completion messages; `SessionEnd` and `Interrupt` do not apply to subagents.

The action table and exact boundaries are in `workflow/policies/development-security.md`. In short,
the hook **blocks** narrow recognized shell actions and malformed covered inputs. It **flags for
review** changes to agent instructions, hook controls, CI/CODEOWNERS, authentication, authorization,
and migrations. It allows normal scoped edits, local commands, and tests.

#### Installation and teammate setup

1. Use Node.js 24 or later and a Codex release that reports `hooks` enabled in
   `codex features list`. Project hooks are enabled explicitly in `.codex/config.toml`.
2. Open the repository as a trusted Codex project. Project hooks do not load for an untrusted project.
3. Run `/hooks`, inspect `.codex/hooks.json` and the command scripts, and trust the exact definitions.
   Codex hashes non-managed hook definitions and requires another review after they change.
4. Restart the session after configuration changes. Never use hook-trust bypass flags for ordinary
   development.

Safe local checks:

```sh
codex --version
codex features list
codex --strict-config doctor --summary
npm run test:hooks
npm run test:workflow
npm run verify -- --profile=app
```

Tests use synthetic event payloads only; they do not execute Git pushes, resets, or deployments. The
automated suite is separate from the prompt-injection behavior exercise under
`workflow/evaluation/hook-policy-injection/`, whose result must be recorded only after an observed
run.

#### Evidence and limitations

Hooks append metadata-only records to gitignored `workflow/logs/hooks/audit.jsonl`. They do not log
prompts, transcript content, environment values, or raw tool arguments. The file is writable by the
agent and is therefore development evidence, not a tamper-proof audit record. Handoffs also record
claims rather than proving them; verification belongs to the tester, security reviewer, CI, and
human reviewer.

Explicit `PreToolUse` denies block calls in supported local paths. However, official behavior is to
continue the underlying operation when a hook crashes, times out, or returns an invalid response.
Hosted tools are not covered; some specialised paths may opt out; `write_stdin` does not re-run the
pre-hook; aliases, dynamic shell construction, encoded commands, and sourced scripts can evade the
small parser. Branch protection, CODEOWNERS, protected GitHub environments, least-privilege
credentials, application authorization, and RLS remain necessary.

The repo-local hook can warn when its own files change but cannot protect itself from an agent with
write access. Strong enforcement requires an administrator-owned script directory and managed
`requirements.toml`, or at minimum OS permissions plus protected-review rules. `AGENTS.md` is not an
immutability mechanism.

#### Lecture 6 mapping

| Lecture concept                                           | Project mechanism                                                     |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| Slide 6: guardrails, intervention, approval, traceability | Pre/SubagentStop hooks, review flags, requirement-aware handoff       |
| Slide 7: proposed actions and command permissions         | Structured pre-action inspection and explicit supported denial        |
| Slide 10: permission control and stop conditions          | Narrow deny rules, truthful outcomes, one bounded continuation        |
| Slide 11: logs and verification evidence                  | Sanitized JSONL metadata, actual check results, separate verification |
| Slide 32: context-poisoning mitigation                    | Untrusted-content rule and harmless injection evaluation fixture      |

### Decisions

| Decision                                                                             | Reason                                                                                                                                  | Trade-off                                                                                                              |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Vercel Deployment Protection is off, so preview (development) deployments are public | On the Hobby plan only one person can be in the Vercel team, so teammates could not open development deployments to test their features | Anyone with a preview link reaches the app's login page; development data is fake and the app requires its own sign-in |

## Spec-driven development

Every feature starts as a draft under `workflow/specs/`. A named human must approve material
requirements before implementation. Acceptance tests reference criterion IDs, and requirement
changes flow through spec → tests → code. `npm run check:spec` checks traceability. Each role leaves a
handoff using `workflow/handoffs/_TEMPLATE.md`, including exact scope, spec version, actual command
results, findings, and the next decision.

Do not treat an Analyst output as a final requirement set. It is a draft until human decisions have
resolved its open questions. Record decisions about ownership, deadlines, status transitions,
privacy, error behaviour, retention, and notifications in the specification before implementation.

Specification approval is bound to the reviewed Git commit or spec content digest. Material changes
to behavior, permissions, data contracts, failure/security cases, or acceptance criteria invalidate
that approval; a typo-only change may retain approval only if the reviewer agrees. Full gate fields
and the exact remote setup checklist are in `workflow/policies/approval-gates.md`.

## Specialised agents and the `workflow/` folder

Four project-scoped Codex agents are defined in `.codex/agents/`: `requirements_architect`,
`developer`, `tester_verifier`, and `security_reviewer`. `.codex/config.toml` enables at most two
concurrent subagent threads, disables project web search and login shells, and lets independent
verification and security review run in parallel. Native files live under `.codex/` because that is
Codex's discovery location; workflow prompts, handoffs, evaluation fixtures, and recorded results
remain under `workflow/`.

The main Codex session is the coordinator. It supplies requirement IDs, the exact approved spec
version, relevant files, allowed edit paths, and expected evidence. It obtains human specification
approval before calling the developer, then sends the result to independent verification and security
review. Findings may pass through at most two automatic developer/review cycles before unresolved
issues are returned to a human. Agents never merge, deploy, or approve their own work.

Custom subagents inherit the parent's sandbox, approval policy, provider, and MCP servers. Therefore,
per-agent path limits, read-only behavior, no delegation, and retry limits are instruction-enforced;
they are not separate operating-system permissions. Apps, plugins, memories, and permission-request
tools are disabled in each agent file. To enforce a read-only review technically, invoke its parent
session with `--sandbox read-only`. CI, CODEOWNERS, branch protection, GitHub environment reviewers,
application authorization, and database RLS enforce gates outside model output. Full invocation and
validation instructions are in `workflow/agents/README.md` and `workflow/evaluation/README.md`.

## Environments and deployment

| Environment | Git branch | Database                                        | Hosting           | Deployed by                                        |
| ----------- | ---------- | ----------------------------------------------- | ----------------- | -------------------------------------------------- |
| Local       | any        | Local Supabase in Docker (`npx supabase start`) | `npm run dev`     | Developer                                          |
| Development | `develop`  | Supabase project "dev"                          | Vercel preview    | GitHub Actions, on push                            |
| Production  | `master`   | Supabase project "prod"                         | Vercel production | GitHub Actions, on push, after a reviewer approves |

Vercel's own Git deployments are disabled (`vercel.json`). GitHub Actions runs the checks, applies
database migrations, builds the app and uploads the build to Vercel:

- `.github/workflows/ci.yml`: the shared verifier, database checks, and browser tests against local
  Supabase. It has read-only repository permission and receives no deployment or production secrets.
- `.github/workflows/deploy.yml`: runs CI, then `supabase db push` and a Vercel deployment for the
  environment that matches the branch.
- `.github/workflows/keepalive.yml`: pings both Supabase projects every three days so free projects
  do not pause.

### Configuration

GitHub environments `development` and `production` hold secrets with the same names, so the
workflow never chooses credentials itself. `production` requires a reviewer to approve each deployment.

| Secret                                     | Scope            | Value                                           |
| ------------------------------------------ | ---------------- | ----------------------------------------------- |
| `VERCEL_TOKEN`                             | each environment | Separate development/production Vercel token    |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`       | each environment | From `.vercel/project.json` after `vercel link` |
| `SUPABASE_ACCESS_TOKEN`                    | each environment | Separate development/production Supabase token  |
| `SUPABASE_PROJECT_REF`                     | each environment | Project reference of the dev or prod project    |
| `SUPABASE_DB_PASSWORD`                     | each environment | Database password of that project               |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | each environment | API URL and publishable key of that project     |

`workflow/scripts/setup-github.sh <owner/repo> <secrets-file> <reviewer>...` creates both
environments and sets every secret from a gitignored `KEY=value` file (environment secrets
prefixed `DEV_` or `PROD_`), printing only secret names.

Optional repository variable `VERCEL_DEV_ALIAS` (e.g. `my-app-dev.vercel.app`) gives the
development environment a stable address.

Vercel environment variables: **Preview** points to the dev Supabase project, **Production** to the
prod project. `workflow/scripts/setup-vercel-env.sh <secrets-file>` sets them from the same file
(`DEV_`/`PROD_SUPABASE_SECRET_KEY`, and unprefixed `SOCLAAS_*`). Both need `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `SOCLAAS_BASE_URL`, `SOCLAAS_API_KEY` and `SOCLAAS_MODEL`.

## Testing and workflow verification

`npm run verify -- --profile=app` is the shared local/CI entry point for formatting, linting, type
checking, workflow controls, unit tests, traceability, sensitive-path classification, Secretlint, and
the application build. Run `--profile=database` after local Supabase starts and `--profile=e2e` after
local Supabase and Playwright Chromium are available. `--profile=full` runs all profiles. Missing
prerequisites fail or block the profile; they are never reported as passed.

Unit policy tests, handler/config integration tests, the observed adversarial-agent exercise, and
remote GitHub checks are separate evidence types. Results live under `workflow/evaluation/`; branch
protection/environment settings stay `not-run` until a teammate verifies them in GitHub.

## Reuse and acknowledgements

Hook names, matchers, trust behavior, event schemas, timeout behavior, and fail-open limitations were
taken from the official [OpenAI Codex Hooks](https://learn.chatgpt.com/docs/hooks) documentation.
Sandbox/approval boundaries follow [OpenAI Agent approvals & security](https://learn.chatgpt.com/docs/agent-approvals-security).
GitHub remote gate steps reference the GitHub protected-branch and deployment-environment documents
linked from `workflow/policies/approval-gates.md`. Hook and policy code was written for this project;
no third-party code was copied.
