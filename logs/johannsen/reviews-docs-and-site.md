# Independent reviews, guides, product website, and logs

## Closing the review gap for ADM-02, ADM-03 and ADM-04 (21 Oct)

**Prompts**

- "i have pushed, also what else are we missing?"
- "[pasted the agent's own note: 'The repo's workflow has four roles: requirements, developer,
  tester, security reviewer. Your features currently stop after the developer step'] do this
  please. also do up logs, github page, site, user guide and developer guide"
- "fix"

**What the agent did**

- Pointed out that ADM-02, ADM-03 and ADM-04 had skipped the tester and security-reviewer steps of
  our own workflow.
- Ran a `tester-verifier` and a read-only `security-reviewer` on each feature. Each wrote a handoff
  with the commands it ran and the results (`1f1fbb6`). All six passed.
- Brought back the tester findings, which "fix" approved (`9f71393`):
  - ADM-02: a browser spec left test courses in the database, so a clean-up step was added;
  - ADM-03: the spec described line breaks the code does not show, so the spec and AC12 were
    amended and a plain-text test was added.
- Left two items open: a sequential rather than truly concurrent check in ADM-02 (low, accepted),
  and the earlier key-printing mistake in ADM-04 (waiting for my decision).

**What I checked or changed**

- I asked for the reviews as soon as the gap was raised, even though ADM-02 was already merged.

**Outcome**

- Every Administrator feature now has a spec, developer, tester and security handoff in
  `workflow/handoffs/`.

_Human verification: pending._

## User Guide, Developer Guide, and the product website (21 Oct)

**What the agent did**

- **User Guide:** rewrote `docs/UserGuide.md` to cover every current feature for all three roles,
  with screenshots.
- **Developer Guide:** expanded `docs/DeveloperGuide.md` with the design, the SDD and multi-agent
  workflow, the AI security controls, the environments, a map of `workflow/`, and the
  acknowledgements.
- **Website:** added `docs/index.md` and `docs/_config.yml`, so GitHub Pages serves `master`'s
  `docs/` folder as the product website.
- **Screenshots:** took them with a throwaway script, kept outside the repository. It adds
  temporary demo data to the local database (a second course, slots, bookings in every status,
  announcements), photographs each page, and then deletes every row it added. The first set looked
  empty, so they were retaken with that data (`057e5cb`).

**What I checked or changed**

- The student and lecturer sections of the User Guide still need Joseph and Jordan to confirm they
  match their pages, because peer testers will count any mismatch as a bug.
- The User Guide still has one TODO: which accounts peer testers should use on production.

**Outcome**

- Commits `bdf9ca1`, `b4dad99` and `057e5cb` on `docs/guides-site-logs`, not yet pushed.

_Human verification: pending._

## Lecturer permission bug found while taking screenshots (21 Oct)

**What the agent did**

- The lecturer dashboard showed "permission denied for table consultation_slots" and "permission
  denied for table courses" when signed in as the demo lecturer.
- Traced two causes:
  - Joseph's browse-slots migration (`20261018000000`) revoked all table access on
    `consultation_slots` from signed-in users, and no later migration granted it back, while the
    lecturer pages still query those tables directly;
  - a course policy compares `cl.course_id = cl.id` instead of the course's own ID.
- The database tests run as the superuser, so they never notice a missing grant.

**What I checked or changed**

- Not fixed yet. The agent recommended fixing it in a new migration, with database tests that run
  as a real signed-in lecturer and student, in a pull request for Jordan to review. The decision is
  mine and still open.

_Human verification: pending._

## These logs (21 to 22 Oct)

**Prompts**

- "open the logs so i can see"
- "what kind of logs are we suppose to do? base on the requirements"
- "yes please. do not need to write for reflection first but finish the logs for me"

**What the agent did**

- Wrote the first version of these logs from repository evidence only: commits, pull requests,
  specs and handoffs (`bdf9ca1`).
- When I asked what the brief requires, it read the MP3 brief from Canvas: "summaries of all the
  prompts and interactions", produced by AI, and checked by us.
- It then rewrote every log around my actual prompts, taken from the Claude Code session transcript.
  Every section now gives the prompts, what the agent did, what I checked or changed, and the
  outcome.

**What I checked or changed**

- **Correction caught by the rewrite.** The first version said the 17 Oct set-up had been "done
  directly by Johannsen (no agent delegation recorded)". That was wrong: the transcript shows
  Claude Code built it at my direction. Because the first version only looked at Git, it could not
  see the AI's part. That is why the brief asks us to verify AI summaries.
- Also corrected: the ADM-02, ADM-03 and ADM-04 sections had said their independent reviews were
  still in progress, but all six reviews had finished and passed.
- I still need to read each section against the cited commits and pull requests, and replace each
  "Human verification: pending" line.

_Human verification: pending._
