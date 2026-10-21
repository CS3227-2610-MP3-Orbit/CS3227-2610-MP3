# SH-07 shared UI design system and Orbit visual identity

## Design system specification and approval — 2026-10-20

- Requested: a shared shadcn/ui-based design system and app shell for all three roles, replacing
  ad-hoc Tailwind strings (`SH-07`, `workflow/specs/shared/SH-07-ui-design-system.md`).
- `requirements_architect` drafted the spec against `SH-01` and `ADM-01`/`SH-06` (the pages being
  restyled, whose accessible names/states are the preservation target).
- Owner decisions recorded in the spec's "Document control" (Johannsen, relayed by the coordinator,
  2026-10-20): shadcn/ui kit generated into `src/components/ui/` as committed source (Tailwind v4);
  light SaaS-dashboard direction with a left sidebar, neutral palette plus one accent colour, rounded
  cards, clear tables; light-by-default theme with automatic dark mode via `prefers-color-scheme`,
  shadcn CSS-variable tokens, no hard-coded hex anywhere outside the kit; one shared shell for all
  three roles; restyle of every existing page; presentation-only — no change to behaviour, data
  access, validation, authorization, routes, or text a test relies on. The sidebar-collapse
  breakpoint (768px/`md`), self-hosted `next/font` Geist, and a colour-check script (`npm run
check:colors`, wired into `npm run verify`) were proposed and accepted on approval.

Generated summary awaiting independent human verification.

## Kit, shell, and restyle — issues found while building (PR #31) — 2026-10-20

- `requirements_architect` → `developer` built the kit (`shadcn@4.22.1`, `src/components/ui/`, new
  packages `@base-ui/react`, `class-variance-authority`, `cn`, `shadcn`, `lucide-react`,
  `tw-animate-css`), one `RoleShell`/`AppSidebar` shell driven by `src/components/app-nav.ts`, and
  restyled every page (login, student, lecturer, admin, change password) — presentation only.
- Developer-found issues, recorded in the handoff (`workflow/handoffs/sh-07/2026-10-20-sh-07-developer.md`):
  - **Dev-only hydration bug**: Next 16's `allowedDevOrigins` guard silently blocked the client JS
    bundle for every Playwright config browsing via `127.0.0.1`, so no client component ever
    hydrated — forms still "worked" via Server Actions' plain-POST fallback, which masked the
    breakage until a test needed real client state (the sidebar toggle). Fixed with a dev-only
    `allowedDevOrigins: ["127.0.0.1"]` in `next.config.ts`.
  - Removed the shadcn sidebar kit's default `document.cookie` persistence of open/collapsed state to
    satisfy `SH-07-R7`/`AC10` ("no new... cookie write"); sidebar state no longer survives a reload —
    recorded as an accepted presentation-only trade-off.
  - Native `<select>` elements were deliberately kept native rather than swapped for shadcn's
    `<Select>`, to avoid changing GET-form serialization/keyboard semantics for a presentation-only
    task.
  - A pre-existing `SH-06-AC9`/`AC10` rate-limit E2E test failed identically with and without SH-07's
    changes (reproduced with the untouched original file swapped back in) — recorded as pre-existing,
    not a regression.
- Verification recorded in the handoff: lint, typecheck, 126 unit tests, `check:colors` (87 files),
  `check:spec` 0 errors, format check, `next build`, ADM-01/SH-06 regression (26/26, 11/11), E2E admin
  - UI shell 11/11, E2E change password 2/3 passing with the pre-existing failure noted above.
- PR #31 was stacked on #30; test fix commit `d1f9d0d` switched browser tests to `localhost` and made
  the change-password test wait for each server response. Review: Joseph — "Looks good!" (commit
  `5374111`). Merged 2026-10-21.

Generated summary awaiting independent human verification.

## Orbit visual-identity amendment, spec approval, and build (PR #36, open) — 2026-10-20/2026-10-21

- Requested: give the restyled app its own brand on top of SH-07 (teal colour, greetings/stat tiles,
  status pills, dialogs, friendlier empty states) rather than the shadcn default look.
- `requirements_architect` drafted `TASK-SH-07B`, a material revision adding `SH-07-R9`–`R16` and
  `AC12`–`AC20`: Orbit wordmark/logo, `lucide-react` nav icons under uppercase group labels, a
  time-of-day greeting with per-role stat tiles, a shared status→badge-variant mapping, responsive
  table/card views plus create dialogs for admin accounts/courses, and friendlier empty states. This
  reset `SH-07`'s status to `draft`, superseding the prior approval for the amended scope only
  (`R1`–`R8`/`AC1`–`AC11` unaffected). Owner approved the revision on 2026-10-21, accepting the
  proposed greeting boundaries (SGT: morning 05:00–11:59, afternoon 12:00–17:59, evening otherwise)
  and the decision to omit an "available slots" stat tile for students.
- Implementation findings from the two developer handoffs
  (`workflow/handoffs/sh-07/2026-10-21-sh-07-developer-identity.md` and
  `...-developer-polish.md`):
  - Badge-contrast check: a new `blendOklab()`-based test against the _actual rendered pill_
    (translucent fill composited over the card) found that `destructive` measurably failed WCAG AA
    in both light (~4.0–4.2:1) and dark (~4.6–4.7:1) mode; it was retuned to pass. The reported
    "green on green, nearly unreadable" success/warning complaint could not be reproduced as a
    numeric AA failure under either tested blend model, but success/warning were retuned anyway for
    a clearer visual margin — flagged as unresolved/open for the owner to re-check visually.
  - Primary/ring/accent were retinted to Orbit teal (`oklch(0.42 0.13 196)` light / `oklch(0.76 0.13
196)` dark), each checked against real WCAG contrast (~7:1 light, ~9.7:1 dark).
  - Fixed a duplicate `id="role"` on the accounts page (PR #36 body).
  - Two self-reported process violations by the developer agent, both flagged rather than hidden:
    printing a few dozen base64 characters of the local-dev demo anon key before switching to the
    mandated no-print pipe, and running `npm run build` directly in the shared checkout once while a
    `next dev` server was live on it (no observed disruption; confirmed by `curl` against `/login`
    returning 200 with the same server PID before and after). Both are recorded as open items for the
    owner's judgment on whether the local stack's keys need rotating.
- Verification recorded in the PR #36 body (local, head `b4d8e97`): `npm run verify -- --profile=app`
  passed all 10 steps; 206 unit tests; colour check 123 files; spec traceability 0 errors; admin/
  courses/SH-06 integration 26/26, 12/12, 11/11; E2E admin 21/21; E2E change password 3/3. Student
  e2e (disposable stack) not run locally, covered by CI; no migration/RLS change, so `supabase db
lint`/`test:db` not run.
- Status: PR #36 is **open**, not yet merged as of 2026-10-21. It still needs teammate review of the
  spec amendment and of the student/lecturer page touches (`src/app/student/**` — Joseph;
  `src/app/lecturer/page.tsx`, `src/components/consultation-list.tsx` — Jordan), per the PR's own
  checklist.

Generated summary awaiting independent human verification.
