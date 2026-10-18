---
id: STU-01
title: Browse and filter available consultation slots
owner: josephkwok001
status: draft
---

# STU-01: Browse and filter available consultation slots

## Document control

- Version: `0.1-draft`
- Human approver: none recorded
- Reviewed commit or digest: none; this draft must not be used as implementation approval
- Parent requirements: `PRD-01` student browse behavior and `PRD-01-AC10`; `TEC-01` slot
  discovery; `INT-01` Browse slots contract, `INT-01-AC3`, `INT-01-AC5`, and `INT-01-AC6`;
  `SHR-01-AC1`, `SHR-01-AC2`, and `SHR-01-AC3`; `PLN-01/P3` and `PLN-01-AC1`
- Dependencies: an approved shared course/lecturer specification (`SH-02`, planned), an approved
  shared slot/booking/RLS specification (`SH-03`, planned), and an approved authentication
  foundation (`SH-01`, currently draft)

## Context

A signed-in student needs to find a future consultation slot before requesting a consultation. This
feature provides a read-only, bounded list of slots and optional lecturer, course, and calendar-date
filters. It does not reserve a slot or create, edit, or disclose any booking.

Repository inspection on 2026-10-17 found only the protected `/student` placeholder dashboard,
shared profile/authentication scaffolding, and the initial `profiles` and `ai_usage` migration.
Courses, lecturer assignments, consultation slots, bookings, browsing queries, and their RLS
policies are planned work and are not currently implemented.

## Proposed decisions requiring human approval

The requirements below are precise enough to review and test, but they are proposals until a human
approves this spec.

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
3. Each result displays only:
   - course code and course name;
   - lecturer display name;
   - start and end date/time labelled in the authoritative display timezone; and
   - an opaque slot identifier used by the later request-consultation feature.
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
- no related booking has status `pending` or `approved`.

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
- The cursor encodes only stable ordering data, is validated, and cannot change the student role,
  page size, availability predicate, or other filters.
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
- Inaccessible and nonexistent filter identifiers use the same observable response shape.
- The student's identity and role come from the validated server session, never request parameters.

The approved shared data specification must choose the physical RLS/function design and prove it
with pgTAP tests before a migration is written.

### STU-01-R5 — Failure behavior

| Condition                                        | Required outcome                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Missing session                                  | Redirect to `/login`; no slot data is returned                                                   |
| Wrong role or inactive account                   | Refuse/redirect under the shared auth contract; no slot data is returned                         |
| Invalid UUID, date, cursor, or unknown input key | Return a field-level validation message and run no slot query                                    |
| Well-formed inaccessible/nonexistent ID          | Show the normal empty-result state without confirming existence                                  |
| No matching available slots                      | Show “No available slots match these filters” and allow filters to be cleared                    |
| Database/query unavailable                       | Show a generic temporary-error state with retry; disclose no raw database error or stack trace   |
| Slot changes after rendering                     | A later request may conflict; browsing performs no mutation and shows no false reservation claim |
| Malicious stored display text                    | Render it as plain text; do not interpret HTML, script, URL, or instructions                     |

Expected failures must be typed/handled. Server logs may record a request/correlation identifier and
failure category, but not secrets or private booking content.

### STU-01-R6 — Accessibility and bounded operation

- Filter controls have programmatic labels, are keyboard operable, and expose loading, validation,
  empty, and error states through text rather than colour alone.
- Course and lecturer names and slot times remain understandable at supported viewport sizes.
- Each request returns at most 20 results. The server rejects malformed cursors and does not accept
  caller-selected limits, SQL fragments, sort expressions, arbitrary date ranges, or wildcard
  searches.
- Repeated refreshes remain read-only. General infrastructure protections may rate-limit abusive
  traffic, but no feature-specific rate threshold is proposed by this draft.

### STU-01-R7 — AI permissions

This feature has no AI action. Browsing and filtering are deterministic database operations.

- It must not call `generateText`, any model provider, or the `ai_usage` table.
- Slot, lecturer, course, filter, or session data must not be sent to an LLM.
- Model output must not determine visibility, availability, ordering, filtering, or authorization.
- The Student “Improve my request” AI capability is a separate future feature (`STU-03`) and has no
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

STU-01 reads but does not create or update the planned `courses`, `course_lecturers`,
`consultation_slots`, and `bookings` entities, plus the existing `profiles` entity. The shared specs
must define their exact columns, constraints, indexes, RLS policies, assignment lifecycle, and
active-booking representation before implementation.

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
  fields allowed by `STU-01-R1` and none of the prohibited fields in `STU-01-R4`.
- **STU-01-AC9** Given a valid lecturer filter, when it is applied, then every returned slot belongs
  to that lecturer.
- **STU-01-AC10** Given a valid course filter, when it is applied, then every returned slot belongs
  to that course.
- **STU-01-AC11** Given a valid calendar-date filter, when it is applied, then every returned slot
  starts within that date's inclusive-start/exclusive-end bounds in the authoritative timezone.
- **STU-01-AC12** Given lecturer, course, and date filters together, when they are applied, then every
  returned slot satisfies all three filters.
- **STU-01-AC13** Given more than 20 matching slots with equal and differing start times, when pages
  are traversed using server cursors, then each page has at most 20 results in deterministic
  start-time/slot-ID order without duplication.
- **STU-01-AC14** Given a malformed UUID, date, cursor, or unknown input key, when browsing is
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

- Unit/Vitest: strict filter parsing, date-bound conversion, cursor validation, deterministic
  ordering helpers, and typed result mapping.
- pgTAP: RLS enabled; active students can read only the allowed projection; signed-out, inactive,
  lecturer, and administrator actors cannot use the Student boundary; active-booking, inactive-
  course, inactive-lecturer, assignment, and direct-table abuse cases.
- Playwright: authorized list/filter/clear/empty/error behavior, wrong-role direct navigation,
  keyboard/label behavior, and stored-script display as text.
- Security review: ID substitution, hidden-record enumeration, query amplification, browser-clock
  manipulation, data-minimization, RLS/function safety, and confirmation that no AI path exists.

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

## Open questions blocking approval

1. Confirm `Asia/Singapore` as the authoritative display and calendar-filter timezone.
2. Confirm whether inactive courses, inactive lecturers, and removed lecturer-course assignments
   hide existing future slots exactly as proposed.
3. Confirm that a completed booking can never make a future slot reusable, with the shared state
   rules preventing completion before the slot ends.
4. Confirm start-time date matching rather than any-overlap date matching.
5. Confirm 20-result cursor pagination and whether the initial release needs a “next page” control
   or automatic incremental loading.
6. Decide whether lecturer/course filter choices show all active catalogue entries or only entries
   represented in the currently available result set. This must not change the result authorization
   boundary.
7. Confirm whether students may browse every active course or whether course enrolment will restrict
   visibility. If enrolment is required, that model and its RLS rules are a new dependency.
8. Confirm the exact supported-browser/accessibility target inherited from the shared requirements.

## Change log

| Date       | Change                                                                    | By                     |
| ---------- | ------------------------------------------------------------------------- | ---------------------- |
| 2026-10-17 | Initial requirements draft for human review; no implementation authorized | requirements_architect |
