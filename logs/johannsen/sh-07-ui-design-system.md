# SH-07 shared UI design system and Orbit visual identity

## Why a design system, and the spec (20 Oct)

**Prompts**

- "[screenshot] for protected i can change password? also why is the ui so bad, did joseph and
  jordan update their part for ui?"
- "okay lets go to feature 2 as well as another agent working parallel for the ui. referencing a
  management ui right [calendar screenshot] and what other kind of app should i find reference
  for?"
- "looks good approved lets go ahead."

**What the agent did**

- Checked that no teammate had changed the UI. The app still had the default Next.js starter look,
  with every page styled by hand.
- Recommended a team-wide fix rather than restyling only the admin pages, because the brief grades
  shared components for SRP and DRY.
- Suggested reference apps per role: Cal.com and Calendly for student booking, Google Calendar for
  lecturer availability, the Clerk, Supabase and Linear user tables for admin accounts, and Stripe
  for reports.
- The `requirements-architect` agent drafted `workflow/specs/shared/SH-07-ui-design-system.md`:
  - shadcn/ui components generated into `src/components/ui/` as committed source;
  - one shared app shell with a sidebar for all three roles;
  - light theme by default, dark mode following the system setting;
  - colour tokens only, with no hard-coded colours outside the kit;
  - presentation only: no change to behaviour, data access, routes, or any text a test relies on.

**What I checked or changed**

- I chose shadcn/ui over hand-written components, and the light management-dashboard direction
  from my reference screenshot. I approved the spec with the agent's recommendations: a 768px
  sidebar breakpoint, the Geist font, and a `check:colors` script in `npm run verify`.

**Outcome**

- SH-07 approved on 20 Oct.

_Human verification: pending._

## Building the kit and restyling every page, PR #31 (20 to 21 Oct)

**Prompts**

- "pushed. no need logs for now, but please write user guide and develoeper guide"
- "okay i have pushed them how do i test the style? can you screenshot and make a html for me? (Do
  not put this in git or in this folder)"
- "hows the ui looking? can you open up for me to test" and "in the case just give me some
  screenshots"

**What the agent did**

- A `developer` agent built the kit, the shared `RoleShell` and `AppSidebar`, and restyled login,
  the student, lecturer and admin pages, and change password.
- It found a hidden development bug: Next.js 16 blocked client JavaScript for browser tests on
  `127.0.0.1`, so no client component ever loaded. Forms still seemed to work through the
  plain-POST fallback, which masked the bug until the sidebar toggle needed real client code. Fixed
  with `allowedDevOrigins` in `next.config.ts`.
- It removed the kit's cookie that remembered the sidebar state, because the spec forbade new cookie
  writes. Native `<select>` elements were kept, so form behaviour did not change.
- Wrote the User Guide and Developer Guide sections for my features.
- Made a private screenshot page for me to review the style. As I asked, it was not added to Git or
  the project folder.

**What I checked or changed**

- I reviewed the look through screenshots, then in the browser with the demo accounts.
- I asked for the session logs to wait until later (they are done now).

**Outcome**

- Local checks recorded in the developer handoff: lint, typecheck, 126 unit tests, colour check
  over 87 files, traceability 0 errors, build, regression and browser tests. One change-password
  browser test failed both with and without the change, so it was recorded as pre-existing.
- Joseph reviewed ("Looks good!"). PR #31 merged on 21 Oct.

_Human verification: pending._

## Orbit visual identity, PR #36 (20 to 21 Oct, open)

**Prompts**

- "[screenshots of the SuperCane dashboard and the Zendenta reservations app] can we make the ui
  more fun please. also check mr prs we need to fix ci"
- "in draft??? please built it.."
- "hows it going? for those pr approved merge it as well as hows the ui going and our next sdd"
- "whats next? write me a pr for ui identity its already pushed, then whats the next sdd"
- "for our ui its failing ci"

**What the agent did**

- The `requirements-architect` agent wrote a material amendment to SH-07, adding R9 to R16 and AC12
  to AC20. That set the spec back to draft until I re-approved it:
  - an Orbit wordmark and nav icons;
  - a time-of-day greeting with per-role stat tiles;
  - shared status pills;
  - responsive tables, with create dialogs for accounts and courses;
  - friendlier empty states.
- Two `developer` passes built it in teal. A new contrast test checked the colours as they actually
  render (a translucent pill on the card) and found that the red "destructive" pill failed WCAG AA,
  so it was retuned.
- Fixed a duplicate `id="role"` on the accounts page.
- The only CI failure on #36 was the formatting of one handoff note. It was fixed and I pushed it.

**What I checked or changed**

- I expected the identity work to be built already ("in draft???"). The agent explained that
  changing an approved spec needs my approval again, so it waited for me. I approved it with its proposed
  greeting times (SGT morning 05:00 to 11:59, afternoon 12:00 to 17:59, evening otherwise) and no
  "available slots" tile for students.
- The screenshots made the green and amber pills look hard to read. Under the measured contrast
  they passed AA, but they were darkened anyway, and I still need to re-check them visually.
- **Agent mistakes, reported by the agent itself:** one developer agent printed part of the local
  demo key before switching to the no-print loader, and ran `npm run build` once in the shared
  folder while my dev server was running. Both involved local-only data. The agent recommended
  accepting them without rotating keys, because the local stack is disposable; that decision is
  still mine to record.

**Outcome**

- Local checks recorded in the PR body: all 10 verify steps, 206 unit tests, colour check over 123
  files, traceability 0 errors, integration 26/26, 12/12 and 11/11, admin browser tests 21/21.
- PR #36 is open with CI 8/8 green. Joseph needs to review the student page changes, and Jordan
  the lecturer ones.

_Human verification: pending._
