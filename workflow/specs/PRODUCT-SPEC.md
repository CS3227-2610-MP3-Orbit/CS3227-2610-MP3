---
id: PRD-01
title: Consultation Booking System product specification
owner: team
status: draft
---

# PRD-01: Consultation Booking System product specification

## Purpose

The Consultation Booking System lets students request available consultation slots, lets lecturers
decide and prepare for those requests, and lets administrators manage the people and reference data
that support the process. Each role has a separate workspace and one optional SoC LLM feature. The
ordinary booking workflow must remain usable when the AI service is unavailable.

## Users and goals

| Role | Primary goals |
| --- | --- |
| Student | Find a suitable slot, submit a useful request, and track or cancel personal bookings |
| Lecturer | Publish availability, decide requests, prepare for upcoming sessions, and record completion |
| Administrator | Manage accounts, courses, assignments, announcements, and aggregate activity |

## Main workflow

1. A lecturer publishes a non-overlapping future consultation slot for one course.
2. A student selects an available slot and submits a topic and questions.
3. The pending request immediately reserves the slot.
4. The assigned lecturer approves or rejects the request. A rejection includes a reason and releases
   the slot.
5. Either the student may cancel before the slot starts, which releases the slot.
6. After an approved consultation ends, the lecturer may mark it completed.

Booking statuses are `pending`, `approved`, `rejected`, `cancelled`, and `completed`.

## Student experience

### Browse and request

- View future available slots and filter them by lecturer, course, or calendar date.
- Select one slot and submit a required course, topic, and set of questions.
- See a clear success or conflict message after submission.

### Manage personal bookings

- View only the signed-in student's bookings and their current statuses.
- Edit the topic and questions while a request is pending. Changing the lecturer, course, or slot
  requires cancelling and submitting a new request.
- Cancel a pending or approved booking before its start time.
- Read current administrator-published consultation guidelines and announcements.

### AI: Improve my request

- Send a draft topic and questions to the SoC LLM and receive a clearer draft plus suggestions for
  missing information.
- The student reviews and may edit the result; AI output is never submitted as a booking
  automatically.
- The AI must not invent identity, course enrolment, deadlines, personal circumstances, or facts not
  present in the supplied draft.

## Lecturer experience

### Availability and decisions

- Create a future slot for a course assigned to the lecturer, with a start and end time.
- Edit or delete a slot only while it has no pending or approved booking.
- View only requests for slots owned by the signed-in lecturer.
- Approve a pending request or reject it with a required reason.
- View upcoming approved consultations and their student-supplied topics and questions.
- Mark an approved consultation completed only after its end time.

### AI: Prepare my consultation briefing

- Request a summary of the signed-in lecturer's upcoming approved consultations for a selected date.
- The briefing groups similar questions and highlights topics to prepare.
- The backend, not the model, selects the bookings. It supplies no bookings belonging to another
  lecturer.

## Administrator experience

### Administration and reporting

- Create lecturer accounts and activate or deactivate accounts.
- Assign supported roles without allowing a user to assign their own role.
- Create and edit courses and assign lecturers to them.
- Publish and edit guidelines and announcements.
- View aggregate booking counts grouped by course, lecturer, date, and status.

### AI: Generate an activity summary

- Request a readable summary for a selected reporting period using aggregate counts calculated by
  the backend.
- The model receives no student names, contact details, topics, questions, or other private booking
  descriptions.
- The summary is advisory text and does not modify accounts, courses, bookings, or announcements.

## Permissions and privacy

- Signed-out visitors may access only the login page.
- Every page, Server Action, and Route Handler enforces the role on the server.
- Students may read and change only their own permitted booking data.
- Lecturers may read and decide only requests for their own slots.
- Administrators may manage accounts, courses, assignments, announcements, and aggregate reports,
  but their normal reporting interface does not expose private consultation descriptions.
- PostgreSQL row-level security must enforce the same boundaries as the application.
- Deactivated users are denied application and data access even if an old session still exists.

## Failure behaviour

- Invalid, missing, oversized, or past-time input is rejected without changing data.
- A simultaneous request for an already-reserved slot returns a conflict; it never creates a second
  active booking.
- Overlapping slots for one lecturer and overlapping active bookings for one student are rejected.
- Stale updates, such as approving a request that was just cancelled, are rejected and the latest
  status is shown.
- AI timeout, quota, rate-limit, malformed output, or service failure produces a clear retry/fallback
  message and does not block non-AI features.

## Acceptance criteria

- **PRD-01-AC1** Given a signed-in student and a future available slot, when the student submits a
  valid topic and questions, then exactly one pending booking is created for that student and the
  slot no longer appears available.
- **PRD-01-AC2** Given two students attempting to request the same available slot concurrently, when
  both requests finish, then exactly one pending booking exists and the other request receives a
  conflict response.
- **PRD-01-AC3** Given a student, when they list or address bookings, then they can access only their
  own bookings and a request for another student's booking is refused without revealing its content.
- **PRD-01-AC4** Given a lecturer, when they review requests, then they can access and decide only
  bookings attached to their own slots.
- **PRD-01-AC5** Given a pending request, when its lecturer rejects it without a non-blank reason,
  then the update is refused; with a reason, its status becomes rejected and its slot becomes
  available.
- **PRD-01-AC6** Given a pending or approved future booking, when its student cancels it before the
  start time, then its status becomes cancelled and its slot becomes available.
- **PRD-01-AC7** Given an administrator report, when an activity summary is generated, then the model
  input contains aggregate counts and contains no student identity, topic, or question text.
- **PRD-01-AC8** Given any role-specific AI output, when it is displayed, then it is escaped as plain
  text, requires human review before any later submission, and cannot directly change persistent
  data.
- **PRD-01-AC9** Given the SoC LLM is unavailable, when a user invokes an AI feature, then that feature
  shows a handled failure while login, browsing, booking, and administration remain usable.
- **PRD-01-AC10** Given a signed-in user, when they directly invoke a page or action owned by another
  role, then the server refuses or redirects the request and performs no mutation.

## Out of scope

- Video calling, chat, calendar synchronization, email/SMS notifications, recurring slots, group
  consultations, attendance tracking, and automated academic advice.
- Letting an LLM approve, reject, cancel, complete, or otherwise mutate a booking.
- Using consultation text to evaluate students or lecturers.

## Open questions

- Are student accounts self-registered, provisioned by administrators, or imported from another
  system?
- May any student book any course, or must course enrolment be modelled and enforced?
- Should cancellation be allowed until the exact start time, or should there be a configurable
  notice period?
- What maximum lengths should apply to topics, questions, rejection reasons, and announcements?
- What period counts as “upcoming” for the lecturer briefing, and which timezone is authoritative?

## Change log

| Date | Change | By |
| --- | --- | --- |
| 2026-10-17 | First draft from the proposed feature set | analyst |
