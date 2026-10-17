# Developer Guide

## Setting up

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

## Security

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

- `.github/workflows/ci.yml`: lint, type check, unit tests, spec traceability, build, and database
  tests against a throwaway local Supabase. Runs on every pull request.
- `.github/workflows/deploy.yml`: runs CI, then `supabase db push` and a Vercel deployment for the
  environment that matches the branch.
- `.github/workflows/keepalive.yml`: pings both Supabase projects every three days so free projects
  do not pause.

### Configuration

GitHub environments `development` and `production` hold secrets with the same names, so the
workflow never chooses credentials itself. `production` requires a reviewer to approve each deployment.

| Secret                                     | Scope            | Value                                           |
| ------------------------------------------ | ---------------- | ----------------------------------------------- |
| `VERCEL_TOKEN`                             | repository       | Vercel access token                             |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`       | repository       | From `.vercel/project.json` after `vercel link` |
| `SUPABASE_ACCESS_TOKEN`                    | repository       | Supabase personal access token                  |
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
(`DEV_`/`PROD_SUPABASE_SECRET_KEY`, and unprefixed `SOC_LLM_*`). Both need `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `SOC_LLM_BASE_URL`, `SOC_LLM_API_KEY` and `SOC_LLM_MODEL`.

## Testing

## Reuse and acknowledgements
