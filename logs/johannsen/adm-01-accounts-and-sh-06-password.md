# ADM-01 administrator accounts and SH-06 change own password

## Specification and owner decisions (19 Oct)

**Prompts**

- "lets pull main, branch it out to our registration then tell me what we need to do for my part"
- "wait for the merger did we not merge those things into development?" and "so when we pull from
  develop, we have joseph's stuff as well rigt"
- "1. show it once yeah. 2. okay. 3. yesadmins can create or promote tother amins."
- "for number 3 Admins can create and promote admins. You still can't change your own role or
  deactivate ourself. [...] Since admins can manage other admins, two admins could demote or
  deactivate each other at the same moment and leave zero active admins this one should be caught
  right? that this should not happen. also our first admin that is created should not be demoted or
  changed such that in security we still have this account to "save" the accounts"
- "i dont get it, is sdd review spec before webuild? im confused" and then "i approve it already,
  lets build!"
- "1. length we should be able to copy this password and save it somewhere (Think like getting an
  api key i can copy then press done to not see it anymore). we dont need the guaranteed variety.
  we should also let users be able to change password of their own accounts right? or"
- "both a and b."

**What the agent did**

- Branched `feature/admin-registration` from `develop`, which already had Joseph's student work, not
  from `master`.
- The `requirements-architect` agent drafted `workflow/specs/admin/ADM-01-manage-accounts.md`
  against `PRODUCT-SPEC.md` and `SH-01`. It asked me numbered questions instead of guessing.
- Proposed a 24-character letters-and-digits password, generated with Node's `crypto.randomInt`.
  It is shown once with a **Copy** button, and **Done** clears it.
- When I asked about users changing their own password, it offered two pieces: (a) a new shared
  spec `SH-06` for any user to change their own password, and (b) `ADM-01-R9` for an admin to reset
  someone else's password. I chose both.

**What I checked or changed**

- I added two requirements the agent had not proposed:
  - `ADM-01-R7`: refuse any change that would leave zero active administrators, even when two admins
    act at the same moment;
  - `ADM-01-R8`: one protected recovery administrator that no other admin can demote, deactivate or
    reset.
- I was unsure whether SDD meant approving the spec before building. The agent explained that it
  does, and I approved the spec before any feature code was written.

**Outcome**

- ADM-01 approved on 19 Oct with R1 to R9. Decisions are recorded in the spec's "Document control".

_Human verification: pending._

## Build, security fixes, and bugs caught by re-running tests (20 Oct)

**Prompts**

- "before we continue, can you pull the latest developer branch, merge it into ours then tell me
  what has changed as well as what we have done"
- "hmmm, lets do everything our part first. how do i test the confirm that protected?" and "how do
  i test it? open up the broswer for me as well as which account to log in to."
- "how did jordan and joseph build their ui? as well as how we should build ours"
- "yes for 1, approved for 2, approve for 3" (block resetting the protected admin's password;
  re-approve ADM-01; approve SH-06)
- "before we continue tell me what this app is about as well as the admin's role" and "okay let me
  know when its done"
- "look into the running task why is it taking so long lol i think its bugged"
- "how can i test them? and fix those issues for me"
- "i dont get it how do i test? you will open one that is local for me to test with local b? or"
  and "okay let me know when its done and open it up so i can test"
- "[screenshot] for protected i can change password? also why is the ui so bad, did joseph and
  jordan update their part for ui?"

**What the agent did**

- Compared Joseph's and Jordan's code and proposed one layout for the admin feature: thin pages and
  actions in `src/app/admin/`, validation and server logic in `src/features/admin/accounts/`.
- Ran two `developer` agents in parallel: one for the admin accounts pages, one for SH-06.
- Added `admin_set_role`, `admin_set_active`, `admin_revoke_sessions` and `admin_list_accounts` as
  `security definer` database functions. It dropped the old direct-update policy on `profiles`, so
  role and active changes can only go through those checked functions.
- Added two local-only demo administrators to the seed: `demo-admin` (protected) and `demo-admin2`.
- An automated security scan flagged that a password reset left the target's existing sessions
  signed in. The agent proposed three fixes:
  - A: changing your own password signs out your other sessions (`SH-06-R6`);
  - B: an admin reset signs out every session of that user (`ADM-01-R10`);
  - C: at most 5 wrong current-password attempts per 15 minutes, failing closed (`SH-06-R7`).
- It also recorded a limitation: refresh tokens are revoked at once, but an access token that was
  already issued stays valid for up to 1 hour. For a compromised account, deactivate first.

**What I checked or changed**

- "fix those issues" approved fixes A, B and C. Both specs were updated first, then tests, then code.
- **Bug caught by re-running a "blocked" result.** The SH-06 developer agent reported its browser
  test as blocked by the test setup. When the coordinator re-ran it on a quiet machine, it found a
  real bug: the change-password button never became clickable. The agent had built its own
  JavaScript lock to keep passwords out of the URL, which Next.js server actions already do, and
  the lock never released. The bug was sent back for a fix cycle and passed on re-test.
- When I asked why a task was taking long, the coordinator found that both developer agents were
  trying to run a dev server from the same folder, which Next.js 16 does not allow.
- I tested in the browser with the demo accounts. I checked that the protected account can still
  change its own password; that is intended, because the protection is only against other admins.
- Jordan's new migration used the same version number as ours, so our four migrations were
  renumbered to run after Jordan's.
- The bare look of the pages led to the separate SH-07 design-system work.

**Outcome**

- Four migrations (`20261020100000` to `20261020130000`), the `/admin/accounts` page, the
  `/account/password` page, and `requireUser()` in `src/lib/auth/session.ts`.
- Local checks before the pull request: database tests, database lint, format, lint, typecheck, 126
  unit tests, ADM-01 and SH-06 integration 11/11 each, browser tests, traceability 0 errors, and the
  secret scan.

_Human verification: pending._

## Independent review, CI fix, and merge, PR #30 (20 to 21 Oct)

**Prompts**

- "okay looks good, so everything is done for our SDD for this spec right? can you create a pr
  under my github instead of putting claude"
- "i have pushed [pasted push output]" and "ive pushed it"
- "so all our prs are green now?"
- "merge please, its already approved right."

**What the agent did**

- The `tester-verifier` agent found no defects. It added 15 live tests, including a real
  two-connection race for `ADM-01-AC14`: two admins demote each other at the same moment, exactly
  one change commits, and one active admin remains.
- The read-only `security-reviewer` agent passed it with three low or informational findings. The
  race finding was closed by the tester's test above. Its note that the admin dashboard can read
  students' consultation questions was recorded for a later privacy spec.
- Wrote the PR #30 body under my account, with no Claude attribution.
- **CI fix:** the general browser-test job ran every spec, including the account and password specs
  that need the local stack's secret key. The agent excluded those specs from that job and added a
  separate "Accounts and passwords" CI job, which starts a local Supabase and loads its keys without
  printing them (`74ce642`).

**What I checked or changed**

- I pushed the branch myself, and asked for the pull request to show only my name.
- I merged only after Joseph's review.

**Outcome**

- Joseph reviewed: "Looks good! Thanks for the detailed verification update. The dedicated Accounts
  and passwords job sounds like the correct way to handle tests requiring the local Supabase secret
  key without weakening the general E2E suite or exposing credentials". PR #30 merged on 21 Oct.
- Handoffs: `workflow/handoffs/adm-01/2026-10-20-adm-01-sh-06-tester.md` and
  `2026-10-20-adm-01-sh-06-security-reviewer.md`.

_Human verification: pending._
