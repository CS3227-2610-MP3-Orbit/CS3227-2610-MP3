---
id: ADM-02
title: Administrator manages courses and lecturer assignments
owner: johannsen
status: approved
---

# ADM-02: Administrator manages courses and lecturer assignments

## Document control

- Approval: approved by Johannsen (spec owner) on 2026-10-20, accepting the proposed items: codes
  upper-cased and trimmed, 2–20 characters, unique across active and inactive courses; names 1–200
  characters; re-assignment inserts a new row; specific refusal kinds for administrators. Owner
  approval; independent teammate review happens on the implementation pull request.
- Task: `TASK-ADM-02` (GitHub issue #19); author: `requirements_architect`; date: 2026-10-20.
- Reviewed repository commit (HEAD): `74ce642c1e4c058faf04d98f46000aa23b780e37`.
- Source digests (`git hash-object`): `PRODUCT-SPEC.md` = `d9f63461aeb368ffd811ec50e5a595e0c6047ca7`
  ("Administrator experience"); `SH-04-course-and-assignment-management.md` =
  `1e4ed5313f44cb7376e5b20d8b81be4e9283df4d`; `SH-02-courses-and-lecturer-assignments.md` =
  `d1971ed34d5847972064f87f9e10e8012b03c05c`; `SH-03-slots-bookings-and-availability.md` =
  `fe39ca71356f0fffdff8c02ca4c57d51ae4d5ff4`; `SH-05-slot-and-booking-mutations.md` =
  `63cbe1c68109ba96657bcfab0164d1ce06c9d79f`; `SH-01-foundation.md` =
  `a1a660ead71b0565afddf27633c63b6299bc5fa8`; `ADM-01-manage-accounts.md` (house style reference) =
  `a7243bbc56b2fe88cecc15d705352827d17bd2ce`.
- Parent/shared requirements: `PRODUCT-SPEC.md` ("Administrator experience"); draft `SH-04`
  (adopted/simplified/deferred below); draft `SH-02`/`SH-03` (read-only browse-visibility
  interaction, unchanged by this spec); draft `SH-05` (slot/booking ownership and transitions,
  unaffected); `SH-01` (`requireRole`, `current_app_role()`); `ADM-01` (same RPC/security posture).
- Related plan and latest handoff: no plan yet.
  `workflow/handoffs/adm-02/2026-10-20-adm-02-requirements-architect.md`.
- Confirmed requirements: owner-confirmed scope (Johannsen, relayed by the coordinator,
  2026-10-20) — see "Product and feature description" and R1–R9 below.
- Proposed assumptions requiring review: exact code normalization/bounds (`R1`), duplicate-code
  uniqueness spanning inactive courses (`R1`), insert-new-row (not reactivate) for re-assignment
  (`R6`), and the `admin_list_courses` read shape (`R7`).
- Unresolved decisions: none blocking; see "Open questions blocking approval".

## Relationship to SH-04

SH-04 is a team-owned draft written for a broader, unresolved management contract. ADM-02 is the
bounded Administrator implementation for this 3-person, 3-day timeline. ADM-02:

- **Adopts** `SH-04-R1`'s archive-over-delete/preservation principle, `SH-04-R2`'s admin-only
  boundary, `SH-04-R3`'s current-pair integrity (derived eligibility, at most one active pair,
  non-current removal preserving history with no implicit booking transition), `SH-04-R5`'s
  archive-over-delete safety, and `SH-04-R7`'s no-AI boundary — all at ADM-02's narrower scope.
- **Simplifies** `SH-04-R1`/`R6`: ADM-02 fixes concrete code/name bounds and normalization now
  (below) instead of leaving them unresolved, and drops exact catalogue-size/latency targets —
  this project's catalogue is small, matching `ADM-01`'s "no pagination SLA" decision. ADM-02 does
  not address post-use code rename beyond ordinary edit-with-uniqueness, retention duration, or
  physical deletion of a never-used course; those stay open, non-blocking, and out of ADM-02's
  scope.
- **Defers** `SH-04-R4` (Lecturer own-assignment projection) entirely to the Lecturer role specs;
  `LEC-01`'s existing RLS policies (`lecturers read own assignments`, `lecturers read assigned
courses`) already give lecturers this data directly, so ADM-02 adds nothing here.
- Once ADM-02 is approved, the team can mark `SH-04-R1` (partial), `R2`, `R3`, `R5`, and `R7`
  superseded by ADM-02 for the Administrator surface; `SH-04-R4`/`R6` and its retention questions
  remain open shared-spec items outside this task.

## Product and feature description

Administrators need to create and maintain the course catalogue and keep lecturer assignments
current so Students can browse real availability (`SH-02`/`SH-03`) and Lecturers can create slots
only for courses they are actually assigned to (`LEC-01`). Today courses and assignments can only
be seeded by a script; this adds an in-app `/admin/courses` workspace. Owner-confirmed scope:
create a course (code + name); edit a course's code/name; deactivate and reactivate a course;
assign an active lecturer account to a course; remove (end) an assignment; list/search/filter
courses with their current lecturers. No AI. Same security posture as `ADM-01`.

## Scope, non-goals, and dependencies

### In scope

Course create/edit/deactivate/reactivate; lecturer assignment add/remove; course+assignment
list/search/filter; admin-only authorization and RPC-only writes for all of the above.

### Non-goals

Hard delete of a course or assignment; course enrolment/capacity; slot/booking mutation (`SH-05`,
owned by Lecturer/Student specs); Lecturer's own-assignment projection (`SH-04-R4`, deferred to
Lecturer specs); bulk import; any AI feature.

### Dependencies

`SH-01` (identity/role); the existing `courses`/`course_lecturers` tables from
`supabase/migrations/20261018000000_student_browse_available_slots.sql`; the deactivation-notice
trigger from `supabase/migrations/20261020000000_lecturer_consultation_completion.sql`; the
`admin_set_role`/`admin_list_accounts` RPC conventions from `ADM-01`.

## Users, roles, and permissions

| Actor                | Allowed                                                                                    | Refused                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Active Administrator | Create/edit/deactivate/reactivate courses; assign/remove lecturer assignments; list/search | Hard delete; bypassing uniqueness/integrity; assigning inactive/non-lecturer accounts |
| Active Lecturer      | Nothing through these RPCs; own-assignment read stays under `LEC-01`'s existing policies   | Any course/assignment mutation, incl. direct RPC calls                                |
| Active Student       | Nothing                                                                                    | Any course/assignment mutation or admin-only read, incl. direct RPC calls             |
| Signed-out/inactive  | Nothing                                                                                    | All course/assignment data and writes                                                 |

Trusted identity/role: server-resolved session via `requireRole("admin")` and
`current_app_role()`, same as `ADM-01`. UI hiding is not authorization.

## Functional requirements

### ADM-02-R1 — Create a course

`confirmed` capability; `proposed` bounds. An admin supplies `code` and `name`. The server
normalizes the code to `upper(trim(code))` for storage and uniqueness; proposed bounds: code 2–20
normalized characters, `A-Z0-9` plus `/` `-` `_`; name 1–200 trimmed characters, non-empty.
Normalized code is unique across **every** course, active or inactive — a duplicate against an
inactive course is refused the same as against an active one (simpler than conditional reuse for
this timeline; an admin reactivates instead of recreating). A new course starts `is_active = true`.

### ADM-02-R2 — Edit a course's code/name

`confirmed`. An admin updates an existing course's code and/or name under the same validation and
uniqueness rules as `R1` (excluding the course's own current row from the duplicate check). An
unknown course ID is refused.

### ADM-02-R3 — Deactivate and reactivate a course

`confirmed`. Setting `courses.is_active = false`/`true` preserves the course row and every
dependent assignment, slot, and booking unchanged (adopts `SH-04-R1`/`R5`). Deactivation needs no
new read-side code: `browse_available_slots` already joins `courses c ... and c.is_active`, so a
deactivated course's new and existing unbooked slots stop appearing to Students immediately;
reactivation restores eligibility subject to the same predicate. Course deactivation does **not**
fire the existing `notify_consultation_deactivation` trigger (it only watches
`consultation_slots.is_active` and `course_lecturers.is_active`) — a parity gap noted as
non-blocking below, since the owner-confirmed scope does not require a notification here.

### ADM-02-R4 — Assign a lecturer to a course

`confirmed`. An admin links one course and one profile with trusted role `lecturer`. Refused when:
the course does not exist or is inactive (`course_not_found`/`course_inactive`); the target does
not exist, is inactive, or is not role `lecturer` (`lecturer_not_found`/`lecturer_inactive`/
`lecturer_wrong_role` — specific, because the caller is always an admin who already has full
account visibility via `ADM-01-R2`, so non-enumeration does not apply here); or a current (active)
assignment for that exact pair already exists (`conflict_duplicate_assignment`). The existing
partial unique index `course_lecturers_current_pair_idx` on `(course_id, lecturer_id) where
is_active` is the concurrency authority; the RPC pre-checks, then maps a `unique_violation` from a
true race to the same `conflict_duplicate_assignment`.

### ADM-02-R5 — Remove (end) an assignment

`confirmed`. The RPC sets `is_active = false, ended_at = now()` on the targeted current pair in one
update — never a delete — which is exactly the transition the existing
`course_assignment_deactivation_notice` trigger listens for (`after update of is_active ... when
old.is_active and not new.is_active`), so removal continues to notify affected approved bookings'
student and lecturer without any new trigger. Removal preserves the assignment row, every slot, and
every booking, and makes no automatic transition to any booking (adopts `SH-04-R3`/`R5`). Future
slot creation for that pair is blocked immediately (derived ineligibility); already-created future
unbooked slots for that pair also stop appearing to Students, since browse already requires a
current assignment (`SH-02-R3`). An unknown or already-non-current `assignment_id` is refused
(`forbidden_or_not_found`).

### ADM-02-R6 — Re-assigning after removal

`confirmed`, `proposed` mechanism. Assigning the same lecturer to the same course again after a
prior removal **inserts a new `course_lecturers` row** (`is_active = true`, `ended_at = null`)
rather than reactivating the ended row. Justification: the current-pair unique index constrains
only active rows, so multiple inactive historical rows for one pair are already permitted and keep
each assignment period's own `created_at`/`ended_at` distinct; reactivating the old row would
overwrite that period's `ended_at` and merge two separate periods into one record. This needs no
extra validation beyond `R4`, since the insert-path trigger
(`enforce_current_course_lecturer_endpoints`) already re-checks active endpoints on insert.

### ADM-02-R7 — List, search, and filter courses and their lecturers

`confirmed` capability, `proposed` shape. An admin lists courses (default: all, active and
inactive) filterable by active status and searchable by code/name substring, each with its current
(active) lecturer assignment(s). Mirrors `ADM-01-R2`'s `admin_list_accounts` pattern: a
security-definer RPC returning only allowlisted fields, never a raw table read. The lecturer-picker
UI control reuses `ADM-01`'s existing `admin_list_accounts(p_role: 'lecturer', p_active: true)` —
no new read RPC is needed for it.

### ADM-02-R8 — Administrator-only mutation boundary

`confirmed`, same posture as `ADM-01-R1`–`R4`'s inherited controls. Every course/assignment write
is a new security-definer RPC (`set search_path = ''`, checks `current_app_role() = 'admin'` first,
`execute` revoked from `public`/`anon`/`authenticated` then granted to `authenticated` only) called
only after `requireRole("admin")` in the Server Action. No direct `INSERT`/`UPDATE` grant on
`courses`/`course_lecturers` is added for `authenticated`.

### ADM-02-R9 — No-AI boundary

`confirmed`, inherited from `SH-04-R7`/`PRODUCT-SPEC.md`. No course/assignment create, edit,
deactivate, reactivate, assign, remove, or list operation calls a model, builds a prompt, or writes
`ai_usage`.

## Non-functional requirements

No new performance/accessibility target beyond `ADM-01`'s conventions (keyboard operable, visible
focus, labelled errors). Catalogue size is small for this course project; no pagination SLA, same
decision as `ADM-01-R2`.

## UI description

An "Courses" page under `/admin/courses`, mirroring `/admin/accounts`: search/active-filter bar;
a course list/table (code, name, active badge, current lecturer(s) with a per-row "Remove"
control and a per-row "Assign lecturer" picker limited server-side to active lecturer accounts);
a "Create course" form (code, name); a per-row "Edit" form (code, name); a per-row
"Deactivate"/"Reactivate" toggle. States: loading, empty result, field validation error, duplicate-
code conflict, duplicate-assignment conflict, submitting, success. No control is merely hidden —
every action is refused server-side regardless of UI state.

## Use cases

- **UC1 Create and assign**: admin creates a course, then assigns an active lecturer; both appear
  in the course list; the lecturer's own slot-creation screen (`LEC-01`) now permits that course.
- **UC2 Remove and re-assign**: admin removes a lecturer's assignment (existing approved bookings
  for that pair are preserved and their student/lecturer notified by the existing trigger); the
  course list drops that lecturer; admin later re-assigns the same lecturer, creating a second,
  distinct assignment row.
- **UC3 Deactivate a course**: admin deactivates a course with existing future unbooked slots;
  those slots stop appearing in Student browse; all rows remain stored; reactivating restores
  browse eligibility.
- **UC4 Refused assignment**: admin attempts to assign a lecturer to an inactive course, or to
  assign a deactivated/student-role account, or to assign an already-assigned pair — each refused
  with a specific, no data changed.
- **UC5 Non-admin direct call**: a Lecturer or Student (or signed-out caller) calls any RPC above
  directly; refused, no data returned, no mutation.

## Technical constraints and proposals

`createAdminClient` is not needed here (unlike `ADM-01`'s auth-admin calls); every write and read
goes through a new security-definer RPC after `requireRole("admin")`, matching Joseph's/`ADM-01`'s
pattern. Zod `.strict()` schemas validate all Server Action inputs before the RPC call. One new
append-only migration adds the RPCs and a new unique index on `upper(trim(code))` across
`courses`; no existing migration is edited.

## Data model and integrity rules

No new table. `courses`/`course_lecturers` remain the system of record (both already exist and
already revoke all `authenticated`/`anon` table privileges). A new append-only migration adds:

- A unique index on `public.courses (upper(trim(code)))` (not partial — spans active and inactive
  rows), enforcing `ADM-02-R1`'s uniqueness.
- `admin_create_course(code text, name text)`, `admin_update_course(course_id uuid, code text,
name text)`, `admin_set_course_active(course_id uuid, is_active boolean)`,
  `admin_list_courses(p_query text default null, p_active boolean default null)`,
  `admin_assign_lecturer(course_id uuid, lecturer_id uuid)`, and
  `admin_remove_assignment(assignment_id uuid)` — each `security definer`, `set search_path = ''`,
  checking `current_app_role() = 'admin'` first; `execute` revoked from `public`/`anon`, granted to
  `authenticated` only.
- `admin_remove_assignment` updates `is_active`/`ended_at` together so the existing
  `course_assignment_deactivation_notice` trigger continues to fire correctly; no trigger is edited.

## API and boundary contracts

Proposed internal Server Actions under `/admin/courses`, each requiring `requireRole("admin")`
first:

- `createCourse({code, name})` → `{id, code, name, isActive}` or `validation_error` /
  `conflict_duplicate_code`.
- `updateCourse({courseId, code, name})` → same shape, or `validation_error` /
  `conflict_duplicate_code` / `forbidden_or_not_found`.
- `setCourseActive({courseId, isActive})` → `{courseId, isActive}` or `forbidden_or_not_found`.
- `listCourses({query?, activeFilter?})` → `{id, code, name, isActive, createdAt, lecturers:
[{assignmentId, lecturerId, lecturerName}]}[]`.
- `assignLecturer({courseId, lecturerId})` → `{assignmentId, courseId, lecturerId}` or
  `validation_error` / `course_not_found` / `course_inactive` / `lecturer_not_found` /
  `lecturer_inactive` / `lecturer_wrong_role` / `conflict_duplicate_assignment`.
- `removeAssignment({assignmentId})` → `{assignmentId}` or `forbidden_or_not_found`.

No action accepts a caller-supplied role/ID override or an arbitrary field/SQL selector. Non-admin
or signed-out direct calls to any action or its underlying RPC get `forbidden_or_not_found` (the
authorization-layer refusal), with no data disclosed.

## Security requirements

- Every page/layout and Server Action/RPC calls `requireRole("admin")`/`current_app_role() =
'admin'` first; writes mutate no row before that check passes.
- Trusted: session role. Untrusted: code, name, course/lecturer/assignment IDs — server-validated
  (bounded length, canonical UUID, enum-safe booleans).
- Responses never leak raw database errors/SQL/schema; errors are typed `kind` values only.
- Specific (non-"non-enumerating") refusal reasons for `assignLecturer` are intentional: the caller
  is always an admin who already has full account visibility (`ADM-01-R2`); this boundary is not a
  Student-facing disclosure surface.
- This path needs independent human review before merge (security-sensitive, new RPCs).

## AI behavior

No AI is used. No model call, prompt, or `ai_usage` read/write occurs on any course/assignment
management path.

## Edge cases and failure paths

| Condition                                                     | Required outcome                                           | Invariant preserved                           |
| ------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| Duplicate normalized code vs. any course (active or inactive) | `conflict_duplicate_code`, no row changed                  | One canonical code per course ever            |
| Invalid code/name (bounds/characters)                         | `validation_error` naming the field                        | No malformed course created/updated           |
| Assign to an inactive course                                  | `course_inactive`, no assignment created                   | Current pairs require an active course        |
| Assign a deactivated or non-lecturer account                  | `lecturer_inactive` / `lecturer_wrong_role`, no assignment | Current pairs require an active lecturer      |
| Duplicate active assignment, incl. a concurrent race          | `conflict_duplicate_assignment`, at most one pair exists   | Current-pair uniqueness                       |
| Remove an assignment with pending/approved bookings           | Assignment, slots, bookings all preserved unchanged        | No implicit booking transition                |
| Deactivate a course with existing future unbooked slots       | Rows preserved; slots stop appearing in Student browse     | Archive-over-delete; browse predicate honored |
| Non-admin/signed-out direct RPC call                          | `forbidden_or_not_found`, no data, no mutation             | Only active admins reach these RPCs           |
| Unknown course/assignment ID on edit/activate/remove          | `forbidden_or_not_found`, no change                        | No action on a nonexistent target             |

## Acceptance criteria and verification

Planned tests, not results.

- **ADM-02-AC1** (R1; integration; live DB) Given an admin and a valid code/name, when they create a course, then exactly one course row exists with that normalized code and `isActive = true`.
- **ADM-02-AC2** (R1; integration; live DB) Given an existing course, active or deactivated, when another course is created with the same normalized code, then the call returns `conflict_duplicate_code` and no second row is created.
- **ADM-02-AC3** (R1; unit; mocked) Given an empty name or an out-of-bounds/invalid-character code, when creation is attempted, then it returns `validation_error` naming the field and creates no row.
- **ADM-02-AC4** (R2; integration; live DB) Given an existing course, when an admin edits its code and name to new valid values, then the stored row reflects both changes.
- **ADM-02-AC5** (R2; integration; live DB) Given two existing courses, when one is edited to the other's normalized code, then the call returns `conflict_duplicate_code` and neither row changes.
- **ADM-02-AC6** (R3; pgTAP plus integration; live DB) Given a course with a future unbooked slot, when the course is deactivated, then the course/slot/assignment rows are unchanged but the slot no longer appears in `browse_available_slots`.
- **ADM-02-AC7** (R3; integration; live DB) Given a deactivated course reactivated, when its slot still satisfies every other browse predicate, then the slot appears in `browse_available_slots` again.
- **ADM-02-AC8** (R4; integration; live DB) Given an active course and an active lecturer account, when an admin assigns them, then exactly one active `course_lecturers` row links that pair.
- **ADM-02-AC9** (R4; integration; live DB) Given a deactivated course, when an admin attempts to assign a lecturer to it, then the call returns `course_inactive` and no row is created.
- **ADM-02-AC10** (R4; integration; live DB) Given a deactivated lecturer account or an account with role `student`, when an admin attempts to assign it to a course, then the call returns `lecturer_inactive` or `lecturer_wrong_role` and no row is created.
- **ADM-02-AC11** (R4; pgTAP concurrency; live DB) Given an existing active assignment for a pair, when a second assignment for the same pair is attempted, including two concurrent attempts, then at most one active row for that pair ever exists and the loser receives `conflict_duplicate_assignment`.
- **ADM-02-AC12** (R5; pgTAP plus integration; live DB) Given a current assignment with an approved booking, when an admin removes the assignment, then the row becomes `is_active = false` with `ended_at` set, the booking and slot are unchanged, and the student/lecturer each receive the existing deactivation notification.
- **ADM-02-AC13** (R6; pgTAP; live DB) Given a previously removed assignment for a pair, when an admin re-assigns the same pair, then a new active row is created with its own `created_at`/`ended_at = null`, and the prior row's `ended_at` is unchanged.
- **ADM-02-AC14** (R7; integration; live DB) Given courses with and without current lecturers, when an admin lists/searches/filters them, then the response contains only the allowlisted fields and each course's current lecturer(s) are exactly its active `course_lecturers` rows.
- **ADM-02-AC15** (R8; integration (security); live DB) Given a signed-out, Student, or Lecturer caller, when they invoke any course/assignment Server Action or RPC directly, then the call returns `forbidden_or_not_found` and performs no mutation and returns no data.
- **ADM-02-AC16** (R9; unit plus database before/after; mocked) Given any course/assignment management operation, when it runs successfully or fails, then it makes no model/provider call and writes no `ai_usage` row.

## Review evidence

- Challenge record: none yet; not independently reviewed.
- Review type: not yet reviewed.
- Open findings: none recorded yet.
- Human input required: owner review of the proposed code bounds/normalization (`R1`), the
  insert-new-row re-assignment choice (`R6`), and the `admin_list_courses` shape (`R7`); none of
  these block drafting further.

## Open questions blocking approval

None blocking.

Non-blocking: course deactivation does not fire the existing lecturer/slot deactivation-notice
trigger (no notification on course deactivation) — acceptable since the owner-confirmed scope does
not require one; a lecturer's role later changing away from `lecturer` via `ADM-01`'s
`admin_set_role` leaves the `course_lecturers` row stored as-is but immediately ineligible for new
slots/browse through existing derived-eligibility checks (`SH-02-R3`), needing no ADM-02 action;
retention duration, post-use code rename beyond ordinary edit, and physical deletion of a
never-used course stay open shared-spec (`SH-04`) items outside this task.

## Change log

| Date       | Change and reason                                                             | IDs affected    | Evidence invalidated    | By                     |
| ---------- | ----------------------------------------------------------------------------- | --------------- | ----------------------- | ---------------------- |
| 2026-10-20 | First draft from owner-confirmed scope and inspected code/migrations          | R1–R9, AC1–AC16 | None; no prior approval | requirements_architect |
| 2026-10-20 | Owner approval; proposed code rules, re-assignment and refusal kinds accepted | R1–R9           | None                    | Johannsen              |
