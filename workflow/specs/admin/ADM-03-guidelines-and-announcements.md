---
id: ADM-03
title: Administrator-published guidelines and announcements
owner: johannsen
status: approved
---

# ADM-03: Administrator-published guidelines and announcements

## Document control

- Spec owner: Johannsen (Administrator).
- Task: `TASK-ADM-03` (GitHub issue #25 "Admin: Publish guidelines and announcements (optional)",
  and issue #9 "Student: Read guidelines"); author: `requirements_architect`; date: 2026-10-21.
- Reviewed repository commit (HEAD): `dc0377b30f229e3a257c54c06f1d8a630e1ab670`.
- Prior approved commit or digest invalidated by this revision: none; first draft.
- Source digests (`git hash-object`): `PRODUCT-SPEC.md` = `d9f63461aeb368ffd811ec50e5a595e0c6047ca7`
  (Administrator experience, "Publish and edit guidelines and announcements"; Student experience,
  "Read current administrator-published consultation guidelines and announcements"; Open
  questions, "What maximum lengths should apply to ... announcements?"); `SH-01-foundation.md` =
  `effd11fca8bc035d3b442c14915ea1f44ffb1d6b`; `SH-07-ui-design-system.md` =
  `735af2a634c1ea058bbfc8e9a799c4fd43af401e`; `ADM-02-manage-courses-and-assignments.md` =
  `c5a17220bba6beb05a3057d10ac1bb56d2ac16ff`; `ADM-04-booking-reports-and-ai-summary.md` =
  `f2180e8e676147e32678859628095354497c17f4`; `supabase/migrations/20261017000000_initial_schema.sql`
  = `90abdf0ba39edd9e09bb4bfbb28e7ec1b4d3a0b8`; `supabase/migrations/20261018000000_student_browse_available_slots.sql`
  = `6007354846e479048726118395fc41433657e4d9`; `supabase/migrations/20261020140000_admin_courses.sql`
  = `ecf725b04a6e4cdde7d485dc5253490ac64f897c`; `src/components/app-nav.ts` =
  `a97fdff64aea4c2d59de2296deea7138887f30a1`; `src/components/empty-state.tsx` =
  `a66034ee004a1d79c6d16cbb0ca2094b77a3545c`; `src/lib/status-badge.ts` =
  `1ac54eb1d8bd6e1e57c1499af664eb826c219d4a`; `src/lib/auth/session.ts` =
  `7c26d1f1e88de789fb3027e24aa1a9c54e166b4f`; `src/app/admin/courses/page.tsx` =
  `aeb1d4d2afa65e29ab7d479c7a1bfbd08503a3f2`; `src/app/admin/courses/create-course-dialog.tsx` =
  `5a1ccb23046c71efefd51099eef12e479f613910`; `src/app/admin/courses/courses-list.tsx` =
  `944f923a9483aaec5c16e1c5ae5ba200661dc682`; `src/app/admin/courses/course-row.tsx` =
  `9b490e7b6f2206627bf683ad9bb63462a14cfc2c`; `src/app/admin/courses/actions.ts` =
  `5c17c5866597628e098b3839337b330b3a59920c`; `src/features/admin/courses/validation.ts` =
  `6369c6c53c458be9f57f28f2fb59a114a0177de6`; `src/features/admin/courses/server.ts` =
  `61bb1a5c7ac7ad380f7e4d91f4f605ff54de1954`; `src/app/admin/page.tsx` =
  `9d7d0d60b6dc052a8b91a1d32eb711a3fa2c072b`; `src/app/student/page.tsx` =
  `1c91c3fc9adeb3e146e69756b0fb9c073ad5a90e`; `src/app/lecturer/page.tsx` =
  `6cb9ee20468ea02523a1dfaf93d13ff10d3661f8`; `.github/CODEOWNERS` =
  `879f936455b52ea7910c1258ad92f4e25b57334a`.
- Parent/shared requirements: `PRODUCT-SPEC.md` ("Administrator experience" — "Publish and edit
  guidelines and announcements"; "Student experience" — "Read current administrator-published
  consultation guidelines and announcements"; "Open questions" — maximum length for announcements,
  proposed closed by this spec, see `ADM-03-R1`); `SH-01` (`requireRole`/`requireUser`,
  `current_app_role()`, the deny-by-default RLS house pattern already used by `profiles`); `ADM-02`
  (append-only migration, admin-only RPC/security posture, archive-over-delete precedent via
  `is_active`); `ADM-04` (no-AI boundary precedent, admin-only reporting posture); `SH-07`
  (`Badge`/`Dialog`/`EmptyState`/`NAV_GROUPS` UI conventions, `statusBadgeVariant`, the existing
  `whitespace-pre-wrap`/`<pre>` plain-text rendering already used for lecturer AI briefings).
- Related plan and latest handoff: no plan yet.
  `workflow/handoffs/adm-03/2026-10-21-adm-03-requirements-architect.md`.
- Confirmed requirements: owner-confirmed scope (Johannsen, relayed by the coordinator,
  2026-10-21, grounded in `PRODUCT-SPEC.md` and GitHub issues #25/#9) — admins create, edit,
  publish, and unpublish guidelines and announcements; no hard delete; any active signed-in user
  (student, lecturer, or admin) reads only published items; no AI. See `ADM-03-R1`–`R10` below for
  the exact classification of every other detail.
- Owner decisions (Johannsen, 2026-10-21, "go" on the five recommendations): (1) `title` 1–120 and
  `body` 1–2000 trimmed characters (`R1`); (2) a new item starts unpublished and must be explicitly
  published (`R1`); (3) direct RLS-protected table reads, no new read RPC, for the admin list and the
  reader projection (`R4`/`R5`/`R9`); (4) the reader card appears on both the Student and the
  Lecturer dashboards (`R10`); (5) a "Communications" sidebar group with a `Megaphone`
  "Announcements" item. The reader ordering/cap in `R9` (all published guidelines, then the 5
  newest published announcements, newest first) is accepted as written.
- Approval: **approved** by Johannsen (owner), 2026-10-21, covering R1–R10 and AC1–AC15 as written.
- Unresolved decisions: none.

## Product and feature description

Administrators need to publish short, text-only guidance — standing "guidelines" and time-bound
"announcements" — that every active student, lecturer, and admin can see without any booking
context. Today nothing exists in code or migrations for this: `PRODUCT-SPEC.md` promises it to
Administrators ("Publish and edit guidelines and announcements") and to Students ("Read current
administrator-published consultation guidelines and announcements"), and GitHub issues #25
(admin, explicitly marked "lower priority; cut if short on time") and #9 (student) track it. This
spec adds a minimal `/admin/announcements` management screen and a read-only "Guidelines and
announcements" card on the Student and Lecturer dashboards, reusing the existing RPC/RLS and UI
conventions from `ADM-02`/`SH-07` rather than inventing new ones, to keep this buildable well
within the half-day remaining before the Friday 2pm SGT deadline.

## Scope, non-goals, and dependencies

### In scope

Create/edit a guideline or announcement (kind, title, body); publish/unpublish (no hard delete);
admin list of every item including drafts; a reader projection of published items for any active
signed-in user; a plain-text, line-break-preserving reader card on the Student and Lecturer
dashboards; admin-only authorization and RPC-only writes.

### Non-goals

Hard delete; scheduling (start/end dates, expiry); file/image attachments; per-course or
per-cohort targeting; push/email notifications; read receipts or "seen" tracking; rich
text/Markdown rendering; search/filter on the admin list (the catalogue is small enough that it
is unneeded this round, same "no pagination SLA" decision as `ADM-01`/`ADM-02`); any AI feature
(the Administrator's AI feature is `ADM-04`, already shipped).

### Dependencies

`SH-01` (identity/role, `current_app_role()`, `requireRole`/`requireUser`); the existing
`profiles` table and its RLS pattern (direct `select` policies gated on `current_app_role()`,
the same shape this spec reuses); `ADM-02`'s RPC/migration conventions (security definer,
`set search_path = ''`, revoke/grant-to-`authenticated`-only); `SH-07`'s kit components
(`Badge`, `Dialog`, `EmptyState`, `Table`/`Card` responsive list, `NAV_GROUPS`).

## Users, roles, and permissions

| Actor                  | Allowed                                                                                                                           | Refused                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Active Administrator   | Create/edit any item; publish/unpublish any item; list every item (incl. drafts); read published items like any other active user | Hard delete; writing a field other than kind/title/body/published state         |
| Active Lecturer        | Read published items only (guidelines + newest 5 announcements)                                                                   | Any create/edit/publish/unpublish call, incl. direct RPC calls; reading a draft |
| Active Student         | Read published items only (guidelines + newest 5 announcements)                                                                   | Any create/edit/publish/unpublish call, incl. direct RPC calls; reading a draft |
| Signed-out/deactivated | Nothing                                                                                                                           | All announcement data and all writes                                            |

Trusted identity/role: server-resolved session via `requireRole("admin")` for every admin write
and the admin list, and `requireUser()` (role-agnostic, active-only) for the reader projection —
`requireUser` already exists in `src/lib/auth/session.ts` for exactly this "any active role"
shape. The database repeats the same boundary with row-level security so a bug in the app cannot
expose a draft or allow a non-admin write. UI hiding is not authorization.

## Functional requirements

### ADM-03-R1 — Create a guideline or announcement

`confirmed` capability; `proposed` bounds and default state. An admin supplies `kind` (`guideline`
or `announcement`), `title`, and `body`. Proposed bounds, closing `PRODUCT-SPEC.md`'s open
question on maximum announcement length: `title` 1–120 trimmed characters; `body` 1–2000 trimmed
characters; both reject an embedded NUL byte or an unpaired UTF-16 surrogate, mirroring the
existing `safeText` check in `src/features/admin/courses/validation.ts`. Neither field is
restricted to a character class beyond that (unlike a course code) — this is prose, not an
identifier. A new item is created with `is_published = false` (a draft): the admin must take a
separate, deliberate publish action (`ADM-03-R3`) before any reader sees it, giving a chance to
proofread first. `created_by`/`updated_by` are set to the caller's profile id, never a
client-supplied value.

### ADM-03-R2 — Edit an existing item's kind/title/body

`confirmed`. An admin updates an existing item's `kind`, `title`, and/or `body` under the same
validation as `R1`. Editing never changes `is_published` (that is `R3`'s separate action) and sets
`updated_by` to the caller and `updated_at` to now. An unknown item id is refused
(`forbidden_or_not_found`).

### ADM-03-R3 — Publish and unpublish; no hard delete

`confirmed`. A single boolean toggle sets `is_published`. Unpublishing hides an item from every
reader immediately but preserves the row, its `created_by`/`created_at` and its full edit
history's latest state — the same archive-over-delete principle `ADM-02-R3` applies to courses —
so there is always an audit trail of who published or last touched an item and when, and
"temporarily taking something down" never destroys it. There is no delete operation anywhere in
this feature's RPCs, UI, or database grants.

### ADM-03-R4 — Administrator list of every item

`confirmed` capability; `proposed` shape. An admin can list every item, published and draft
alike, each with its `kind`, `title`, `body`, `isPublished`, and timestamps. Proposed: unlike
`ADM-02-R7`'s `admin_list_courses` RPC (needed there for search/filter and a lecturer join), this
list needs neither, so it is read through a direct, RLS-protected table `select` (ordered
newest-first) behind `requireRole("admin")` rather than a seventh new RPC — the same shape
`profiles`'s own "admin reads all" policy already uses. No search/filter UI is added (non-goal).

### ADM-03-R5 — Reader visibility boundary

`confirmed`. Any active signed-in user, regardless of role, may read only items where
`is_published = true`. This is enforced by row-level security directly on the table — not only by
the app hiding a draft in the UI — so a direct PostgREST `select` by a Student or Lecturer against
a draft row returns no row, and a signed-out or deactivated caller's `current_app_role()` is null
and so matches no read policy at all (same mechanism `SH-01` already uses for `profiles`).

### ADM-03-R6 — Administrator-only mutation boundary

`confirmed`, same posture as `ADM-02-R8`/`ADM-04-R4`. Every write (`admin_create_announcement`,
`admin_update_announcement`, `admin_set_announcement_published`) is a new security-definer RPC
(`set search_path = ''`, checks `current_app_role() = 'admin'` first, `execute` revoked from
`public`/`anon`/`authenticated` then granted to `authenticated` only) called only after
`requireRole("admin")` in the Server Action. No direct `insert`/`update`/`delete` grant on
`public.announcements` exists for `authenticated`/`anon`; those three operations have no RLS
policy at all (default-deny) and are additionally revoked at the table-grant level as
defense-in-depth, the same extra step `ADM-02`'s migration takes for `courses`.

### ADM-03-R7 — No-AI boundary

`confirmed`, inherited from `PRODUCT-SPEC.md`/`ADM-02-R9`/`ADM-04-R9`. No create, edit, publish,
unpublish, admin-list, or reader-read operation calls a model, builds a prompt, or writes
`ai_usage`. The Administrator's one AI feature remains `ADM-04`.

### ADM-03-R8 — Plain-text rendering; no stored HTML/script execution

`confirmed`. `title` and `body` are always rendered as plain text with line breaks preserved
(`whitespace-pre-wrap`), on both the admin list and the reader card, and never through
`dangerouslySetInnerHTML`, a Markdown renderer, or any other HTML-interpreting path — the same
plain-`<pre>` pattern already used for the lecturer's saved AI briefings. An admin-entered
`<script>`/HTML-bearing title or body therefore always displays as inert literal text to every
later reader, including the admin's own list.

### ADM-03-R9 — Reader content and ordering

`confirmed` capability; `proposed` exact shape. The reader projection returns every published
guideline (no cap; this project's catalogue is small) ordered newest-first, plus the 5 newest
published announcements, also newest-first; an announcement beyond the 5 newest is not returned to
the reader, though it remains stored and still appears, unlimited, on the admin list (`R4`).

### ADM-03-R10 — Reader placement: Student and Lecturer dashboards

`confirmed` for Student, per `PRODUCT-SPEC.md`'s Student experience section; `proposed` extension
to Lecturer. A "Guidelines and announcements" card appears on `/student`'s dashboard (`R10`
confirmed) and, per the coordinator's scoped ask, on `/lecturer`'s dashboard too — though
`PRODUCT-SPEC.md`'s current Lecturer experience section does not yet list this, only its Student
and Administrator sections do. This spec proposes building it for both roles now, since it is the
same reusable card and read function either way and keeps lecturers informed of
institution-wide notices; see the flagged decision in the handoff. Implementing either card edits
`src/app/student/**` or `src/app/lecturer/**` respectively and needs that owner's (Joseph's or
Jordan's) required review per `.github/CODEOWNERS`, the same cross-boundary note `SH-07-R8` makes
for styling changes to those directories.

## Non-functional requirements

No new performance/accessibility target beyond `ADM-02`/`SH-07`'s conventions (keyboard operable,
visible focus, labelled errors, `role="status"`/`role="alert"` for feedback). No pagination SLA —
this catalogue is expected to stay small, the same decision already made for `ADM-01`/`ADM-02`.

## UI description

An "Announcements" page under `/admin/announcements`, mirroring `/admin/courses`: a "New
announcement" button opens a `Dialog` with `kind` (radio or select: Guideline/Announcement),
`title`, and `body` fields; the list below renders as a `Table` at `≥ md` and stacked `Card`s
below it (same data and actions at both, per `SH-07-R14`'s pattern), each row/card showing a kind
label, a `Badge` for Published/Draft (using `statusBadgeVariant`: published → `success`, draft →
`secondary`), the title, a truncated body preview, an "Edit" button opening an edit `Dialog`
pre-filled with the current values, and a "Publish"/"Unpublish" toggle button. An `EmptyState`
("No guidelines or announcements yet.") shows when the list is empty, with a visible link to open
the create dialog, mirroring `ADM-02`'s "No courses match these filters." pattern. Validation
errors render inline in the dialog form (`role="alert"` or a labelled field error), the same
convention `create-course-form.tsx` already uses. The sidebar nav gains one new entry: proposed a
new "Communications" group (after "Teaching", before "Insights") with a single "Announcements"
item pointing at `/admin/announcements`, carrying a decorative `lucide-react` icon (proposed
`Megaphone`) per `SH-07-R10`'s existing `NAV_GROUPS` convention in `src/components/app-nav.ts`.

On `/student` and `/lecturer`, a new "Guidelines and announcements" card sits alongside the
existing stat tiles/quick actions (exact placement left to the implementing role-owner, consistent
with `SH-07`'s existing per-role dashboard layout), listing every published guideline, then up to
5 newest published announcements, each item's title as a heading and its body as
`whitespace-pre-wrap` plain text — never HTML/Markdown. An empty result shows a friendly
`role="status"` message ("No guidelines or announcements yet.") rather than nothing or an error.

## Use cases

- **UC1 Draft, then publish**: an admin creates a guideline as a draft, edits its wording, then
  publishes it; it immediately appears on the Student and Lecturer reader cards; unpublishing it
  again immediately hides it from both, while the row and its history remain stored and visible on
  the admin list.
- **UC2 Announcement cap**: an admin has published 6 announcements and 2 guidelines; the reader
  card shows both guidelines (unlimited) and only the 5 newest announcements; the admin list still
  shows all 8 items.
- **UC3 Stored-XSS attempt**: an admin enters a title or body containing a `<script>` tag or other
  markup; it renders as inert literal text, with line breaks preserved, on both the admin list and
  every reader card — never executed, never interpreted as HTML.
- **UC4 Non-admin direct access attempt**: a lecturer, student, or signed-out caller calls any
  `admin_*` RPC or Server Action directly; refused, no data, no mutation. The same caller's direct
  PostgREST `select` against a draft row returns no row.
- **UC5 Deactivated account**: a user an admin deactivates (`ADM-01`) immediately stops seeing even
  previously visible published items, because `current_app_role()` returns null for an inactive
  profile and matches no read policy.

## Technical constraints and proposals

`createAdminClient` is not needed; every write and the admin list go through
`requireRole("admin")` then either a new RPC (writes) or a direct RLS-protected `select` (admin
list), matching `ADM-02`'s pattern. The reader projection goes through `requireUser()` then two
plain RLS-protected `select`s (guidelines; newest-5 announcements) combined in
`src/features/*/announcements/server.ts` — no new RPC is needed for either read path, keeping this
feature's database surface to three new functions total. Zod `.strict()` schemas validate every
Server Action input before any RPC call, mirroring `src/features/admin/courses/validation.ts`'s
`safeText`/`text(max)` helpers. One new append-only migration adds the table, its RLS policies,
and the three RPCs; no existing migration is edited.

## Data model and integrity rules

One new table, `public.announcements`:

- `id uuid primary key default gen_random_uuid()`
- `kind text not null` — constrained to `'guideline'` or `'announcement'` by a `check` constraint
- `title text not null` — `check (length(trim(title)) between 1 and 120)`
- `body text not null` — `check (length(trim(body)) between 1 and 2000)`
- `is_published boolean not null default false`
- `created_by uuid not null references public.profiles (id) on delete restrict`
- `updated_by uuid not null references public.profiles (id) on delete restrict`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Row-level security is enabled with exactly two `select` policies (mirroring `profiles`'s "read
own"/"admin reads all" shape) and no `insert`/`update`/`delete` policy:

- `"announcements: admin reads all"` — `for select to authenticated using
((select current_app_role()) = 'admin')`.
- `"announcements: active users read published"` — `for select to authenticated using
((select current_app_role()) is not null and is_published)`.

`insert`, `update`, and `delete` are additionally revoked from `anon`/`authenticated` at the table
grant level as defense-in-depth (`ADM-03-R6`), so every write can only happen through the three
security-definer RPCs below — each `security definer`, `set search_path = ''`, checking
`current_app_role() = 'admin'` first, with `execute` revoked from `public`/`anon` and granted to
`authenticated` only, following `ADM-02`'s migration pattern exactly:

- `admin_create_announcement(p_kind text, p_title text, p_body text)` — inserts with
  `is_published = false`, `created_by`/`updated_by = auth.uid()`.
- `admin_update_announcement(p_id uuid, p_kind text, p_title text, p_body text)` — updates
  `kind`/`title`/`body`/`updated_by`/`updated_at`; never touches `is_published`.
- `admin_set_announcement_published(p_id uuid, p_published boolean)` — updates only
  `is_published`/`updated_by`/`updated_at`.

No row is ever deleted by any of the above; no new column is added to any existing table.

## API and boundary contracts

Proposed internal Server Actions, each requiring `requireRole("admin")` first unless noted:

- `createAnnouncement({kind, title, body})` → `{id, kind, title, body, isPublished: false,
createdAt, updatedAt}` or `validation_error` (field) / `forbidden_or_not_found` /
  `temporarily_unavailable` (correlationId).
- `updateAnnouncement({id, kind, title, body})` → same success shape, `isPublished` unchanged, or
  `validation_error` / `forbidden_or_not_found` / `temporarily_unavailable`.
- `setAnnouncementPublished({id, isPublished})` → `{id, isPublished}` or `validation_error` /
  `forbidden_or_not_found` / `temporarily_unavailable`.
- `listAnnouncementsForAdmin()` → `{items: [{id, kind, title, body, isPublished, createdAt,
updatedAt}]}` or `forbidden_or_not_found` / `temporarily_unavailable`.
- `listPublishedAnnouncements()` (requires `requireUser()`, any active role) →
  `{guidelines: [{id, title, body, updatedAt}], announcements: [{id, title, body, updatedAt}]}`
  (announcements capped at 5, newest-first) or `temporarily_unavailable`.

No action accepts a caller-supplied `isPublished` on create, a caller-supplied `createdBy`/
`updatedBy`, or an arbitrary field/SQL selector. Non-admin or signed-out direct calls to any
admin-only action/RPC get `forbidden_or_not_found`, with no data disclosed; a non-admin calling
`listPublishedAnnouncements` still succeeds (that one is intentionally role-agnostic) but only
ever sees published rows.

## Security requirements

- Every page/layout and Server Action/RPC calls `requireRole("admin")` (writes, admin list) or
  `requireUser()` (reader projection) first; no query or mutation precedes that check.
- Trusted: session role. Untrusted: `kind`/`title`/`body`/`id` — server-validated (bounded length,
  enum-safe `kind`, canonical UUID) even though the author is always an admin, because the
  _readers_ of this content are untrusted relative to it (`ADM-03-R8`'s stored-XSS boundary).
- Responses never leak raw database errors/SQL/schema; errors are typed `kind` values only.
- Draft items are invisible to a non-admin at the database layer (RLS), not only hidden in the UI;
  this holds even for a direct PostgREST `select`, per `ADM-03-R5`.
- This path needs independent human review before merge (security-sensitive: new table, new RLS
  policies, new RPCs), the same posture `ADM-02`/`ADM-04` already required.

## AI behavior

No AI is used. No model call, prompt, or `ai_usage` read/write occurs on any create, edit, publish,
unpublish, admin-list, or reader-read path.

## Edge cases and failure paths

| Condition                                                        | Required outcome                                                     | Invariant preserved                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| Invalid `kind`, or `title`/`body` out of bounds                  | `validation_error` naming the field, no row changed                  | No malformed item created/updated                            |
| Unknown item id on edit/publish toggle                           | `forbidden_or_not_found`, no change                                  | No action on a nonexistent target                            |
| Admin unpublishes an item                                        | Row preserved; immediately excluded from every reader query          | Archive-over-delete; no destructive operation exists         |
| Title/body contains `<script>`/HTML markup                       | Renders as inert literal text with line breaks preserved, everywhere | Stored content can never execute as markup                   |
| More than 5 published announcements exist                        | Reader sees only the 5 newest; admin list still shows all            | Reader scope stays small; nothing is lost from the record    |
| Zero published items exist                                       | Reader card shows a friendly empty state, not an error               | Empty state is not treated as a failure                      |
| Non-admin/signed-out direct RPC or admin-list call               | `forbidden_or_not_found`, no data, no mutation                       | Only active admins reach admin-only paths                    |
| Student/Lecturer direct PostgREST `select` against a draft row   | No row returned                                                      | RLS enforces visibility independent of the app               |
| A user is deactivated after a publish they could previously read | That user's next read returns nothing, published or not              | `current_app_role()` nulls out access the instant it's false |

## Acceptance criteria and verification

Planned tests, not results.

- **ADM-03-AC1** (R1; integration; live DB) Given an admin and a valid kind/title/body, when they create an item, then exactly one row exists with `isPublished = false` and `createdBy`/`updatedBy` set to the admin's own id.
- **ADM-03-AC2** (R1; unit; mocked) Given an invalid `kind`, or a title/body that is empty or exceeds its bound, when creation is attempted, then it returns `validation_error` naming the field and creates no row.
- **ADM-03-AC3** (R2; integration; live DB) Given an existing item, when an admin edits its kind/title/body, then the stored row reflects the change, `updatedBy` is the editor, and `isPublished` is unchanged.
- **ADM-03-AC4** (R2; integration; live DB) Given an unknown item id, when an admin attempts to edit it, then the call returns `forbidden_or_not_found` and no row changes.
- **ADM-03-AC5** (R3; integration; live DB) Given a published item, when an admin unpublishes it and later republishes it, then the row is never deleted and `isPublished` reflects each toggle exactly.
- **ADM-03-AC6** (R4; integration (security); live DB) Given a mix of published and draft items, when an admin lists them, then the response contains every item, including drafts, with only the allowlisted fields.
- **ADM-03-AC7** (R5, security; integration; live DB) Given a draft item, when a Student, a Lecturer, or a signed-out caller attempts to read it, including a direct PostgREST `select` against `public.announcements`, then no row is returned.
- **ADM-03-AC8** (R5; integration; live DB) Given a published guideline and a published announcement, when an active Student or Lecturer reads the projection, then both appear.
- **ADM-03-AC9** (R6, security; integration; live DB) Given a signed-out, Student, or Lecturer caller, when they invoke any `admin_*` write RPC or its Server Action directly, then the call returns `forbidden_or_not_found` and performs no mutation.
- **ADM-03-AC10** (R6, security; pgTAP; live DB) Given the `announcements` table, when `insert`/`update`/`delete` privilege is checked for `anon`/`authenticated`, then neither role holds it and every `admin_*` function's `execute` privilege is granted only to `authenticated`.
- **ADM-03-AC11** (R7; unit plus database before/after; mocked) Given any create/edit/publish/unpublish/list/read operation, when it runs successfully or fails, then it makes no model/provider call and writes no `ai_usage` row.
- **ADM-03-AC12** (R8, security; unit; mocked) Given a title or body containing `<script>` or other HTML markup, when it is rendered on the admin list or a reader card, then it appears as inert literal text with line breaks preserved, never via `dangerouslySetInnerHTML` or a Markdown renderer.
- **ADM-03-AC13** (R9; integration; live DB) Given 2 published guidelines and 6 published announcements, when the reader projection is read, then it returns both guidelines and exactly the 5 newest announcements, all newest-first.
- **ADM-03-AC14** (R10; e2e; live) Given published guidelines/announcements, when a Student or a Lecturer opens their dashboard, then the "Guidelines and announcements" card shows the same published content described in `AC13`.
- **ADM-03-AC15** (R5; integration (security); live DB) Given a user an admin deactivates, when that user's session attempts to read the reader projection again, then it returns no items regardless of publication state.

## Review evidence

- Challenge record: none yet; not independently reviewed.
- Review type: not yet reviewed.
- Open findings and disposition: none recorded yet.
- Human input required: none; owner decisions recorded in Document control. `src/app/student/**`
  and `src/app/lecturer/**` changes still need Joseph's and Jordan's review at PR time.

## Open questions blocking approval

None. `PRODUCT-SPEC.md`'s open question on maximum announcement length is answered by `R1`'s bounds;
`PRODUCT-SPEC.md` itself is updated separately.

## Change log

| Date       | Change and reason                                                                                              | IDs affected        | Evidence invalidated    | By                     |
| ---------- | -------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------- | ---------------------- |
| 2026-10-21 | First draft from `PRODUCT-SPEC.md`, issues #25/#9, and inspected `ADM-02`/`ADM-04`/`SH-07` code and migrations | R1–R10, AC1–AC15    | None; no prior approval | requirements_architect |
| 2026-10-21 | Owner approval of all five proposed decisions                                                                  | R1, R4, R5, R9, R10 | None; no prior approval | Johannsen (owner)      |
