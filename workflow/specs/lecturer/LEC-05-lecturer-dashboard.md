---
id: LEC-05
title: Lecturer consultation dashboard
owner: lecturer
status: approved
---

# LEC-05: Lecturer consultation dashboard

## Document control

- Spec owner: Lecturer feature team.
- Reviewed commit or content digest: repository inspection on `2026-10-20`; exact digest pending human approval.
- Prior approved commit or digest invalidated by this revision: none.
- Parent/shared requirements: `SH-01`, `SH-03`, `SH-05`, `INT-01`; related Lecturer specs `LEC-01`, `LEC-02`, and `LEC-03`.
- Related plan and latest handoff: `workflow/handoffs/analyst-to-developer-lec-05-dashboard.md`.
- Confirmed requirements: a lecturer-facing dashboard should show lecturer-owned consultation bookings/slots as date/time blocks containing student name, topic, course/module code, and booking status; the screenshot is a visual reference only.
 - Confirmed decisions: the dashboard is read-only; existing request-decision controls remain available;
   Singapore time is used; the first version uses a responsive grouped list/timeline; only bookings appear;
   the default view contains the next 100 future consultations; rejected and cancelled records appear in a
   separate history section; administrators do not receive this dashboard; and both course code and course
   name are displayed.

## Product and feature description

An active Lecturer needs one overview of consultation activity instead of having to interpret separate
slot, request, and consultation sections. The dashboard presents the Lecturer's own consultation
bookings in chronological date/time blocks. Each block shows the student name, consultation topic,
course/module code, and a safe status label such as `Pending`, `Confirmed`, `Rejected: <reason>`,
`Ongoing`, or `Completed` according to the trusted booking and time state.

The result should be easy to scan and usable on narrow screens. The reference screenshot informs the
idea of time-based blocks, but does not prescribe its layout or visual styling.

## Scope, non-goals, and dependencies

### In scope

- A Lecturer-only dashboard view under the existing `src/app/lecturer/` area.
- Chronological date/time grouping for bookings attached to slots owned by the authenticated Lecturer.
- Display of student name, topic, course/module code, slot date/time, and status.
- Pending, approved/confirmed, rejected-with-reason, cancelled, ongoing, and completed states where
  they are present in the existing data model.
- Loading, empty, unavailable, and narrow-screen presentation states.
- Reuse of existing Lecturer consultation/request data contracts where they satisfy this projection.

### Non-goals

- Creating, editing, deleting, approving, rejecting, cancelling, or completing bookings or slots.
- Replacing the existing `LEC-01`, `LEC-02`, or `LEC-03` mutation workflows.
- A public calendar export, real-time subscriptions, drag-and-drop scheduling, or external calendar integration.
- AI generation or model calls.
- Administrator dashboard behavior unless separately approved.

### Dependencies

- Existing `profiles`, `courses`, `course_lecturers`, `consultation_slots`, and `bookings` schema.
- `LEC-01` slot ownership and Singapore-time display conventions.
- `LEC-02` decision statuses and rejection-reason display behavior.
- `LEC-03` derived ongoing/completed consultation status and history behavior.
- `SH-01` role checks and RLS; `SH-05` trusted state and ownership rules.

## Users, roles, and permissions

| Actor | Responsibility or goal | Allowed actions/data | Refused actions/data |
| --- | --- | --- | --- |
| Active Lecturer | Review their consultation schedule and request status | Own assigned-slot bookings and the allowlisted fields in this spec | Other Lecturers' slots/bookings, unrelated student data, client-supplied ownership |
| Active Student | Use their own student features | No Lecturer dashboard access | Any Lecturer dashboard route or data |
| Administrator | Administrative oversight | Unresolved; no access is granted by this draft | Dashboard data unless a separate approved policy grants it |
| Signed-out, inactive, or wrong-role user | None | Login or safe refusal only | Dashboard data and protected queries |

The server derives the Lecturer identity from the authenticated session. UI hiding is not authorization.
The database/RPC boundary must independently enforce role, active status, slot ownership, and active
course assignment as required by the shared specifications.

## Functional requirements

### LEC-05-R1 — Lecturer-owned dashboard projection

- Classification: `confirmed`.
- Source: user feature request; `SH-01`, `SH-05`, and existing `list_staff_consultations` behavior.

An active Lecturer can load a dashboard containing only bookings attached to consultation slots owned by
that Lecturer and valid for that Lecturer's active course assignment. The projection contains only the
fields listed in `LEC-05-R2`.

### LEC-05-R2 — Consultation block contents

- Classification: `confirmed`.
- Source: user feature request and existing Lecturer UI conventions.

Each displayed booking block includes the student's full name, topic, course/module code, slot start and
end time, and a status label. Student email, questions, internal IDs, audit fields, and unrelated profile
fields are not required by this feature and should not be added to the dashboard projection.

### LEC-05-R3 — Status presentation

- Classification: `confirmed` for using trusted status; `proposed` for exact visual wording.
- Source: user feature request; `INT-01` booking state protocol; existing `LEC-03` display derivation.

The dashboard presents pending requests as `Pending` and approved future bookings as `Confirmed` (or an
equivalent clearly approved label). Approved bookings that are currently in progress show `Ongoing`, and
approved bookings after their end time show `Completed`. Rejected bookings show `Rejected: <reason>` when
a rejection reason exists. Cancelled records show `Cancelled`. The exact capitalization and styling need
human confirmation but must not alter the stored status.

### LEC-05-R4 — Date/time grouping and timezone

- Classification: `proposed`.
- Source: existing Lecturer behavior displays times in `Asia/Singapore`; screenshot reference.

Blocks are ordered by slot start time and grouped or visually associated with their Singapore calendar date.
Persisted timestamps remain UTC and are formatted only at the presentation layer. The dashboard does not
trust a browser-provided time for authorization or lifecycle decisions.

### LEC-05-R5 — Safe read-only behavior

- Classification: `confirmed`.
- Source: `SH-01`, `SH-05`, and project security policy.

Loading or interacting with the dashboard does not mutate slots, bookings, decisions, notifications, audit
records, or AI usage. Existing approve/reject controls may remain available through their independently
authorized workflow, but the dashboard projection itself cannot change status.

### LEC-05-R6 — Resilient presentation

- Classification: `proposed`.
- Source: existing Lecturer page patterns and project UI requirements.

The page provides a usable empty state when there are no bookings, a loading state while the dashboard is
being fetched, and a safe retry/unavailable message for a dependency failure. The layout remains readable
at 320px width and 200% zoom, with keyboard-accessible controls and text status announcements where
controls are present.

## Non-functional requirements

- Authorization occurs before protected data is returned; RLS or an equivalent secured RPC independently
  enforces Lecturer ownership.
- The dashboard query is bounded. Exact page size, date horizon, and pagination/cursor policy are open
  questions and must be approved before implementation.
- The projection must not expose student email, questions, internal IDs, raw database errors, or data from
  another Lecturer.
- Ordinary dashboard availability must not depend on the SoC LLM; this feature makes no AI call.
- Date/time output uses ISO/UTC data internally and Singapore-localized human display.

## UI description

The existing Lecturer page is the entry point. The proposed dashboard may be placed before or replace the
separate consultation list presentation only after a human approves the exact integration. A first
implementation may use a responsive chronological list with date headings and bordered blocks rather than
a full weekly grid.

Each block should expose, in text:

- Singapore-local date and start/end time;
- course/module code;
- student name;
- topic; and
- status, including the rejection reason when applicable.

If request decision controls remain in the same page, they must preserve their existing labels, disabled
pending state, conflict handling, and independent authorization. No dashboard-only control should imply a
booking transition.

## Use cases

### UC1 — Lecturer views upcoming and active bookings

- Actors: active Lecturer.
- Preconditions: the Lecturer has one or more owned slots/bookings.
- Trigger: Lecturer opens `/lecturer`.
- Main flow: authorize session, fetch bounded owned projection, derive display status using trusted data/time,
  group/order by Singapore date/time, and render blocks.
- Alternative and failure flows: no rows shows an empty state; timeout/database failure shows a safe
  unavailable state; wrong-role access is refused before protected data is returned.
- Postconditions and invariants: no database state changes and no foreign Lecturer data is disclosed.

### UC2 — Lecturer reviews a rejected request

- Actors: active Lecturer.
- Preconditions: an owned booking has rejected status and a stored reason.
- Trigger: dashboard renders the record.
- Main flow: render `Rejected: <reason>` as inert text.
- Alternative and failure flows: absent reason renders `Rejected` without inventing a reason; markup in the
  reason is displayed as text, not interpreted as HTML.
- Postconditions and invariants: stored status/reason remain unchanged.

## Technical constraints and proposals

Fixed constraints: existing Next.js/Supabase architecture, server-side `requireRole`, append-only
migrations if schema changes are later approved, trusted server/database time, RLS/grants, and safe typed
failure results.

Implementation proposals requiring review: extend the existing `list_staff_consultations` projection or
add a dedicated read RPC; add a dashboard-specific component under `src/app/lecturer/` or
`src/components/`; use existing `Consultation` validation only if its fields match this spec. No new table
or migration is expected for the read-only dashboard unless inspection during implementation proves a
missing required field.

## Data model and integrity rules

Read `bookings` joined to `consultation_slots`, `courses`, `course_lecturers`, and the minimum trusted
student profile field needed for the name. The database query must enforce:

- `s.lecturer_id = auth.uid()` for Lecturer access;
- an active Lecturer role and active course assignment;
- no client-supplied Lecturer or Student ID as an authorization source; and
- a bounded result set/order.

The dashboard writes no data. Existing booking history and status transitions remain governed by `SH-05`,
`LEC-02`, and `LEC-03`.

## API and boundary contracts

Proposed logical read operation (name not approved):

```text
listLecturerDashboard({ range/cursor? })
  -> success { groups: [{ singaporeDate, blocks: [projection] }] }
  -> validation_error | forbidden_or_not_found | temporarily_unavailable
```

The projection should include `bookingId` only if needed for existing independently authorized controls;
otherwise internal IDs should remain server-side. It must include server-derived course code, student name,
topic, status, rejection reason when present, and UTC timestamps for presentation. Raw provider/database
errors are not returned.

## Security requirements

- Every Lecturer page/layout or server read boundary calls `requireRole("lecturer")` before protected work.
- The query/RPC and RLS enforce active Lecturer identity, slot ownership, and assignment; UI filtering is
  insufficient.
- Test signed-out, inactive, Student, Administrator, foreign-Lecturer, missing-ID, and forged-input cases.
- Student name/topic/rejection reason are untrusted stored text and must render as plain text; HTML, SQL,
  and prompt-like content must not execute or trigger a model call.
- Do not include email, questions, internal IDs, audit data, credentials, or raw errors in this projection
  unless a later approved change explicitly requires them.
- No AI gateway call, prompt, quota record, or provider data transfer is authorized for this dashboard.
- Log only safe operation metadata if logging exists; never log private consultation text.

## AI behavior

No AI is used or authorized. Dashboard reads must not call `generateText`, construct prompts, write
`ai_usage`, or allow model output to affect status, ordering, authorization, or displayed booking data.

## Edge cases and failure paths

| Condition | Required observable outcome | Invariant preserved |
| --- | --- | --- |
| Signed-out, inactive, or wrong-role user | Login/refusal with no dashboard data | Authorization |
| Foreign Lecturer booking or forged identifier | No row returned and no existence disclosure | Ownership/privacy |
| No bookings | Clear empty state | No false records |
| Rejected booking with reason | `Rejected: <reason>` as plain text | Status/history integrity |
| Rejected booking without reason | `Rejected` without invented text | Truthful display |
| Approved booking before start | `Confirmed` (or approved equivalent) | Trusted state |
| Approved booking during interval | `Ongoing` | Server-time lifecycle |
| Approved booking after end | `Completed` | Server-time lifecycle |
| Cancelled booking | `Cancelled` | History integrity |
| Database timeout/error | Safe unavailable/retry state | No partial mutation |
| Oversized result set | Bounded/paginated result or safe validation outcome | Resource limit |
| Markup or prompt-like stored text | Literal inert text | Output/injection safety |

## Acceptance criteria and verification

| ID | Requirement | Given / when / then outcome | Verification method | Mocked or live |
| --- | --- | --- | --- | --- |
| LEC-05-AC1 | R1 | Given two Lecturers with bookings, when Lecturer A loads the dashboard, then only Lecturer A's owned bookings appear. | database security + integration + E2E | live |
| LEC-05-AC2 | R1/R5 | Given a signed-out, inactive, Student, or Administrator session, when the dashboard is requested, then access is refused and no protected booking data is returned. | integration + E2E | live |
| LEC-05-AC3 | R2 | Given an owned booking, when the dashboard renders, then the block shows student name, topic, course/module code, Singapore-local slot time, and status. | component/integration + E2E | deterministic/live |
| LEC-05-AC4 | R3 | Given pending, approved-before-start, approved-during, approved-after-end, rejected, and cancelled records, when they render, then each displays the corresponding approved status label. | unit + component | deterministic |
| LEC-05-AC5 | R3 | Given a rejected booking with a reason containing markup, when it renders, then it shows `Rejected: <reason>` as inert text and does not execute markup. | component/browser security | deterministic |
| LEC-05-AC6 | R4 | Given bookings on multiple UTC dates around Singapore midnight, when the dashboard renders, then blocks are grouped and ordered by Singapore calendar date and start time. | unit/integration | deterministic |
| LEC-05-AC7 | R5 | Given a Lecturer loads and refreshes the dashboard, when the read completes, then no slot, booking, notification, audit, or AI-usage row is changed. | database + unit spy | live/deterministic |
| LEC-05-AC8 | R6 | Given zero bookings, when the dashboard loads, then an accessible empty state is shown; given a read failure, then a safe unavailable/retry state is shown. | component + E2E | deterministic/live |
| LEC-05-AC9 | R1/R2 | Given a foreign or missing booking identifier/filter, when the read is requested, then it returns a bounded safe result without private data or existence enumeration. | database security + integration | live |
| LEC-05-AC10 | R6 | Given a narrow viewport, keyboard navigation, and 200% zoom, when the Lecturer uses the dashboard, then all information remains readable and any controls remain operable. | E2E + manual | live/N/A |
| LEC-05-AC11 | R5/security | Given stored text resembling HTML, SQL, or model instructions, when it appears in a dashboard block, then it is rendered literally and no model/provider call occurs. | unit spy + browser security | deterministic |
| LEC-05-AC12 | R1/R6 | Given a result above the approved bound, when the dashboard is queried, then pagination/bounding prevents unbounded data transfer and the UI remains usable. | integration/performance | deterministic/live |

## Review evidence

- Challenge record: human decision round completed on 2026-10-20.
- Review type: independent repository inspection by the Requirements Analyst.
- Open findings and disposition: resolved by the decisions recorded above.
- Human approval: recorded from the Lecturer feature owner on 2026-10-20.

## Open questions blocking approval

None.

## Change log

| Date | Change and reason | IDs affected | Evidence invalidated | By |
| --- | --- | --- | --- | --- |
| 2026-10-20 | Initial repository-grounded draft for Lecturer dashboard request | LEC-05-R1–R6; AC1–AC12 | None | requirements_analyst |
