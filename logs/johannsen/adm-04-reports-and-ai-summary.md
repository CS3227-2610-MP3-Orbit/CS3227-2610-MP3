# ADM-04 administrator booking reports and AI activity summary

## Specification and owner decisions a to d (20 to 21 Oct)

**Prompts**

- "sounds good" (go ahead and draft the ADM-04 spec while the UI work runs)
- "whats next? write me a pr for ui identity its already pushed, then whats the next sdd"
- "lets do a, b,c,d approve"

**What the agent did**

- The `requirements-architect` agent drafted
  `workflow/specs/admin/ADM-04-booking-reports-and-ai-summary.md`: a Reports page with booking
  counts for a chosen period, and an optional AI summary of those counts. This is the
  Administrator's AI feature.
- Before the build, the coordinator checked the draft against the latest `develop` and corrected
  three things:
  - the shared AI quota (`claim_ai_attempt`, 100 successful responses per SGT day for everyone) now
    existed from Joseph's PR #34, so the AI half was no longer blocked. This also replaced my own
    planned quota work (issue #21, `decideQuota`);
  - that quota only admitted Joseph's `student.improve-request`, so R10 was added to admit the admin
    summary too;
  - the feature name became `admin.activity-summary`, and the key settings `SOCLAAS_*`, to match
    the existing code.

**What I checked or changed**

- I approved four decisions the agent put to me:
  - (a) count bookings by the slot's start time, not when the booking was made;
  - (b) zero-fill the by-day and by-status counts, but list only courses and lecturers that have
    bookings;
  - (c) cap the AI summary at 1,200 characters;
  - (d) answer "not configured" locally, before any AI call, when no key is set.

**Outcome**

- Spec approved on 21 Oct (`b6de978`) with R1 to R10 and AC1 to AC15.

_Verified by Johannsen on 22 Oct._

## Quota allowlist gap found while reviewing Jordan's PR #33 (21 Oct)

**Prompts**

- "https://github.com/CS3227-2610-MP3-Orbit/CS3227-2610-MP3/pull/33 also approve this if its okay"
- "can you look back into #33"
- "whats adm04 in the#33's review? or should we just approve it and do the fix on our end"

**What the agent did**

- A review agent found two blockers in Jordan's lecturer AI briefing. The coordinator re-checked
  both itself before reporting them:
  - the shared quota admitted only the student feature, so `lecturer.ai-briefing` would always
    answer "unavailable" before any AI call;
  - Jordan's seed data reused a protected admin's ID.
- Explained that ADM-04 already had to change the same allowlist, so the cleanest fix was one
  migration that admits all three features.

**What I checked or changed**

- I chose to approve #33 and fix the allowlist on my side rather than block Jordan. The review
  comment, posted under my name, explains this. Jordan fixed the seed ID clash in #33.
- ADM-04's R10 was widened to admit `student.improve-request`, `admin.activity-summary` and
  `lecturer.ai-briefing` on the same shared daily limit (`9eb2e7f`), with a pgTAP test for each.

**Outcome**

- PR #33 merged on 21 Oct. Lecturer briefings show "temporarily unavailable" until ADM-04 (#37)
  merges.

_Verified by Johannsen on 22 Oct._

## Build, PR #37 (21 Oct, open)

**Prompts**

- "open adm-04 please."
- "hows it is it pushed to pr? also what other sdd should we need"

**What the agent did**

- A `developer` agent built `/admin/reports` in a separate worktree:
  - last 7 or 30 days, or a custom range of up to 92 days;
  - counts by status, course, lecturer and day;
  - "Summarise this period", which compares the period with the one before it.
- The summary is labelled "AI-generated — advisory", capped at 1,200 characters, and never stored.
- **Privacy.** The report and the AI prompt contain only counts and course or lecturer names, never
  student names or consultation text. Names are wrapped with `wrapUntrusted`.
- Migration `20261021100000_admin_booking_reports.sql` adds `admin_get_booking_report` (admin
  only, `search_path = ''`, 92-day limit) and the re-created `claim_ai_attempt`.

**What I checked or changed**

- **Agent mistake, reported by the agent itself:** while checking the local stack, the developer
  agent once ran `npx supabase status -o json` directly, which printed the local stack's keys into
  its own tool output. The keys are local-only and were not stored or sent anywhere, but this broke
  the "never print a key" rule. Every later load used the silent loader. The agent recommended
  accepting it; I have not yet recorded a decision.
- I asked for the pull request to be opened under my name.

**Outcome**

- Local checks recorded in the PR body: both verify profiles passed; 196 pgTAP tests; 212 unit
  tests; traceability 0 errors with AC1 to AC15 each covered; ADM-04 integration 7/7; admin browser
  tests 15/15.
- Not run: a live AI call, because there was no key locally.

_Verified by Johannsen on 22 Oct._

## Completed-booking count bug, R11 and AC16 (21 Oct)

**Prompts**

- "what else in terms of featuers are we missing?"
- "fix the ci" and, during that turn, "also fix the bug"

**What the agent did**

- Found the bug while checking for missing features. Jordan's LEC-03 shows a booking as "completed"
  once its slot has ended, without changing the stored status. The report counted stored statuses
  only, so it always showed 0 completed.
- Followed the SDD order:
  - added `ADM-04-R11` and `AC16` to the spec, with my approval recorded;
  - wrote a failing test first, which showed a completed delta of 0 where 1 was expected;
  - added a new migration, `20261021110000_admin_booking_reports_derived_completion.sql`;
  - re-ran the checks.
- Used `now()` rather than `clock_timestamp()`, so the function could stay `STABLE`.
- An early version of the test only asserted "at least 1". It was tightened to compare before and
  after counts, so other rows in the shared database could not hide a failure.

**What I checked or changed**

- "also fix the bug" was my approval of the spec change.

**Outcome**

- Integration 8/8, 230 unit tests, pgTAP, lint, typecheck and traceability all passed. Commit
  `9db775e`.

_Verified by Johannsen on 22 Oct._

## Independent tester and security review (21 Oct)

**Prompts**

- "[pasted the note that ADM-02 to ADM-04 had stopped after the developer step] do this please.
  also do up logs, github page, site, user guide and developer guide"
- "is the ai feature working already?"

**What the agent did**

- A `tester-verifier` and a read-only `security-reviewer` both passed ADM-04, including AC16
  (`workflow/handoffs/adm-04/2026-10-21-adm-04-*.md`, commit `1f1fbb6`).
- Gave an honest AI status:
  - the student AI is live on the development site;
  - the lecturer briefing waits for #37;
  - the admin summary is not deployed yet;
  - no live SoC LLM call has been tested in this session;
  - production needs `SOCLAAS_BASE_URL` and `SOCLAAS_API_KEY` set in Vercel before the release,
    which only I can check.

**Outcome**

- PR #37 is open with CI 8/8 green, waiting for teammate review. It must merge before release #35,
  or production would ship a lecturer briefing that only says "unavailable".

_Verified by Johannsen on 22 Oct._
