---
id: STU-01
title: Browse and filter available consultation slots
owner: josephkwok001
status: approved
---

# STU-01: Browse and filter available consultation slots

## Document control

- Version: `0.3-approved`
- Browse clarification record and bounded follow-up plan:
  `workflow/reviews/stu-01/browse-clarifications.md` (`STU-01-CLARIFY-FOUR`).
- Confirmed clarification source: Joseph requested applying the four preceding recommendations on
  2026-10-18: independent option caps, non-vacuous filter tests, explicit stale cursors without expiry,
  and filter-independent dropdowns. Joseph reported team approval of this exact revised content on
  2026-10-22.
- Prior approval date: `2026-10-18`
- Approval report: Joseph communicated in the project Codex conversation that the team approved this
  specification and named Jordan as its reviewer.
- Team-reported reviewed content digest: `13fb2e0693210f4a97e75b395b167d2cf3f3d4f8`.
- Current approval record: Joseph confirmed on 2026-10-22 that the team approved the implemented
  STU-01 requirements. This is team-reported approval; teammate identity and protected-PR evidence
  were not independently verified here.
- Prior canonical metadata digest: `17248e77c0b9801810c3c190e925bfec62ab03b9`.
- External evidence limitation: no GitHub review, protected-PR URL, or independently verified reviewer
  identity was supplied. This repository record documents Joseph's report only.
- Parent requirements: `PRD-01` student browse behavior and `PRD-01-AC10`; `TEC-01` slot
  discovery; `INT-01` Browse slots contract, `INT-01-AC3`, `INT-01-AC5`, and `INT-01-AC6`;
  `SHR-01-AC1`, `SHR-01-AC2`, and `SHR-01-AC3`; `PLN-01/P3` and `PLN-01-AC1`
- Dependencies: draft shared course/lecturer specification (`SH-02`), draft shared
  slot/booking/RLS specification (`SH-03`), and draft authentication foundation (`SH-01`).
- Material revision: Joseph confirmed on `2026-10-18` that the exact per-slot projection permits opaque
  `courseId` and `lecturerId` in addition to the previously listed fields. This data-contract change
  resets the canonical specification pending review; Joseph's 2026-10-22 team-approval report renews
  approval for this revised contract.
- Change-impact record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-impact.md`.

## Context

A signed-in student needs to find a future consultation slot before requesting a consultation. This
feature provides a read-only, bounded list of slots and optional lecturer, course, and calendar-date
filters. It does not reserve a slot or create, edit, or disclose any booking.

Current-state evidence on 2026-10-18, not product authority: the working tree contains a `/student/slots`
page, server validation, a browse RPC, new feature tables, RLS/grants, and unit/pgTAP/Playwright tests.
The implementation is uncommitted and incomplete: its option lists are not capped at 200 and the
existing broad staff-profile RLS policy conflicts with the revised Student profile boundary.

## Reviewed decisions and implementation constraints

Joseph reported team approval of the prior specification on 2026-10-18 and later confirmed the material
cross-spec decisions recorded in the impact record. The requirements below are the resulting approved
version, based on Joseph's team-approval report on 2026-10-22.

1. The authoritative display and date-filter timezone is `Asia/Singapore`; timestamps remain stored
   as PostgreSQL `timestamptz` values and are serialized in ISO 8601 form.
2. A slot is available only when its start is strictly later than server/database time, its course
   is active, its lecturer has an active lecturer profile and a current assignment to that course,
   and it has no booking with status `pending` or `approved`.
3. Rejected and cancelled historical bookings do not hide an otherwise available slot. A completed
   booking does not make a slot reusable; shared booking invariants must prevent a future slot from
   being completed before it ends.
4. The date filter matches the slot's start time within the selected Singapore calendar date; it
   does not match merely because a slot overlaps that date.
5. Results are ordered by `starts_at` ascending, then opaque slot ID ascending, and are cursor-
   paginated with 20 results per page and no client-controlled page-size increase.
6. Syntactically invalid filter input is a validation error. A well-formed but nonexistent or
   inaccessible lecturer/course identifier returns the same empty-result state so identifiers
   cannot be enumerated through different error messages.
7. Browsing is restricted to students. Lecturer and administrator slot-management/listing behavior
   belongs to their own specifications.

Changing any decision above changes observable behavior or security boundaries and therefore
requires spec revision before tests or code change.

## Requirements

### STU-01-R1 — Student journey

1. A signed-in, active student can open `/student/slots` from the Student dashboard.
2. The initial view lists the first page of available slots using server/database time as the
   authority for whether a slot is in the future.
3. Each result's data contains only the exact `AvailableSlot` fields in `SH-03-R11`. The UI displays the
   course code/name, Lecturer display name, and start/end date and time labelled in the authoritative
   timezone. The opaque slot, course, and Lecturer IDs are machine references for approved filters and
   the later request-consultation feature; the UI need not show their raw UUID text. No additional slot
   field is permitted.
4. The page provides optional lecturer, course, and single-date filters. An omitted filter means
   “all” for that dimension.
5. Applying multiple filters uses intersection semantics: every supplied filter must match.
6. The student can clear all filters and return to the unfiltered first page.
7. Applying or changing a filter resets pagination to the first page.
8. If there are no matching slots, the page shows a neutral empty state rather than an error.
9. If another student reserves a displayed slot after the page loads, this browse page need not
   update in real time. The later request operation must re-check availability and may return a
   conflict. Browsing itself never promises or reserves availability.

### STU-01-R2 — Availability rule

A returned slot must satisfy all of these conditions at query time:

- `starts_at` is strictly later than server/database `now()`;
- `ends_at` is later than `starts_at` (also a shared database invariant);
- the referenced course is active;
- the referenced profile is active and has role `lecturer`;
- the lecturer is currently assigned to the slot's course; and
- no related booking has status `pending`, `approved`, or `completed`.

Rejected or cancelled booking rows remain historical and do not by themselves hide the slot. The
query must evaluate availability in trusted application/database code, not from browser-supplied
flags or the browser clock.

### STU-01-R3 — Filter contract

The logical read operation accepts only:

```ts
type BrowseAvailableSlotsInput = {
  lecturerId?: string; // canonical UUID
  courseId?: string; // canonical UUID
  date?: string; // strict YYYY-MM-DD calendar date
  cursor?: string; // opaque server-issued continuation token
};
```

- Unknown input keys are rejected by the browse boundary and never become database filter
  expressions.
- UUIDs and the date are validated before the slot query runs.
- A date is converted to an inclusive start and exclusive end in `Asia/Singapore`, then to UTC for
  comparison: `starts_at >= dateStartUtc AND starts_at < nextDateStartUtc`.
- Lecturer, course, and date filters may be supplied separately or together.
- Course and Lecturer dropdowns come from all currently available slots under `SH-03-R6`, before
  applying selected filters or pagination. Selecting a lecturer, course, date, or cursor never narrows
  either dropdown. Each list independently returns all eligible distinct options up to its first 200
  in the deterministic order in `SH-02-R6`. An empty filtered result may retain nonempty dropdowns.
- The cursor encodes only stable ordering data, is validated, and cannot change the student role,
  page size, availability predicate, or other filters.
- A cursor is stale when its anchor slot is no longer available under the bound filters and ordering
  position (including deletion, reservation, lifecycle ineligibility, or a changed start time), or its
  version is unsupported. There is no elapsed-time expiry: an older cursor remains valid while its
  anchor/version/binding remains valid. Stale, altered, malformed, and wrong-filter cursors return no
  partial results and offer a first-page restart retaining valid filters; see `SH-03-R12`.
- Results are ordered and paginated as proposed in decision 5. The response does not disclose a
  total count if computing it would permit hidden-record enumeration.

### STU-01-R4 — Authorization and data access

- The page and every supporting Server Action or Route Handler call `requireRole("student")` before
  querying feature data.
- Signed-out users are redirected to `/login`. Authenticated lecturers and administrators are
  redirected to their own role dashboard or receive the project's standard refusal if they call a
  non-page boundary directly.
- PostgreSQL RLS, or a narrowly scoped database function with an explicit active-student check and
  fixed `search_path`, independently enforces the same read boundary. A service-role/admin client
  is not required and must not be used for ordinary student browsing.
- Students may read the available-slot projection described in `STU-01-R1`. They may not receive:
  student identities, booking IDs, booking status/history, topics, questions, rejection reasons,
  lecturer email/contact data, inactive profiles/courses, internal audit fields, or AI usage data.
- Students may directly read only their own profile row. Lecturer discovery, including names and opaque
  lecturer IDs, occurs through the narrow browse RPC; Student credentials cannot directly select other
  Lecturer or Administrator profile rows.
- Inaccessible and nonexistent filter identifiers use the same observable response shape.
- The student's identity and role come from the validated server session, never request parameters.

The shared data specifications define the authorization and projection behavior. After their exact
digests are approved, an implementation may choose the physical RLS/function design and must prove it
with pgTAP tests in a new append-only migration.

### STU-01-R5 — Failure behavior

| Condition                                                     | Required outcome                                                                                                |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Missing session                                               | Redirect to `/login`; no slot data is returned                                                                  |
| Wrong role or inactive account                                | Refuse/redirect under the shared auth contract; no slot data is returned                                        |
| Malformed UUID, date, cursor syntax, or unknown input key     | Return a field-level validation message before a slot query                                                     |
| Structurally valid but stale, altered, or wrong-filter cursor | Validate at the trusted boundary; return no partial result and offer first-page restart retaining valid filters |
| Well-formed inaccessible/nonexistent ID                       | Show the normal empty-result state without confirming existence                                                 |
| No matching available slots                                   | Show “No available slots match these filters” and allow filters to be cleared                                   |
| Database/query unavailable                                    | Show a generic temporary-error state with retry; disclose no raw database error or stack trace                  |
| Slot changes after rendering                                  | A later request may conflict; browsing performs no mutation and shows no false reservation claim                |
| Malicious stored display text                                 | Render it as plain text; do not interpret HTML, script, URL, or instructions                                    |

Expected failures must be typed/handled. Server logs may record a request/correlation identifier and
failure category, but not secrets or private booking content.

### STU-01-R6 — Accessibility and bounded operation

- Filter controls have programmatic labels, are keyboard operable, and expose loading, validation,
  empty, and error states through text rather than colour alone.
- Course and lecturer names and slot times remain understandable at supported viewport sizes.
- Each request returns at most 20 slot results, 200 course options, and 200 Lecturer options under the
  deterministic/non-disclosing rules in `SH-02-R6`. The server rejects malformed cursors and does not
  accept caller-selected limits, SQL fragments, sort expressions, arbitrary date ranges, or wildcard
  searches.
- Repeated refreshes remain read-only. General infrastructure protections may rate-limit abusive
  traffic, but no feature-specific rate threshold is proposed by this draft.

### STU-01-R7 — AI permissions

This feature has no AI action. Browsing and filtering are deterministic database operations.

- It must not call `generateText`, any model provider, or the `ai_usage` table.
- Slot, lecturer, course, filter, or session data must not be sent to an LLM.
- Model output must not determine visibility, availability, ordering, filtering, or authorization.
- The Student “Improve my request” AI capability is a separate future feature (`STU-05`) and has no
  authority in this browse flow.

### STU-01-R8 — Abuse and security cases

The implementation and its tests must address:

1. direct navigation or direct action/handler invocation by a signed-out user or wrong role;
2. substitution of another user's ID or a claimed role in query parameters;
3. requests for inactive, nonexistent, or unauthorized lecturer/course identifiers;
4. UUID, date, cursor, unknown-key, SQL-injection, and oversized-query-string payloads;
5. client-clock manipulation intended to reveal past slots;
6. scraping or resource exhaustion through unbounded page sizes, arbitrary ranges, counts, or sort
   expressions;
7. stored HTML/script or instruction-like text in lecturer/course display fields;
8. attempts to infer private bookings from returned fields, total counts, error differences, or
   timing-sensitive existence messages; and
9. attempts to trigger AI through filter values or stored text.

No response to these cases may mutate data, weaken the availability predicate, expose inaccessible
records, or return raw infrastructure details.

## Data and dependency contract

STU-01 reads but does not create or update `courses`, `course_lecturers`, `consultation_slots`, and
`bookings`, plus its narrow dependency on `profiles`. The shared specs define the normative constraints,
RLS boundaries, assignment eligibility, and booking-state representation; physical schema details not
fixed by those behaviors remain implementation proposals.

At minimum, the approved shared contract must support:

- course identity, code, name, and active state;
- lecturer identity, safe display name, active state, and role;
- current lecturer-course assignment;
- slot identity, lecturer, course, `starts_at`, and `ends_at`;
- booking-to-slot relation and a status sufficient to exclude `pending` and `approved`; and
- indexes that bound the future/active/filter query without weakening RLS.

STU-01 performs no write, reservation, or AI-usage accounting. A future request feature must
transactionally re-check the chosen slot; this list is only a point-in-time projection.

## Acceptance criteria

Tests must reference these IDs exactly. Each criterion states one primary observable outcome.

- **STU-01-AC1** Given an active signed-in student, when they open `/student/slots`, then the server
  authorizes the student role and returns the first bounded page of available slots.
- **STU-01-AC2** Given a signed-out user, when they open `/student/slots`, then they are redirected to
  `/login` and receive no slot data.
- **STU-01-AC3** Given an authenticated lecturer or administrator, when they directly open or invoke
  the student browse boundary, then it refuses or redirects them and returns no slot data.
- **STU-01-AC4** Given past, currently started, and future slots, when the list is queried, then only
  slots whose start is strictly after server/database time are returned.
- **STU-01-AC5** Given future slots linked to inactive courses, inactive/non-lecturer profiles, or a
  missing current course assignment, when the list is queried, then those slots are absent.
- **STU-01-AC6** Given a future slot with a pending or approved booking, when the list is queried,
  then that slot is absent.
- **STU-01-AC7** Given a future slot whose only bookings are rejected or cancelled, when the list is
  queried, then the slot is eligible to appear.
- **STU-01-AC8** Given an available slot, when it is returned, then its projection contains only the
  eight fields `slotId`, `courseId`, `courseCode`, `courseName`, `lecturerId`, `lecturerName`,
  `startsAt`, and `endsAt`; both timestamps are ISO-8601 UTC instants ending in `Z`, and none of the
  prohibited fields in `STU-01-R4` is present.
- **STU-01-AC9** Given otherwise-available matching and different-Lecturer fixtures fitting one page,
  applying the lecturer filter includes the known matching slot and excludes the nonmatching slot;
  every returned slot belongs to that lecturer (pgTAP/integration).
- **STU-01-AC10** Given otherwise-available matching and different-course fixtures fitting one page,
  applying the course filter includes the known matching slot and excludes the nonmatching slot;
  every returned slot belongs to that course (pgTAP/integration).
- **STU-01-AC11** Given otherwise-available fixtures fitting one page at the selected Singapore day's
  inclusive start, just before its start, and exclusive next-day start, applying the date filter
  includes the matching start fixture and excludes both outside fixtures; every returned start falls
  within the selected day (pgTAP/integration).
- **STU-01-AC12** Given one fully matching available slot and three available fixtures differing only
  in lecturer, course, or date, all fitting one page, applying all three filters includes the full
  match and excludes each partial match; every returned slot satisfies all three (pgTAP/integration).
- **STU-01-AC13** Given more than 20 matching slots with equal and differing start times, when pages
  are traversed using server cursors, then each page has at most 20 results in deterministic
  start-time/slot-ID order without duplication.
  With controlled between-page changes, an unavailable/changed anchor or unsupported version returns
  no partial result and offers restart with valid filters retained. An otherwise-valid older cursor
  is accepted without time-based expiry (`SH-03-AC22`; integration plus browser recovery test).
- **STU-01-AC14** Given a malformed UUID, date, cursor syntax, or unknown input key, when browsing is
  requested, then a validation error is returned before a slot query runs.
- **STU-01-AC15** Given a well-formed nonexistent or inaccessible filter identifier, when browsing is
  requested, then the normal empty-result shape does not reveal whether that record exists.
- **STU-01-AC16** Given no matching available slots, when the query succeeds, then the student sees
  the neutral empty state and can clear the filters.
- **STU-01-AC17** Given the database query fails, when the page handles the failure, then it shows a
  generic retryable error without returning a raw database message, stack trace, or secret.
- **STU-01-AC18** Given a lecturer or course display field containing HTML, script, or instruction-
  like text, when the field is displayed, then it is rendered as plain text and no script executes.
- **STU-01-AC19** Given any successful or failed browse/filter operation, when system interactions are
  inspected, then no LLM call or `ai_usage` record was created.
- **STU-01-AC20** Given a student uses the browse/filter operation, when database activity is
  inspected, then no slot, booking, course, profile, assignment, or AI record was mutated.
- **STU-01-AC21** Given a student attempts a direct database read outside the allowed available-slot
  projection, when RLS or the scoped database boundary evaluates it, then inaccessible data is
  denied and no protected fields are returned.
- **STU-01-AC22** Given a caller supplies a page size, arbitrary range, sort expression, SQL-like
  value, unknown ownership field, or claimed role, when the request is processed, then those values
  cannot expand the result scope or alter authorization.

## Required future validation

- Unit/Vitest: strict filter parsing, date-bound conversion, cursor validation, deterministic ordering,
  20/200/200 response caps, exact UTC wire parsing, and typed result mapping.
- pgTAP: RLS enabled; active students can read only the allowed projection; signed-out, inactive,
  lecturer, and administrator actors cannot use the Student boundary; active-booking, inactive-
  course, inactive-lecturer, assignment, and direct-table abuse cases.
- Playwright: authorized list/filter/clear/empty/error behavior, wrong-role direct navigation,
  keyboard/label behavior, and stored-script display as text.
- pgTAP/contract under `SH-02-AC8` and `SH-03-AC30`: independent option caps including asymmetric
  catalogues, plus identical dropdowns before/after filtering or pagination with availability held
  fixed. Empty selected results must not imply empty global dropdowns.
- Security review: ID substitution, hidden-record enumeration, query amplification, browser-clock
  manipulation, own-profile versus other-profile access, data-minimization, RLS/function safety, and
  confirmation that no AI path exists.

Future implementation ownership, after dependency approval, is expected to be:

- Student owner: `src/app/student/slots/`, `src/features/student/slots/`, Student unit tests, and
  `tests/e2e/student-browse-available-slots.spec.ts`.
- Shared team with independent review: a new append-only file under `supabase/migrations/`, related
  files under `supabase/tests/`, and only any approved shared helpers under `src/lib/`.
- No existing migration may be edited.

## Out of scope

- Requesting or reserving a slot, viewing/editing/cancelling bookings, and booking concurrency.
- Lecturer slot creation, editing, deletion, or availability management.
- Course/lecturer administration, enrolment eligibility, announcements, notifications, calendar
  integration, real-time updates, free-text search, recurring slots, or map/location information.
- Any AI-generated recommendation, ranking, summarization, or natural-language filtering.
- Final visual design beyond the stated accessibility and state requirements.

## Confirmed decisions in this revision

The eight decisions previously listed here were confirmed before implementation and are now normative
in `STU-01` and its shared dependencies: Singapore time; derived active endpoint eligibility; completed
history finality; start-time date matching; 20-row cursor pagination with “Load more”; represented-only
filter options capped by the shared contract; catalogue-wide Student eligibility; and the accessibility
target in `SH-03-R15`.

No unresolved STU-01 product decision remains in this document. Joseph's team-approval report on
2026-10-22 approves this exact revised requirements version. Real acceptance tests, shared RLS migration
review, and manual/cross-browser verification remain required evidence, not product choices.

## Change log

| Date       | Change                                                                                          | By                     |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------------------- |
| 2026-10-17 | Initial requirements draft for human review; no implementation authorized                       | requirements_architect |
| 2026-10-18 | Recorded team-reported approval; retained unresolved implementation limits                      | requirements_architect |
| 2026-10-18 | Added approved per-slot IDs and exact wire allowlist; reset status to draft                     | requirements_architect |
| 2026-10-22 | Recorded Joseph's team approval of the implemented revised requirements; status set to approved | Joseph                 |
