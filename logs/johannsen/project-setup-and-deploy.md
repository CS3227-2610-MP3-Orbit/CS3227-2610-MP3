# Project setup, deployment, and agent infrastructure

## Understanding MP3 and choosing the stack (17 Oct)

**Prompts**

- "hey claude, look into my mp3 from canvas, tell me what we need to do."
- "lets brainstorm, so what we want to do is consultant booking [screenshot and a pasted feature
  proposal] maybe something like this, what are your thoughts"
- "all good, we dont want to stay in java and dont want to reuse mp2. soemthing more web-native. the
  plan is to use supabase as well as hosting on vercel, making sure that we use github actions as
  well as having a prod and development seperation. Also look into [two pasted forum answers]"
- "so all calls go through vercel's cloud functions right? or how does it work?"
- "so i will have two supabase right one for prod one for development,and whats the soc llm
  quesiton?"
- "yes please check on SoC LLM docs"

**What the agent did**

- Read the MP3 brief through the Canvas connector and listed the deliverables: one AI feature per
  role, SDD, multi-agent workflow, AI security, separate dev and prod, and the repository layout
  (`src/`, `workflow/`, `docs/`, `logs/`).
- Ran a brainstorming pass on the consultation-booking idea and mapped it to three roles.
- Explained how Next.js server code runs as Vercel functions, and proposed two Supabase projects
  (development and production).
- Read the SoC LLM documentation: the API is OpenAI-compatible, while the docs and key portal are
  NUS-only.

**What I checked or changed**

- I chose the stack and the "no Java, no MP2 reuse" direction myself.
- I used the instructor's forum answers as the authority: Vercel and Supabase with GitHub Actions
  deployments are allowed; the AI key must be the team's own, kept server-side, with usage control;
  only Codex and Claude may be used.

**Outcome**

- Stack: Next.js (App Router) on Vercel, Supabase for the database and sign-in, GitHub Actions for
  CI/CD, SoC LLM for AI.
- Roles: Student (Joseph), Lecturer (Jordan), Administrator (Johannsen).

_Human verification: pending._

## Repository skeleton and CI/CD (17 Oct)

**Prompts**

- "okay looks good, now i want to create a skeleton strucutre so my teammates joseph and jordan can
  work on it. We have three parts right, Studnet(joseph), lecturer(jordan), administrator
  (johannsen)"
- "do not include whatever we have discussed in the readme, the repo we want to create is a clean
  repo with just the skeleton structure dont push yet. We also want to add in the ci/cd or github
  action for the supabase and vercel right?"
- "also we need to focus on SDD developent right"
- "[pasted forum post about OpenSpec] also what does this mean? this is from my prof"
- "wait, why are we doing the database? is it part of the skeleton? there is no ui or anything done
  right"
- "no need, we can push the login with the first skeleton init. but i need to make sure the whole
  ci/cd skeleton is there where we have the two database as well as vercel prod/developmnent or
  preview "branch""

**What the agent did**

- Built the skeleton: a sign-in page, one layout per role, `requireRole`, and the Supabase clients.
- Wrote the first migration: `profiles` and `ai_usage` tables with row-level security, and the
  `current_app_role()` helper.
- Added the AI gateway: `generateText` with a claim-then-count quota that fails closed, a 20-second
  timeout, a 4,000-character input cap, and `wrapUntrusted` for user text.
- Set up the SDD workflow folder: a spec template, `SH-01-foundation.md`, a handoff template, and
  `check-traceability.mjs`, which fails CI when an acceptance criterion has no tagged test.
- Added GitHub Actions: `ci.yml` (lint, types, unit tests, traceability, build, database tests),
  `deploy.yml` (develop deploys to the development environment, master to production), and
  `keepalive.yml`.
- Added `.claude/settings.json` deny rules for `.env*` reads, `git push`, `vercel deploy`/`env`,
  `supabase db push` and `supabase link`.
- Explained the OpenSpec forum post: existing SDD toolkits may be studied but not used, so the
  team's SDD process had to be its own.

**What I checked or changed**

- I kept the README free of our planning discussion and held the push until I had reviewed it.
- When the agent started on database work, I asked why it was part of a skeleton. We agreed to
  ship only the sign-in flow and the minimum schema it needs, plus the full CI/CD pipeline for both
  databases and both Vercel environments.
- The agent's own review of the gateway found three problems, which it fixed before the first
  commit:
  - a regex sanitiser that could be bypassed, replaced with escaping;
  - a check-then-insert race in the quota, replaced with claim-first;
  - quota counting that failed open, changed to fail closed.

**Outcome**

- Initial commit `dad427f` "Set up project skeleton".

_Human verification: pending._

## Accounts, secrets, and the first deployment (17 Oct)

**Prompts**

- "i have the two supabase as well as vercel account, what do i do noW?"
- "and can you help me to set up github environments? can you open maybe a txt file i can put those
  keys"
- "what account are you talking about? [pasted `vercel env ls` output showing no variables]"
- "must i manualy add? any script?"
- "open the file so i can add it"
- "okay done, just htat i dont have the soc llm api key yet"
- "do i need to pay for preview branch? or"
- "[screenshot of a failed deployment] what issue is this? is it a need for manual deployment? or
  can we do auto witha command?"
- "[screenshot] why do we need accesss also?"

**What the agent did**

- Wrote `workflow/scripts/setup-github.sh` and `setup-vercel-env.sh`. Both read a gitignored
  `.env.secrets` file that I filled in myself; the agent opened the empty file for me but never
  read it back.
- Created two GitHub environments: `development` (develop and master) and `production` (master
  only, with all three of us as required reviewers).
- Turned off Vercel's own Git deployments, so every deployment goes through GitHub Actions.

**What I checked or changed**

- Problems found while I ran the scripts and pasted the output back:
  - the Vercel org and project IDs I entered were wrong, so they were taken from
    `.vercel/project.json` instead;
  - Preview environment variables were silently not saved, because the Vercel CLI asked for a Git
    branch after its input had closed. Passing an empty branch fixed it;
  - GitHub Actions was disabled on the repository, and I enabled it;
  - the first Vercel deployment was promoted to production automatically. The proper master
    deployment replaced it.
- I deferred the SoC LLM key, because the team did not have one yet.

**Outcome**

- Both environments deploy through Actions, and `vercel env ls` lists the variables for each.

_Human verification: pending._

## Branch model and pipeline hardening, PRs #1 to #3 (17 Oct)

**Prompts**

- "so our main default branch will be develop? how about master? the submission needs the master
  branch right? or" and then "yes please."
- "so is our github deployment correct? or good practice in terms of the evelopemnt and
  production?"
- "so the pr process is to developemnt branch right?"
- "can you create them for me? Then i want to create a readme for my teamamtes joseph and jordan to
  tell them about our skeleton, new flow, how to go about doing prs to the different branch, our
  supabase developmnent and production database, vercel as well and how to do migration, add data
  or columns to the databae etc"
- "the guide i dont need it to be on github i just need a html where i can send them right? and
  whats the four pipeline fixes"
- "1. what do you mean the keys are readable by any workflow? 2. do you have the accounts already
  for me? as well as the user handbook should have the default accounts rihgt? 3. what do you mean
  pin? 4. whats the migration safety rule?"
- "for prod can we not use the same test account first?"
- "okay sure 1. dont worry about it first. 2. handbook no password just showing account or guide, 3. i dont gets, 4. looks godo"
- "dont need branch protection for now right" and "do we really need dependant bot"
- "okay so for now i want to pr and merge and push to master as well since its workign right"
- "1. i have pushed. 2. please go ahead, 3 4 and 5 as well"

**What the agent did**

- Made `master` the default branch, with the flow feature branch → pull request into `develop`
  (deploys to development) → release pull request into `master` (deploys to production after
  approval).
- PR #1: `create-user.mjs` creates a confirmed user with a role in either cloud project, without
  printing the password.
- PR #2: pinned every Action to an exact commit; added a post-deploy check that `/login` loads and
  `/` redirects to it; wrote migration safety rules in the Developer Guide; allowed manual redeploys.
- PR #3: release to master, plus a pull request template reminding contributors to target
  `develop`.
- Wrote a team handbook as a private HTML page to send to Joseph and Jordan. It is not in the
  repository.

**What I checked or changed**

- I asked for each of the four proposed fixes to be explained before agreeing. I skipped fix 1
  (moving secrets to environment scope) for now, kept passwords out of the handbook, and turned
  down branch protection and Dependabot.
- **Oversight issues to note honestly:**
  - PRs #1 and #2 were merged two minutes after they were opened.
  - PR #3 was merged before its own CI run had finished. The agent told me, and the production
    deployment re-ran CI, which passed.
  - The production deployment gate was approved by the agent on my explicit instruction, not
    clicked by a teammate.

**Outcome**

- PRs #1, #2 and #3 merged on 17 Oct. Both develop deployments succeeded, including the new
  post-deploy site check.

_Human verification: pending._

## Leak check (17 Oct)

**Prompts**

- "so our skeleton is done right?"
- "is anything leaked? in terms of api keys and stuff or is our github repo good enough for mp3"

**What the agent did**

- Ran gitleaks over the full Git history: no leaks.
- Searched every commit, the logs of 11 Actions runs, and the 8 JavaScript bundles served by the
  live site for key patterns: none found. Only `.env.example` is committed.
- Checked readiness: the repository is public with `master` as default. Still missing at that point:
  GitHub Pages, and real content in the User Guide, Developer Guide, Reflections and logs.

**Outcome**

- No secrets in the repository or deployed site. The gaps it listed became later tasks.

_Human verification: pending._

## Planning SDD and the Claude Code role agents, PR #26 (19 Oct)

**Prompts**

- "okay now lets plan, we need to do SDD right? what else is in the requirments that we should
  follow before we start building our part"
- "1. only admin for now. 2. whats spec template? 3. lets use claude. 4.should we need to make our
  own agents for claude? 5. how do we do sdd? do we need to write a skill for it? 6. we should
  create an issue for each development we need to do right"
- "1. dont need to turn off for now. 2. understood, up to you for this to use or create. 3.4 okay
  go ahead. 5,6 sounds good lets go. Also do not pr or push messages as claude for future, remove
  them. i just want to see my name for the github contribution"
- "wait im confused, do we do the work first or create the pr? whats 26 for?"

**What the agent did**

- Explained the SDD order the repository already enforces: approved spec, then failing tests tagged
  with acceptance-criterion IDs, then code.
- Created issues #18 to #25: the four Administrator features (#18 accounts, #19 courses, #20
  reports and AI summary, #25 announcements), the AI quota (#21), the Claude Code agents (#22), the
  product website (#23), and the release before the deadline (#24).
- Added Claude Code versions of Joseph's four Codex role agents (PR #26, closes #22):
  - each `.claude/agents/*.md` sets only the tool list and loads its instructions from the matching
    `.codex/agents/*.toml`, so the role text stays in one place;
  - the security reviewer only gets read-only tools; the requirements architect has no shell; no
    agent can start another agent;
  - `.claude/` was added to CODEOWNERS.
- Applied the attribution rule: it cleaned the Claude lines from the bodies of PRs #1 to #3 and
  saved the rule as a memory for future sessions.

**What I checked or changed**

- I chose Claude Code agents over a custom skill, and one issue per feature.
- Six early commits still carry a Claude co-author line. The agent offered to rewrite history; I
  did not, because that would break teammates' branches.

**Outcome**

- PR #26 merged on 19 Oct after Joseph's review ("All good").

_Human verification: pending._
