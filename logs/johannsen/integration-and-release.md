# Integration, teammate reviews, and release

## Reviewing and merging Joseph's first pull requests, #4 and #11 to #13 (18 to 19 Oct)

**Prompts**

- "okay help me look into the prs that joseph did"
- "so its good right and we can approve both, as well as asking it to push to develop branch
  instead?"
- "okay sure can you help me approve both. and just update to change to develop branch"
- "okay check the rest of the prs what else is there to review?"
- "merge #4, 11 (after rereview do it for me) then 12 and then 13"

**What the agent did**

- Reviewed #4 (Joseph's AI workflow set-up) and #11 (student browse slots). Both had been opened
  against `master`, so the agent changed their target to `develop` before approving, to keep the
  release flow.
- When #11 gained the STU-01 code, it re-reviewed it at `126e7cb`. It then reviewed #12 (the
  request-consultation function and the one-active-booking rule) and #13 (update and cancel with
  locking and version checks).
- Merged #4, #11, #12 and #13 in the order I gave, using the GitHub CLI signed in as me.

**What I checked or changed**

- I decided the merge order, and that #11 needed a second review after its code changed.
- The approvals and merges appear under my GitHub account but were run by the agent on my
  instruction.

**Outcome**

- All four merged into `develop` on 19 Oct. Jordan also approved #4.

_Human verification: pending._

## Reviewing Joseph's student AI feature, PR #34 (20 Oct)

- Joseph's PR adds "Improve my request with AI" for students, plus the shared daily AI quota
  (`claim_ai_attempt`) that every role's AI feature now uses.
- I approved it myself on GitHub ("lgtm"), not through the Claude session. Joseph
  merged it on 20 Oct.
- This quota later replaced my own planned quota work (issue #21). See
  `adm-04-reports-and-ai-summary.md`.

_Human verification: pending._

## Merging the admin and UI work, and opening release PR #35 (21 Oct)

**Prompts**

- "hows it going? for those pr approved merge it as well as hows the ui going and our next sdd"
- "okay looks good, have we merged everything yet? and whats next?"
- "merge please, its already approved right."
- "then create a pr to master as well since jospeph, jordan and i had did some updates to the app"

**What the agent did**

- Confirmed that Joseph had reviewed #30, #31 and #32, then merged them into `develop`.
- Opened release PR #35 (`develop` to `master`) under my name. It lists every merged feature and the
  16 migrations that run on production. Two checks are listed for me to do first:
  - no duplicate course codes exist in production, or the new unique index would fail the
    deployment;
  - the AI keys are set for Vercel production.

**What I checked or changed**

- I merged only pull requests a teammate had reviewed. Joseph's reviews were comments ("Looks
  good!") rather than formal GitHub approvals. Joseph also reviewed #35 ("Looks good, ready to be
  merged to main branch!").

**Outcome**

- #30, #31 and #32 merged on 21 Oct. #35 is open. It now has to wait for #36, #37 and #38, so that
  production does not ship a lecturer briefing that always says "unavailable".

_Human verification: pending._

## Reviewing Jordan's lecturer AI briefing, PR #33 (21 Oct)

**Prompts**

- "https://github.com/CS3227-2610-MP3-Orbit/CS3227-2610-MP3/pull/33 also approve this if its okay"
- "can you look back into #33"
- "whats adm04 in the#33's review? or should we just approve it and do the fix on our end"
- "is it merged [pasted terminal output of a failed push]" and "merge it please."

**What the agent did**

- A review agent found two blockers, which the coordinator re-checked itself:
  - the shared quota would refuse the lecturer feature;
  - Jordan's seed data reused a protected admin's ID.
- It also confirmed that colour tokens, authorisation checks, untrusted-data wrapping and plain-text
  output were all correct.
- It posted an approving review under my name that explains the quota fix being made in ADM-04. As
  a non-blocking suggestion, it noted that the existing briefing test mocks too much to have caught
  the quota problem.
- My pasted push command had failed because of the spaces in the folder path, so the agent gave me
  a working command.

**What I checked or changed**

- I chose to approve and fix the quota on my side, rather than block Jordan's pull request.
- Jordan fixed the seed ID clash in the pull request before it merged.

**Outcome**

- PR #33 merged on 21 Oct (`b7eb3b4`).

_Human verification: pending._

## CI fixes during integration (20 to 21 Oct)

- **20 Oct, PR #30.** The general browser-test job ran the account and password specs, which need
  the local secret key. Fixed with a separate "Accounts and passwords" CI job (`74ce642`).
- **20 Oct, PR #32.** Joseph's concurrency tests reused course codes that the new unique index
  refuses. Fixed with unique codes per run (`0f25d6c`).
- **21 Oct, PR #36.** A handoff note failed the formatting check. Fixed by formatting it.
- **21 Oct, PR #38 ("fix the ci").** The new admin browser spec ran in the student job. Fixed by
  ignoring `admin-*.spec.ts` by pattern (`1f588fe`).

_Human verification: pending._
