---
id: SH-07
title: Shared UI design system and app shell
owner: team
status: approved
---

# SH-07: Shared UI design system and app shell

## Document control

- Approval (SUPERSEDED by the material revision below): approved by Johannsen on 2026-10-20 (owner
  approval) with the coordinator's recommendations for the proposed items: sidebar collapses to a menu
  button below `md` (768px); Geist via `next/font` (self-hosted); a colour check script outside
  `src/components/ui` run by `npm run verify`. Joseph and Jordan review changes to their pages on the
  pull request. `SH-07-R1`–`R8`/`AC1`–`AC11` remain the approved baseline this amendment builds on.
- Material revision (`TASK-SH-07B`, 2026-10-20): a "visual identity" amendment (`SH-07-R9`–`R16`,
  `SH-07-AC12`–`AC20`) invalidates the approval above per AGENTS.md ("material requirement changes
  invalidate approval"); status reset to `draft`. Author: `requirements_architect`; reviewed HEAD
  `0f25d6c` (branch `feature/ui-identity`).
- Approval of the material revision: approved by Johannsen on 2026-10-21 (owner approval, "please
  build it") with the coordinator's recommendations: greeting boundaries 05:00–11:59 morning,
  12:00–17:59 afternoon, 18:00–04:59 evening (SGT); the student "available slots" tile omitted; the
  carried-over sidebar-collapse, font and colour-check items as already approved.
- Digests (`git hash-object`): `src/components/role-shell.tsx` = `1b86f259135583a530a52910ffb35a9d45378b12`; `src/components/app-sidebar.tsx` = `702aeea345301056c6eda5b803151a5eba881d97`; `src/components/app-nav.ts` = `eec08a7887eb329b0f99c0dc99101f73fdebee0e`; `src/app/globals.css` = `829e311faa2f60fa50693768cec6de126e5e919e`; `src/components/ui/badge.tsx` = `c444f0281cc48ce43c4f0e7492358d0fa7866f23`; `.github/CODEOWNERS` = `879f936455b52ea7910c1258ad92f4e25b57334a`.
- Parent/shared requirements: `SH-01` (session/role resolution); `ADM-01`, `ADM-02`, `SH-06` (pages
  restyled/revised here — their accessible names/states, field names, and messages are the
  preservation target); `SH-07-R1`–`R8` (kit, shell, theming baseline this amendment extends, not
  replaces).
- Plan/handoff: no plan yet. Handoffs: `workflow/handoffs/sh-07/2026-10-20-sh-07-requirements-architect.md` (original); `workflow/handoffs/sh-07/2026-10-20-sh-07-identity-requirements-architect.md` (this amendment).
- Confirmed (original owner decisions, Johannsen, 2026-10-20, relayed by coordinator): shadcn/ui kit generated into `src/components/ui/` as committed source, Tailwind v4; light SaaS-dashboard visual direction with a left sidebar, neutral palette plus one accent colour, rounded cards, clear tables; light-by-default theme with automatic dark mode via `prefers-color-scheme`, shadcn CSS-variable tokens, no hard-coded hex in any component; one shared shell used by all three roles; restyle of every existing page; presentation-only — no behaviour, data access, validation, authorization, route, or test-relied-on-text change.
- Confirmed (`TASK-SH-07B` owner decisions, Johannsen, 2026-10-20): product name "Orbit" (wordmark +
  inline-SVG orbit mark, `<title>Orbit</title>`); a SuperCane-style deep teal/navy sidebar with icons
  per nav item and uppercase letter-spaced group labels, white/neutral content area, Geist Mono for
  eyebrow/numeric text, dark mode kept working; a per-role greeting + stat-tile row built only from
  existing server functions, omitting any tile an existing function can't price cheaply; coloured
  status-pill `Badge` variants for account/course/booking status and role everywhere they appear;
  accounts/courses as tables `≥ md` / cards `< md` with create moved into a `Dialog`; friendlier empty
  states; removal of the redundant "Back to dashboard" links. Calendar views stay out of scope.
- Proposed, needs review (carried over, unresolved by this amendment): the exact sidebar-collapse
  breakpoint/mechanism; whether to keep the current system-font stack or adopt a self-hosted
  `next/font`; the concrete lint/grep mechanism for the no-hard-coded-colour check (`SH-07-AC5`).

## Product and feature description

Every page today uses ad-hoc Tailwind class strings, and `RoleShell` has only a header, no sidebar. SH-07 adds a committed shadcn/ui kit, extends `RoleShell` with a role-specific collapsible sidebar, and restyles all existing pages onto the kit — a presentation-only refactor with no behavioural change.

## Scope, non-goals, and dependencies

**In scope**: `src/components/ui/` kit (shadcn/ui, Tailwind v4 CSS-variable tokens); one shared shell (sidebar + header) for student, lecturer, and admin; restyle of login, student (slots/request/bookings), lecturer (dashboard/availability/requests), admin (dashboard/accounts/one-time-password), and account/password. **Added by `TASK-SH-07B`**: product identity ("Orbit" wordmark/logo, page title); SuperCane-style teal/navy sidebar with icons, group labels, and Geist Mono eyebrow/numeric styling; a greeting + stat-tile row on each role dashboard; semantic status-pill `Badge` variants wherever a status/role already renders; accounts/courses as responsive tables/cards with create moved into a `Dialog`; friendlier empty states; removing the now-redundant "Back to dashboard" links.

**Non-goals**: new features, copy rewrites, animation beyond shadcn defaults, i18n, any change to `requireRole`/`requireUser`, Server Actions, validation, or routes; any new database function, migration, RPC, or AI call to compute a stat-tile number (an existing function that can't price a number cheaply means that tile is omitted, not a new query); calendar views (confirmed out of scope by the owner).

**Dependencies**: `SH-01` only (session/role read by the shell); no new table, RPC, or API.

## Users, roles, and permissions

| Actor                    | Allowed                                                    | Refused                         |
| ------------------------ | ---------------------------------------------------------- | ------------------------------- |
| Any signed-in role       | Sees own role's sidebar nav, header, theme, restyled pages | Seeing another role's nav links |
| Signed-out/inactive user | Restyled login page only                                   | Any shell/nav rendering         |

Nav items come from the server-resolved `user.role` already passed into `RoleShell` by each layout's `requireRole` call — no client-side role guess, and `SH-07` changes no authorization check.

## Functional requirements

### SH-07-R1 — Committed shadcn/ui kit

`confirmed`. Generate the minimal set the current pages need into `src/components/ui/` via the shadcn CLI — Button, Input, Label, Textarea, Select, Card, Badge, Table, Alert, Dialog, DropdownMenu, Separator, Skeleton, and a sidebar/simple sidebar-nav component — committed as real source, on Tailwind v4 CSS-variable tokens, no hard-coded hex anywhere in the kit or in pages.

### SH-07-R2 — Shared role shell with sidebar nav

`confirmed`. `RoleShell` (already used by all three layouts) gains a left sidebar whose nav items are defined once per role in a single config, not duplicated per page; header keeps the user's full name, "Change password" link, and "Sign out" unchanged; the sidebar collapses on narrow screens (`proposed` breakpoint/mechanism) while remaining keyboard-reachable.

### SH-07-R3 — Light default, automatic dark mode

`confirmed`. Light by default; dark mode follows the OS via `prefers-color-scheme`, driven entirely by shadcn CSS-variable tokens in `globals.css` — never a hard-coded colour in a component.

### SH-07-R4 — Restyle all existing pages

`confirmed`. Login, student (slots list, slot request, bookings list/detail), lecturer (dashboard, availability/slot form, request decisions), admin (dashboard, accounts list/create/one-time-password panel), and account/password switch from ad-hoc class strings to kit components for every button/input/label/textarea/select/card/table/badge/alert.

### SH-07-R5 — Presentation-only; tests unchanged

`confirmed`. No change to behaviour, data access, Server Actions, validation, `requireRole`/`requireUser` placement, routes, or any text an existing test asserts on; accessible names, ARIA roles, and labels that tests query by (`getByRole`, `getByLabel`, `role="status"`/`role="alert"`) are preserved exactly.

### SH-07-R6 — Accessibility

`confirmed`. Every input keeps a visible label; focus is visible on every interactive element in both themes; `role="status"`/`role="alert"` containers keep their current placement and content; colour contrast meets WCAG AA in light and dark; the sidebar is fully keyboard-operable with no keyboard trap.

### SH-07-R7 — No new runtime fetching or storage

`confirmed`. No new client-side data fetch or `localStorage`/`sessionStorage`/cookie write is introduced by the restyle. `proposed`: any font stays the current self-hosted system stack, or, if changed, loads only via `next/font` — no runtime external font/CDN request either way.

### SH-07-R8 — Ownership on review

`confirmed`. Restyling `src/app/student/**` or `src/app/lecturer/**` requires that owner's PR review per existing `.github/CODEOWNERS`; `SH-07` adds no new CODEOWNERS entry, since `src/components/ui/` and `src/components/role-shell.tsx` already fall under the catch-all `@JohannsenLum` owner.

### SH-07-R9 — Product identity: "Orbit"

`confirmed`. The product is presented as "Orbit": the sidebar header shows the wordmark "Orbit" next to a simple orbit-mark inline SVG (decorative, `aria-hidden="true"`, same link target as today's `homePathFor(role)`); `src/app/layout.tsx`'s `<title>` becomes "Orbit". Today's "Consultation Booking" text (page title and sidebar link) is a presentational selector with no existing test reference (verified by search) and may change freely.

### SH-07-R10 — SuperCane-style navigation visual language

`confirmed`. The sidebar uses new teal/navy CSS-variable tokens (light text on a deep teal/navy background, redefined for dark mode exactly like every other token) added to `globals.css`; every `NAV_ITEMS` entry gains a `lucide-react` icon, rendered decoratively (`aria-hidden="true"`) so each link's accessible name stays exactly its existing label text; each role's nav is organised under uppercase, letter-spaced group label(s) appropriate to that role's item count (admin: OVERVIEW/PEOPLE/TEACHING/BOOKINGS grouping Dashboard/Accounts/Courses/future booking items; student and lecturer keep the group label(s) that fit their shorter lists); the content area stays white/neutral. No new `<nav>` landmark is added — groups nest inside the single existing `nav aria-label="{role} navigation"` so `SH-07-AC2`/`AC9`'s single-`navigation`-landmark queries keep matching.

### SH-07-R11 — Mono styling for eyebrow/numeric text

`confirmed`. Geist Mono, loaded the same way as the existing Geist sans (`next/font/google`, no runtime CDN request, preserving `SH-07-R7`), is applied via a shared utility/token to eyebrow labels (e.g. group labels) and numeric stat-tile values only.

### SH-07-R12 — Greeting header and stat tiles

`confirmed` greeting + tiles; `proposed` exact boundary hours. Each role dashboard opens with "Good morning/afternoon/evening, {user.fullName}", where the morning/afternoon/evening bucket is computed by a new, unit-testable pure function from the current time in `Asia/Singapore`; the owner confirmed the greeting and SGT basis but not exact boundary hours, so this spec proposes 05:00–11:59 morning, 12:00–17:59 afternoon, 18:00–04:59 evening (the unit test in `SH-07-AC14` exercises exactly these boundaries) confirmed by the owner on 2026-10-21, followed by a row of stat tiles using only data already returned by an existing server function on that page: Admin — active accounts (`listAccounts({ activeFilter: "true" })`), active courses (`listCourses({ activeFilter: "true" })`), pending consultation requests (`listLecturerRequests()`, already fetched by `src/app/admin/page.tsx`); Student — upcoming/active bookings (`listMyBookings()`, counting `status` in `pending`/`approved`); Lecturer — own slots and pending requests (both already fetched by `src/app/lecturer/page.tsx`). Student "available slots" is a tile the owner asked for but is **omitted**: `browseAvailableSlots`/`browse_available_slots` is cursor-paginated (`limit 21`, capped at 20 per page), so it cannot price an accurate unfiltered total without a new query, which is out of scope. Existing "Manage accounts"/"Manage courses" quick-link buttons on the admin dashboard are unaffected.

### SH-07-R13 — Semantic status pills everywhere a status or role renders

`confirmed`. `Badge` gains `success` and `warning` variants backed by new `--success`/`--warning` CSS-variable tokens in `globals.css` (light + dark), joining the existing `destructive` (red) and `default`/`secondary` (blue/teal) variants; a single new status→variant mapping function (unit-testable) maps active/approved/completed → `success`, pending → `warning`, rejected/cancelled/deactivated/error → `destructive`, anything else → `default`/`secondary`, and is the only place that decides a status pill's colour. Every place a status already renders as plain text (account active/deactivated, course active/deactivated, booking/consultation status, role) switches to this `Badge`. Where an existing test asserts the exact combined text of a label plus its value (e.g. `"Status: pending"` in `student-manage-bookings.spec.ts`), the label text stays a literal text node and only the status word moves inside an inline `Badge`, so the element's full text content is unchanged.

### SH-07-R14 — Responsive accounts/courses lists and dialog-based create

`confirmed`. `/admin/accounts` and `/admin/courses` render as a `Table` at `≥ md` and stacked `Card`s below `md`, same row data, status/role pills, and row actions at both; `CreateAccountForm`/`CreateCourseForm` move inside a `Dialog` opened by a "New account"/"New course" button, keeping every existing field name, label, validation message, and success message unchanged. `admin-courses.spec.ts`'s two create tests currently fill the form inline with no dialog-open step and `admin-accounts.spec.ts`/`admin-courses.spec.ts` locate a row via `page.locator("li")`; both need updating (an added "open the dialog" step, and a role/label-based row locator that matches at both viewports) — selector/step changes only, no field, message, or behaviour change.

### SH-07-R15 — Friendlier empty states

`confirmed`. Every existing empty-state message (e.g. "No accounts match these filters.", "You have no consultation bookings yet.", "No pending consultation requests.") keeps its exact current text and `role="status"` placement — tests query by it — and gains only a leading icon and, where a create/clear action already exists on the page, a visible link/button to it.

### SH-07-R16 — Remove redundant "Back to dashboard" links

`confirmed`. The "Back to dashboard" link is removed from `src/app/student/bookings/page.tsx`, `src/app/student/bookings/[bookingId]/page.tsx`, `src/app/student/slots/page.tsx`, `src/app/admin/accounts/page.tsx`, and `src/app/admin/courses/page.tsx`, since the sidebar already provides that navigation; no existing test references this link's text (verified by search), so no test needs updating.

### SH-07-R17 — Branded not-found page

`confirmed`; source: owner decision 2026-10-22 (pre-release audit). An unmatched URL renders an Orbit-branded "Page not found" page (`src/app/not-found.tsx`) with the Orbit mark and one "Go to your dashboard" link to `/`, which already routes a signed-in user to their own dashboard and anyone else to `/login`. It does not read the session itself.

### SH-07-R18 — One main landmark per page

`confirmed`; source: owner decision 2026-10-22 (pre-release audit, axe `landmark-no-duplicate-main`). `SidebarInset` already renders the page's `<main>`, so `RoleShell` wraps page content in a plain `<div>`, leaving exactly one `main` landmark in every role page. Stat-tile labels use a darker tint than `text-muted-foreground`, which fell below 4.5:1 on the tinted tile (`SH-07-R6`/`SH-07-AC19`, light mode).

## Non-functional requirements

Accessibility per `SH-07-R6` (WCAG AA both themes, keyboard operability) — now also covering the new teal/navy sidebar tokens and the new `success`/`warning` badge tokens in both themes (`SH-07-AC19`). No new performance/capacity target — kit components are statically bundled, no runtime fetch added; stat tiles reuse data the page already fetches, adding no new query. No new browser-support target beyond the project's existing baseline.

## UI description

Same routes, entry points, and loading/empty/success/error/conflict states as today, now rendered with kit components inside the shared shell: sidebar ("Orbit" wordmark/mark, role nav grouped under uppercase labels with icons, collapsible), header (name, change password, sign out), content area opening with a greeting and stat tiles, then the page's existing content. Status/role values render as coloured `Badge` pills; accounts/courses are a `Table` at `≥ md` and `Card`s below it; "New account"/"New course" open a `Dialog`. Dark mode switches purely via the OS setting; no in-app toggle is added (out of scope); calendar views stay out of scope.

## Use cases

- **UC1 Role sees only its own nav**: signed-in user of any role loads a page under their route; `RoleShell` renders only that role's nav items, sourced from the server-resolved role, not client state.
- **UC2 Restyled form keeps its accessible contract**: a test or user queries a restyled field by label/role; the same label text, input type, and `role="status"`/`role="alert"` result element are present, just styled with kit components.
- **UC3 Narrow viewport**: viewport width drops below the collapse breakpoint; the sidebar collapses to a keyboard-reachable toggle; every nav item stays reachable.
- **UC4 Dashboard greeting and tiles**: a signed-in user opens their role's dashboard; the header greets them by name with the SGT time-of-day bucket, and each stat tile shows a number matching that user's seed data from an existing server function.
- **UC5 Create via dialog, list by viewport**: an admin opens "New account"/"New course", the same fields/labels/messages appear inside a `Dialog`; the same list renders as a table above `md` and as cards below it, with the same row data and actions either way.

## Technical constraints and proposals

shadcn CLI output goes into `src/components/ui/` as committed source, not a package dependency. Tailwind v4 (`@tailwindcss/turbopack`, already installed); tokens defined in `globals.css` via `@theme`/CSS variables, redefined under `@media (prefers-color-scheme: dark)` — no separate manual dark build; the new teal/navy sidebar tokens and `success`/`warning` badge tokens follow the same pattern (defined once in `globals.css`, referenced only by token-based classes elsewhere, never a raw hex/palette class outside `src/components/ui/`, so `SH-07-AC5` is unaffected). Geist Mono loads via `next/font/google` next to the existing Geist sans — no new runtime font/CDN request. `lucide-react` is already an installed dependency. `src/components/` has no CODEOWNERS entry of its own, so the catch-all owner applies; `SH-07-R8` still governs any edit inside `src/app/student/**`/`src/app/lecturer/**`.

## Data model and integrity rules

None. No table, column, migration, or RLS policy is added or changed by this spec, including by the stat tiles in `SH-07-R12`.

## API and boundary contracts

None changed. Every existing Server Action/Route Handler/RPC keeps its signature, inputs, outputs, and error codes; `SH-07-R12`'s stat tiles call existing exported read functions (`listAccounts`, `listCourses`, `listLecturerRequests`, `listMyBookings`, and the lecturer dashboard's existing slot/request queries) with no new parameter, and no new function or RPC is added by this amendment.

## Security requirements

- Inherited controls unchanged: every page layout keeps calling `requireRole`/`requireUser` exactly where it does today; `SH-07` adds, removes, or moves no such call, including for the new greeting/stat-tile row.
- Trusted/untrusted inputs: the shell reads only the already-trusted server-resolved `user` object; stat tiles read only data already returned to an authorized caller by an existing function; no new untrusted input is introduced.
- Data disclosure: nav items are chosen from the trusted role, never guessed client-side; a stat tile never shows a number its page's existing query could not already show that signed-in user.
- Sensitive actions/logging: none new — a styling/identity-only change adds no log statement, error path, or approval gate beyond the existing CODEOWNERS review noted in `SH-07-R8`.

## AI behavior

No AI is used. `SH-07` makes no model call and touches no `ai_usage` read/write; the greeting's time-of-day bucket is a plain date/time computation, not a model call.

## Edge cases and failure paths

| Condition                                                                              | Required observable outcome                                                                                                          | Invariant preserved                                               |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| A test selector was purely presentational (CSS class, not role/label)                  | Selector may change, with written justification in the PR                                                                            | No selector tied to accessible name/role/label changes            |
| OS theme set to dark                                                                   | All shadcn tokens switch; no component still uses a hard-coded hex                                                                   | Dark mode is fully themed, not partial                            |
| Narrow viewport                                                                        | Sidebar collapses behind a reachable, keyboard-operable toggle                                                                       | No nav item becomes unreachable                                   |
| `src/app/student/**` or `src/app/lecturer/**` touched                                  | PR requires that owner's review per CODEOWNERS                                                                                       | Ownership boundary is not bypassed by a styling PR                |
| `admin-courses.spec.ts`'s create tests fill the form inline, no dialog-open step       | Test gains one added "open the dialog" step; same fields/labels/messages                                                             | No field name, label, validation, or success message changes      |
| `admin-accounts.spec.ts`/`admin-courses.spec.ts` locate a row via `page.locator("li")` | Presentational DOM-tag selector may change to a role/label query that matches at both the table and card layout, justified in the PR | Same accessible name/role/label the rest of the test already uses |
| An existing test asserts combined text like `"Status: pending"` exactly                | The literal "Status: " text node is kept; only the status word moves inside an inline `Badge`                                        | No exact-text assertion needs updating                            |
| A nav item gains a `lucide-react` icon                                                 | Icon is `aria-hidden="true"`; the link's accessible name stays exactly its label text                                                | `SH-07-AC2`/`AC13` nav-link-by-name queries keep matching         |
| Narrow (`< md`) accounts/courses view                                                  | Cards show the same row data/actions as the table; `SH-07-AC9`'s sidebar collapse is unaffected                                      | No row action or nav item becomes unreachable                     |

## Acceptance criteria and verification

Planned tests, not results.

- **SH-07-AC1** (R5; unit + integration + pgTAP + e2e; mocked + live) Every existing test suite passes with no assertion changes, except a purely presentational selector change justified in the PR
- **SH-07-AC2** (R2; e2e; live) Each role's sidebar shows only that role's nav links; no other role's links appear in the DOM
- **SH-07-AC3** (R3; e2e with emulated media; live) `prefers-color-scheme: dark` applies the dark token set on every restyled page
- **SH-07-AC4** (R6; e2e/manual keyboard pass; live) Every interactive element shows a visible focus indicator when tabbed to, in both themes
- **SH-07-AC5** (R1, R3; lint/grep check; N/A) No hard-coded colour class or hex value exists outside `src/components/ui/`
- **SH-07-AC6** (R4, R5; unit + e2e; mocked + live) Every restyled page keeps the exact accessible label/role an existing test queries by (`getByRole`, `getByLabel`)
- **SH-07-AC7** (R1, R4; build; N/A) `npm run lint`, `npm run typecheck`, and `npm run build` all pass after the kit and restyle land
- **SH-07-AC8** (R6; e2e; live) Each `role="status"`/`role="alert"` message present before the restyle (e.g. password-changed success, sign-in error) is present with the same text/semantics after
- **SH-07-AC9** (R2; e2e; live) At a narrow viewport, the sidebar collapses and its toggle remains reachable and operable by keyboard alone
- **SH-07-AC10** (R7; code review + grep; N/A) No new client-side fetch call or `localStorage`/`sessionStorage`/cookie write appears in the diff
- **SH-07-AC11** (R8; process check; N/A) A PR touching `src/app/student/**` or `src/app/lecturer/**` carries that owner's required CODEOWNERS review
- **SH-07-AC12** (R9; unit + e2e; mocked + live) Every role shell shows the "Orbit" wordmark plus the inline-SVG logo mark, and the page `<title>` reads "Orbit"
- **SH-07-AC13** (R10; e2e; live) Every nav item across all three roles shows a `lucide-react` icon and sits under its role's correct uppercase group label, with its accessible link name unchanged
- **SH-07-AC14** (R12; unit; mocked) The time-of-day function returns "morning"/"afternoon"/"evening" correctly at and just either side of each proposed SGT boundary (05:00, 12:00, 18:00), and the dashboard header renders "Good morning/afternoon/evening, {fullName}"
- **SH-07-AC15** (R12; integration + e2e; live against seed) Each role's stat tiles show values matching the seeded data for that signed-in user, for every tile listed in `SH-07-R12` (and no "available slots" tile for the student, per the documented omission)
- **SH-07-AC16** (R13; unit; mocked) The status→variant mapping function returns `success` for active/approved/completed, `warning` for pending, `destructive` for rejected/cancelled/deactivated/error, and `default`/`secondary` otherwise, for every status value in `src/features/*/validation.ts`
- **SH-07-AC17** (R14; e2e at two viewports; live) `/admin/accounts` and `/admin/courses` render as a table at `≥ md` and as stacked cards below it, with the same row data, pills, and actions at both
- **SH-07-AC18** (R14; e2e; live) The "New account"/"New course" `Dialog` keeps the exact same field names, labels, validation messages, and success messages as today; `admin-courses.spec.ts`'s create tests pass after adding the dialog-open step
- **SH-07-AC19** (R10, R13; e2e/axe or token-contrast check; live) `prefers-color-scheme: dark` keeps WCAG AA contrast for the new teal/navy sidebar tokens and the new `success`/`warning` badge tokens
- **SH-07-AC21** (R17; e2e; live) A signed-in user opens an unmatched URL → the page shows the "Page not found" heading and a "Go to your dashboard" link that leads to that user's own dashboard
- **SH-07-AC22** (R18; e2e; live) The student and admin dashboards expose exactly one `main` landmark (the lecturer dashboard still renders its own nested `<main>` in `src/app/lecturer/page.tsx`; its owner removes it, then this criterion extends to it)
- **SH-07-AC20** (R5, R9–R16; unit + integration + pgTAP + e2e; mocked + live) Every existing automated suite still passes, with no assertion change beyond the selectors and steps justified in `SH-07-R9`, `R14`, and the edge-case table above

## Review evidence

- Challenge record: none yet; not independently reviewed.
- Review type: not yet reviewed.
- Open findings and disposition: none recorded yet.
- Human input required: none; the material revision was approved on 2026-10-21 (see Document control).

## Open questions blocking approval

None. The proposed items were confirmed with the 2026-10-21 approval.

## Change log

| Date       | Change and reason                                                                                                                                                                                                                                           | IDs affected              | Evidence invalidated                                                                     | By                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------- | ---------------------- |
| 2026-10-20 | First draft from owner decisions (shadcn kit, shared shell, full restyle, presentation-only constraint)                                                                                                                                                     | R1–R8, AC1–AC11           | None; no prior approval                                                                  | requirements_architect |
| 2026-10-20 | Owner approval; proposed breakpoint, font and colour-check items accepted                                                                                                                                                                                   | R1–R8                     | None                                                                                     | Johannsen              |
| 2026-10-20 | `TASK-SH-07B` material revision: visual identity ("Orbit" brand, SuperCane-style nav, greeting + stat tiles, semantic status pills, responsive tables/cards + create dialog, friendlier empty states, removed redundant nav links); status reset to `draft` | R9–R16, AC12–AC20         | Prior approval above superseded for the amended scope; `R1`–`R8`/`AC1`–`AC11` unaffected | requirements_architect |
| 2026-10-21 | Owner approval of the material revision; greeting boundaries and omitted student tile accepted                                                                                                                                                              | R9–R16                    | None                                                                                     | Johannsen              |
| 2026-10-22 | Pre-release audit; owner approved 2026-10-22: added `SH-07-R17` (branded not-found page) and `SH-07-R18` (single main landmark, stat-tile label contrast), with `SH-07-AC21`–`AC22`; status remains `approved`                                              | R17, R18 (new), AC21–AC22 | None                                                                                     | Johannsen              |
