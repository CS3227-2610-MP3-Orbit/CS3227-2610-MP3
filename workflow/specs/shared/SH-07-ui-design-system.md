---
id: SH-07
title: Shared UI design system and app shell
owner: team
status: approved
---

# SH-07: Shared UI design system and app shell

## Document control

- Approval: approved by Johannsen on 2026-10-20 (owner approval) with the coordinator's recommendations
  for the proposed items: sidebar collapses to a menu button below `md` (768px); Geist via `next/font`
  (self-hosted); a colour check script outside `src/components/ui` run by `npm run verify`. Joseph and
  Jordan review changes to their pages on the pull request.
- Task: `TASK-SH-07`; author: `requirements_architect`; date: 2026-10-20; reviewed HEAD `74ce642c1e4c058faf04d98f46000aa23b780e3`.
- Digests (`git hash-object`): `src/components/role-shell.tsx` = `f6f3d04b7836d68fa5c97f2a494fd11e2e800684`; `src/app/globals.css` = `327c5055848a0c0ad0db9480b7e908fb90481b4d`; `.github/CODEOWNERS` = `879f936455b52ea7910c1258ad92f4e25b57334a`.
- Parent/shared requirements: `SH-01` (session/role resolution); `ADM-01`, `SH-06` (pages restyled here — their accessible names/states are the preservation target).
- Plan/handoff: no plan yet. Handoff: `workflow/handoffs/sh-07/2026-10-20-sh-07-requirements-architect.md`.
- Confirmed (owner decisions, Johannsen, 2026-10-20, relayed by coordinator): shadcn/ui kit generated into `src/components/ui/` as committed source, Tailwind v4; light SaaS-dashboard visual direction with a left sidebar, neutral palette plus one accent colour, rounded cards, clear tables; light-by-default theme with automatic dark mode via `prefers-color-scheme`, shadcn CSS-variable tokens, no hard-coded hex in any component; one shared shell used by all three roles; restyle of every existing page; presentation-only — no behaviour, data access, validation, authorization, route, or test-relied-on-text change.
- Proposed, needs review: the exact sidebar-collapse breakpoint/mechanism; whether to keep the current system-font stack or adopt a self-hosted `next/font`; the concrete lint/grep mechanism for the no-hard-coded-colour check (`SH-07-AC5`).

## Product and feature description

Every page today uses ad-hoc Tailwind class strings, and `RoleShell` has only a header, no sidebar. SH-07 adds a committed shadcn/ui kit, extends `RoleShell` with a role-specific collapsible sidebar, and restyles all existing pages onto the kit — a presentation-only refactor with no behavioural change.

## Scope, non-goals, and dependencies

**In scope**: `src/components/ui/` kit (shadcn/ui, Tailwind v4 CSS-variable tokens); one shared shell (sidebar + header) for student, lecturer, and admin; restyle of login, student (slots/request/bookings), lecturer (dashboard/availability/requests), admin (dashboard/accounts/one-time-password), and account/password.

**Non-goals**: new features, copy rewrites, animation beyond shadcn defaults, i18n, any change to `requireRole`/`requireUser`, Server Actions, validation, or routes.

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

## Non-functional requirements

Accessibility per `SH-07-R6` (WCAG AA both themes, keyboard operability). No new performance/capacity target — kit components are statically bundled, no runtime fetch added. No new browser-support target beyond the project's existing baseline.

## UI description

Same routes, entry points, and loading/empty/success/error/conflict states as today, now rendered with kit components inside the shared shell: sidebar (role nav, collapsible), header (name, change password, sign out), content area. Dark mode switches purely via the OS setting; no in-app toggle is added (out of scope).

## Use cases

- **UC1 Role sees only its own nav**: signed-in user of any role loads a page under their route; `RoleShell` renders only that role's nav items, sourced from the server-resolved role, not client state.
- **UC2 Restyled form keeps its accessible contract**: a test or user queries a restyled field by label/role; the same label text, input type, and `role="status"`/`role="alert"` result element are present, just styled with kit components.
- **UC3 Narrow viewport**: viewport width drops below the collapse breakpoint; the sidebar collapses to a keyboard-reachable toggle; every nav item stays reachable.

## Technical constraints and proposals

shadcn CLI output goes into `src/components/ui/` as committed source, not a package dependency. Tailwind v4 (`@tailwindcss/turbopack`, already installed); tokens defined in `globals.css` via `@theme`/CSS variables, redefined under `@media (prefers-color-scheme: dark)` — no separate manual dark build. `src/components/` has no CODEOWNERS entry of its own, so the catch-all owner applies; `SH-07-R8` still governs any edit inside `src/app/student/**`/`src/app/lecturer/**`.

## Data model and integrity rules

None. No table, column, migration, or RLS policy is added or changed by this spec.

## API and boundary contracts

None changed. Every existing Server Action/Route Handler keeps its signature, inputs, outputs, and error codes; `SH-07` only changes what renders the same data.

## Security requirements

- Inherited controls unchanged: every page layout keeps calling `requireRole`/`requireUser` exactly where it does today; `SH-07` adds, removes, or moves no such call.
- Trusted/untrusted inputs: the shell reads only the already-trusted server-resolved `user` object; no new untrusted input is introduced.
- Data disclosure: nav items are chosen from the trusted role, never guessed client-side; no additional field is rendered beyond what today's pages already show.
- Sensitive actions/logging: none new — a styling-only change adds no log statement, error path, or approval gate beyond the existing CODEOWNERS review noted in `SH-07-R8`.

## AI behavior

No AI is used. `SH-07` makes no model call and touches no `ai_usage` read/write.

## Edge cases and failure paths

| Condition                                                             | Required observable outcome                                        | Invariant preserved                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| A test selector was purely presentational (CSS class, not role/label) | Selector may change, with written justification in the PR          | No selector tied to accessible name/role/label changes |
| OS theme set to dark                                                  | All shadcn tokens switch; no component still uses a hard-coded hex | Dark mode is fully themed, not partial                 |
| Narrow viewport                                                       | Sidebar collapses behind a reachable, keyboard-operable toggle     | No nav item becomes unreachable                        |
| `src/app/student/**` or `src/app/lecturer/**` touched                 | PR requires that owner's review per CODEOWNERS                     | Ownership boundary is not bypassed by a styling PR     |

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

## Review evidence

- Challenge record: none yet; not independently reviewed.
- Review type: not yet reviewed.
- Open findings and disposition: none recorded yet.
- Human input required: confirm the three proposed items above before implementation starts.

## Open questions blocking approval

None blocking. Proposed, needs confirmation: sidebar-collapse breakpoint/mechanism (`SH-07-R2`); keep system fonts or adopt a `next/font`-hosted font (`SH-07-R7`); the lint/grep implementation for `SH-07-AC5`.

## Change log

| Date       | Change and reason                                                                                       | IDs affected    | Evidence invalidated    | By                     |
| ---------- | ------------------------------------------------------------------------------------------------------- | --------------- | ----------------------- | ---------------------- |
| 2026-10-20 | First draft from owner decisions (shadcn kit, shared shell, full restyle, presentation-only constraint) | R1–R8, AC1–AC11 | None; no prior approval | requirements_architect |
| 2026-10-20 | Owner approval; proposed breakpoint, font and colour-check items accepted                               | R1–R8           | None                    | Johannsen              |
