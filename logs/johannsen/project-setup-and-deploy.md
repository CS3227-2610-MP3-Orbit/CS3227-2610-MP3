# Project setup, deploy pipeline, and agent infrastructure

## Repository skeleton, cloud user script, and deploy pipeline hardening — 2026-10-17

- Requested/decided (Johannsen, Administrator role, as team-infrastructure owner): bootstrap the
  repository, give the team a safe way to create cloud Supabase users without printing passwords to a
  terminal, and harden the GitHub Actions deploy pipeline before any feature branch needed it.
- Work done directly by Johannsen (no agent delegation recorded for this scope):
  - `dad427f` "Set up project skeleton" — initial commit.
  - PR #1 "Add a script to create users in the cloud projects" (`d71380b`): `create-user.mjs` creates
    a confirmed user with a role in the dev or prod Supabase project and keeps the generated password
    out of the terminal.
  - PR #2 "Harden the deploy pipeline" (`bf86f1b`): pins workflow actions to exact commits (so a moved
    version tag cannot change the code that runs with deployment secrets), adds a post-deploy check
    that `/login` loads and `/` redirects to it (a broken deployment now fails the run instead of
    passing silently), and documents migration rules in the Developer Guide — stay compatible with
    deployed code, never edit a merged migration, no schema changes through the dashboard, RLS on
    every table. `5e9b29d` "Allow manual redeploys from the Actions tab" was added to the same line of
    work.
  - PR #3 "Release: deploy pipeline hardening, user script, PR template and docs" (`485b80e`, develop
    → master): also added a PR template reminding contributors to target `develop`
    (`0e0a002`) and a Developer Guide note on why development deployments are public
    (`6a7dbc9`).
- Artifacts: `workflow/scripts/create-user.mjs` (not re-inspected for this log; referenced by PR body
  only), `.github/workflows/deploy.yml`, `.github/pull_request_template.md`, Developer Guide updates.
- Verification evidence (from the PR #3 body, written by Johannsen): CI passed on both feature PRs
  (#1, #2); both `develop` deployments succeeded, including the new post-deploy site check. No
  independent reviewer is recorded on PRs #1–#3 (`reviews: []` in each `gh pr view` result).
- No credentials, `.env` contents, or production data are referenced in any of the above; the user
  script's entire purpose is to avoid printing the generated password.

Generated summary awaiting independent human verification.

## Claude Code agents for the four workflow roles — 2026-10-19

- Context: Joseph had already set up four native OpenAI Codex role agents (`requirements_architect`,
  `developer`, `tester_verifier`, `security_reviewer`) and a human-gated SDD/multi-agent workflow —
  see `logs/agent-setup/2026-10-17-summary.md`, `logs/workflow-guardrails/2026-10-17-summary.md`, and
  `workflow/handoffs/project-setup/` (all authored by Joseph, commits `87a8951`/`662de03`). That work
  is cited here only as the prior state PR #26 built on; it is not Johannsen's own work.
- Requested/decided (Johannsen): give the team a Claude Code equivalent of the same four roles so
  either CLI can be used, without duplicating role instructions in two places.
- Work done (PR #26, "Add Claude Code agents for the four workflow roles", `b6c14ea`, closes #22):
  - `.claude/agents/{requirements-architect,developer,tester-verifier,security-reviewer}.md`. Each
    file only sets the agent's tool list and tells it to follow the `developer_instructions` string
    in the matching `.codex/agents/*.toml`, so role instructions stay in one source of truth (see
    `workflow/agents/README.md`'s "Claude Code" section and `.claude/agents/developer.md`).
  - Added technical tool limits Codex can only express as prose: `security-reviewer` gets only
    `Read, Grep, Glob` (genuinely read-only); `requirements-architect` gets no `Bash`; no Claude agent
    has the `Agent` tool, so a child agent cannot delegate further — this is the same no-delegation
    rule this very log-writing task is bound by.
  - `.claude/settings.json` denies, for the main session and every agent: reading `.env*` files,
    `git push`, `vercel deploy`/`--prod`/`env`, and `supabase db push`/`link`.
  - `.claude/skills/feature-specification` links to the existing `.codex/skills/feature-specification`
    so both tools share one skill.
  - Replaced the old `.claude/agents` → `workflow/agents/` link with compatibility notes; added
    `/.claude/` to `.github/CODEOWNERS` (flagged by the project's own sensitive-change classifier as
    an agent-controls change needing independent review).
- Review: Joseph reviewed and commented "All good" on commit `b6c14eae`. Merged 2026-10-19.
- Verification evidence: none beyond the review comment is recorded in the PR; no CI run details are
  quoted in the PR body itself.

Generated summary awaiting independent human verification.
