# ADM-03 guidelines and announcements

## Finding the gap and approving the spec (21 Oct)

**Prompts**

- "what else do we need to do to make our part complete?"
- "no i mean in terms of features are we still missing anything"
- "lets go"
- "go" (approving the five recommended decisions)

**What the agent did**

- Compared `PRODUCT-SPEC.md` with the code. Administrator-published guidelines and announcements
  were promised to both Administrators and Students, but had no spec, migration or code. They were
  tracked only by issues #25 (marked optional) and #9.
- The `requirements-architect` agent drafted
  `workflow/specs/admin/ADM-03-guidelines-and-announcements.md` using the conventions already set
  by ADM-02, ADM-04 and SH-07.

**What I checked or changed**

- I decided to build it even though #25 was marked optional, because the product spec promises it
  to students.
- I approved five decisions:
  - title 1 to 120 characters and body 1 to 2,000;
  - new items start unpublished;
  - reads go directly through row-level security, with no new read function;
  - the reader card appears on both the Student and Lecturer dashboards;
  - a "Communications" sidebar group.

**Outcome**

- Spec approved on 21 Oct (`847a6b4`) with R1 to R10 and AC1 to AC15.

_Verified by Johannsen on 22 Oct._

## Build, a slow run, and a CI fix, PR #38 (21 Oct, open)

**Prompts**

- "pushed, any other pr we nede to approve"
- "hows it going" (three times), "why is it so long? done?" and "done?"
- "hows it going i have pushed it. so whats missing?"
- "fix the ci"

**What the agent did**

- Built `/admin/announcements`: create, edit, publish and unpublish, with nothing ever deleted.
  Students and lecturers see published items on their dashboard.
- Added the `announcements` table with row-level security:
  - admins read everything, including drafts;
  - active students and lecturers read only published items;
  - signed-out visitors read nothing;
  - all writes go through three admin-only `security definer` functions.

**What I checked or changed**

- **Why it was slow.** The developer agent was cut off by a network error before it committed, and
  reported build and browser-test failures. The coordinator traced them to its own shortcut: this
  worktree's `node_modules` was a link into another worktree, which the Turbopack build refuses to
  follow. After a real `npm ci` in this worktree, every reported failure disappeared, so they had
  not been defects in ADM-03.
- **CI fix.** The student browser-test job skipped admin specs by exact file name, so the new
  `admin-announcements.spec.ts` ran against the wrong database. The fix ignores `admin-*.spec.ts`
  by pattern, matching the admin config (`1f588fe`). I pushed it and CI went green.

**Outcome**

- Local checks recorded in the PR body: all 10 verify steps, 30 new pgTAP checks, announcements
  integration 11/11, browser tests 26/26.
- One accounts test fails locally only, because Jordan's seed-ID fix changed the admin IDs and my
  local database had not been reset. CI resets its database and passes.

_Verified by Johannsen on 22 Oct._

## Independent review and fixes (21 Oct)

**Prompts**

- "[pasted the note that ADM-02 to ADM-04 had stopped after the developer step] do this please.
  also do up logs, github page, site, user guide and developer guide"
- "fix"

**What the agent did**

- A `tester-verifier` and a read-only `security-reviewer` both passed ADM-03
  (`workflow/handoffs/adm-03/2026-10-21-adm-03-*.md`, `1f1fbb6`).
- The tester found that the spec said the admin list keeps line breaks, while the code shows a
  one-line preview. The spec and AC12 were amended to describe the real behaviour: at most 140
  characters, whitespace collapsed, and `…` where text is cut. Full views keep line breaks. A new
  `[ADM-03-AC12]` test checks that HTML-like text is shown as plain text (`9f71393`).

**What I checked or changed**

- "fix" approved both the spec amendment and the test changes.

**Outcome**

- PR #38 is open with CI 8/8 green. Merge order: #36, then #37, then #38, then the release.

_Verified by Johannsen on 22 Oct._
