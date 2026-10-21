---
layout: default
title: User Guide
description: How to access and use every current feature of Orbit, role by role.
---

# User Guide

Orbit is a consultation booking system. Students book consultation slots with their lecturers,
lecturers publish their availability and decide requests, and administrators manage accounts,
courses, guidelines/announcements and activity reports.

## Getting started

### Opening the app

| Environment | Address                                       | Purpose                            |
| ----------- | --------------------------------------------- | ---------------------------------- |
| Production  | <https://cs3227-2610-mp3.vercel.app>          | The released version               |
| Development | The latest deployment of the `develop` branch | Features under test before release |

Signed-out visitors can only see the sign-in page. Every other address sends you to `/login`.

> **TODO (team):** confirm the production URL and development deployment link are still current
> before publishing this guide, and add any test-account guidance the team wants peer testers to
> use beyond the local seed accounts documented in `DeveloperGuide.md`.

![Sign-in page](images/login.png)

### Accounts

There is no self-registration. An administrator creates every account and gives you a one-time
password (see [Administrator](#administrator)). Each account has exactly one role: **Student**,
**Lecturer** or **Administrator**.

### Signing in

1. Open the app and enter your **Email** and **Password**.
2. Select **Sign in**.
3. You arrive at the page for your role: `/student`, `/lecturer` or `/admin`.

If the email or password is wrong, the page shows **Incorrect email or password.** It does not say
which of the two was wrong. A deactivated account cannot sign in, and an account that is
deactivated while signed in is signed out on its next request.

To sign out, select **Sign out**.

### Changing your password

Every signed-in user can change their own password. You should do this after your first sign-in,
because the administrator saw your one-time password.

1. Select **Change password** in the navigation.
2. Enter your **Current password**, a **New password** and **Confirm new password**.
3. Select **Change password**.

Rules:

- The new password must be 12–72 bytes long and different from your current password. Most
  characters count as one byte; some accented and non-Latin characters count as two or more.
- If the current password is wrong, the page shows **Current password is incorrect.** and you
  re-enter all three fields.
- After **5 wrong current passwords within 15 minutes**, further attempts are refused with **Too
  many attempts. Try again in N minutes.** This applies even if the next attempt is correct.

When the change succeeds, the page shows **Password changed**. You stay signed in on this device,
and your other devices are signed out. They may keep working for up to an hour until their current
sign-in expires (see [Known limitations](#known-limitations)).

## Student

The student dashboard (`/student`) greets you by name, shows a count of your upcoming or active
bookings, two quick-action links (**Browse consultation slots**, **My bookings**), and a
**Guidelines and announcements** card (see [Reading guidelines and announcements](#reading-guidelines-and-announcements)).

![Student dashboard](images/student-dashboard.png)

### Browsing and filtering available slots

**Available slots** (`/student/slots`) lists every open consultation slot — one with no student
already holding a pending or approved booking on it, on an active course with a current (active)
lecturer assignment. Times are shown in Singapore Time (SGT).

- Filter by **Course**, **Lecturer** and/or **Date in Singapore**, then select **Apply filters**.
- **Clear filters** returns to the unfiltered list.
- Each result shows the course, lecturer, start/end time and a slot reference, with a **Request
  consultation** link.
- Results are paginated; select **Load more** to fetch the next page.
- If nothing matches, the page shows **No available slots match these filters.** with a link to
  clear filters.
- Availability is re-checked when you open a slot's request page and again when you submit, so a
  slot can still turn out to be taken by someone else in the meantime.

![Available consultation slots](images/student-slots.png)

### Requesting a consultation

Selecting **Request consultation** opens `/student/slots/[slotId]/request`, which shows the
selected slot's course, lecturer and start/end time, and a form:

1. Enter a **Consultation topic** (1–200 characters after trimming) and **Questions** (1–2,000
   characters after trimming). Both are required.
2. Optionally select **Improve my request** to get an AI-generated proposal first (see
   [AI: Improve my request](#ai-improve-my-request)).
3. Select **Submit request**.

The slot is reserved only once the request is submitted successfully. On success the page shows
**Request submitted — pending lecturer approval**, the booking's status badge, and a booking
reference, with a link back to **Browse available slots**. Submission is safe to retry: if the
result could not be confirmed, the page shows **Retry same request**, which recovers the original
attempt instead of creating a duplicate booking.

If the slot was taken or changed in the meantime, the form shows a message (e.g. "This slot is no
longer available. Your draft is preserved; choose another slot." or "The slot details have
changed. Refresh and review them before submitting again.") without losing what you typed.

![Request a consultation, with the AI "Improve my request" panel](images/student-request-form.png)

### Viewing, editing and cancelling bookings

**My bookings** (`/student/bookings`) lists every consultation you have requested, with its
course, lecturer, start time, status badge and topic, and a **View booking** link to its detail
page. If you have none yet, the page shows **You have no consultation bookings yet.** with a link
to browse slots.

![My bookings, showing each status](images/student-bookings.png)

On a booking's detail page (`/student/bookings/[bookingId]`) you can see its full course, lecturer,
start/end time, status, topic, questions and, if rejected, the lecturer's **Rejection reason**.

- **Edit booking** appears only while the booking's status is **pending**. It opens an inline form
  for **Topic** and **Questions**; select **Save changes** to submit the edit or **Cancel edit** to
  discard it.
- **Cancel booking** appears while the status is **pending** or **approved**, with the note
  "Cancellation cannot be undone and is available only before the scheduled start." The server
  refuses a cancellation once the slot has started.
- If the booking changed in the background (for example the lecturer just decided it), the page
  shows **This booking changed. Refresh to see its current status.** Edits/cancels are also
  retried automatically if the result could not be confirmed, so you are told to retry the same
  action to recover it rather than risking a duplicate change.

### AI: Improve my request

On the request-consultation form, selecting **Improve my request** sends only your current topic
and questions to the AI gateway and returns an editable proposal — it never submits or saves
anything by itself:

- The proposal has its own **Generated topic** and **Generated questions** fields (which you can
  edit) and a plain-text **Suggestions** list.
- **Apply to request** copies the proposal's topic/questions into the ordinary form fields; if you
  changed the form after generating, you are first asked to confirm ("Replace your current
  draft?") before anything is overwritten.
- **Dismiss** discards the proposal only, with no AI call.
- Once a proposal exists, the button becomes **Generate again**; after you apply one, it becomes
  **Generate another suggestion**. Only a fresh **Improve my request**/**Generate again** click
  uses an AI request — Apply and Dismiss never do.
- If the daily AI limit has been reached, the page shows "AI request limit reached. You can still
  write and submit your consultation request manually." and the rest of the form stays usable.

### Reading guidelines and announcements

Every dashboard includes a **Guidelines and announcements** card showing every published
guideline and the 5 most recent published announcements (both newest-first), each with its title
and body text (line breaks preserved, never interpreted as HTML or Markdown). If nothing is
published yet, the card shows **No guidelines or announcements yet.**

## Lecturer

The lecturer dashboard (`/lecturer`) is a single page with your slot count, pending-request count,
a slot-creation form, your slot list, the shared **Guidelines and announcements** card, your saved
AI briefings, your active/past consultations, and incoming consultation requests.

![Lecturer dashboard](images/lecturer-dashboard.png)

### Creating consultation slots

In **Create consultation slot**, choose a **Course** you are assigned to, a **Date**, **Start
time** and **End time**, then select **Create slot**. Rules enforced on save:

- The slot must start **at least one hour from now**; otherwise: "Slots must be created at least
  one hour before they start."
- The end time must be after the start time, in Singapore time.
- You can only create a slot for a course you are currently assigned to: "You can only use courses
  assigned to you."
- The new slot must not overlap any of your existing slots: "This slot overlaps one of your
  existing slots."

On success the page shows **Consultation slot created.** and the slot appears in **Your
consultation slots**, which otherwise shows **No consultation slots yet.**

### Deleting a slot

Select **Delete** next to a slot in **Your consultation slots** to remove it. If the slot still
has a pending or approved booking, deletion is refused with "This slot has active bookings.
Confirm deletion to notify students." — the current dashboard has no way to confirm that
notification, so in practice a slot with an active booking cannot be deleted from the UI; cancel
or resolve the booking first. A slot with no pending/approved booking deletes immediately.

> Editing an existing slot's course/date/time is implemented on the server but is **not currently
> exposed** anywhere in the lecturer dashboard UI — there is no "Edit" control for a slot. Only
> **Create** and **Delete** are reachable today.

### Approving or rejecting requests

**Consultation requests** lists every pending request for your slots, each with course, start
time, topic and questions. For each request:

- Choose a **Rejection reason** from the dropdown (**Lecturer unavailable**, **Family or medical
  reasons**, or **Other scheduling reason**) — used only if you reject.
- Select **Approve** or **Reject**.

On success the page shows "Request approved." or "Request rejected.", plus whether the student was
notified immediately or the notification will be retried. If the request was already decided or
changed since the page loaded, you see "This request was already decided or is no longer
available. Refresh and try again." If there are no pending requests, the page shows **No pending
consultation requests.**

### Upcoming, ongoing, completed and past consultations

**Lecturer consultations** is split into **Active consultations** (not yet finished — including
upcoming and ongoing approved consultations) and **Past consultations** (rejected, cancelled, or
completed). An **approved** consultation automatically displays as **completed** once its slot's
end time has passed — the system derives this on each view; the stored booking status itself stays
`approved`. Each entry shows the course, topic, time range, student name and email, and the
student's questions, with its status shown as a badge (a rejected entry also shows the rejection
reason).

### AI: consultation briefing

For each **upcoming** consultation in **Active consultations**, a **Generate AI briefing** button
appears. Selecting it (shows **Generating briefing…** while in progress) asks the AI gateway for a
plain-text briefing containing a **Summary**, **Grouped question themes** and **Preparation
topics**, built only from that one consultation's course, topic and questions (the student's name
is included; the student's email is excluded from what is sent to the model). Every generated
briefing is saved and shown under **Saved AI briefings** on the dashboard with its save time; the
dashboard displays only the 10 most recent, though every briefing is retained in the database.
Typical failure messages include "Only upcoming approved consultations can be briefed.", "Your
briefing quota has been reached. Please try again later." and "The briefing service is temporarily
unavailable." — ordinary dashboard features keep working regardless.

### Announcements card

Like the Student dashboard, the Lecturer dashboard shows the same read-only **Guidelines and
announcements** card described in [Reading guidelines and announcements](#reading-guidelines-and-announcements).

## Administrator

The administrator dashboard (`/admin`) greets you by name and shows three stat tiles (**Active
accounts**, **Active courses**, **Pending consultation requests**), three quick-action links
(**Manage accounts**, **Manage courses**, **View reports**), and the full list of pending
consultation requests with **Approve**/**Reject** controls (the same control lecturers use — an
administrator can decide any pending request, not only their own).

![Administrator dashboard](images/admin-dashboard.png)

### Finding accounts

**Manage accounts** (`/admin/accounts`) lists every account with its name, email, role and status
(**Active** or **Deactivated**).

- **Search** by part of an email address or name.
- Filter by **Role** (All roles, Student, Lecturer, Administrator) and **Status** (All statuses,
  Active, Deactivated), then select **Search**.
- **Clear filters** shows every account again.

If nothing matches, the page shows **No accounts match these filters.**

![Administrator accounts](images/admin-accounts.png)

### Creating an account

1. Select **New account** to open the **Create account** dialog, then enter the **Email**, **Full
   name** and **Role**.
2. Select **Create account**.
3. The dialog shows a **One-time password (copy it now — it cannot be shown again)**. Select
   **Copy**, give the password to the new user through a private channel, then select **Done**.

After **Done**, or if you leave the page, the password cannot be shown again. If it is lost, reset
the password (below). The email must not already be in use; otherwise the page shows **An account
with that email already exists.**

### Changing a role

Choose the new role for the account and select **Change role**. The page shows **Role updated.**
Administrators can make other users administrators.

### Deactivating and reactivating an account

Select **Deactivate** to block an account immediately: the user is signed out on their next request
and cannot sign in. Select **Activate** to restore it. The account and its history are kept.

### Resetting a password

Select **Reset password** for a user who has forgotten their password or whose account may be
compromised. A new one-time password appears with **Copy** and **Done**, as when creating an
account. The user's existing sessions are ended.

For a suspected compromise, **deactivate the account first** (immediate), then reset the password,
then reactivate it.

### Rules that protect the system

| You try to…                                                          | Result                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Change your own role, deactivate yourself or reset your own password | No controls are shown on your own account; use **Change password**    |
| Demote or deactivate the last active administrator                   | **That change would leave no active administrators and was refused.** |
| Change, deactivate or reset the **Protected** administrator          | No controls are shown for it                                          |

The **protected recovery administrator** is the first administrator account in each environment.
Nobody can demote, deactivate or reset it from the app, so the system always has one administrator
account to recover from. Its owner can still change its password with **Change password**.

### Courses and lecturer assignments

**Courses** (`/admin/courses`) manages the course catalogue and which lecturers currently teach
each course.

- **Search** by code or name, filter by **Status** (All statuses, Active, Deactivated), then select
  **Search**; **Clear filters** resets it.
- Select **New course** to open a dialog with **Code** (2–20 characters: letters, numbers, `/`,
  `-` or `_`, unique across every course whether active or deactivated) and **Name** (1–200
  characters), then select **Create course**. A duplicate code shows "A course with that code
  already exists (active or deactivated)."
- Each course row shows its code, name, an **Active**/**Deactivated** badge, and its currently
  assigned lecturer(s) with a per-lecturer **Remove** button, an **Assign lecturer** dropdown
  (only active lecturer accounts appear, and it reads "No eligible lecturers" once every eligible
  lecturer is already assigned) with an **Assign** button, an **Edit** control for the code/name,
  and a **Deactivate**/**Reactivate** toggle.
- Deactivating a course keeps the course, its assignments, slots and bookings unchanged, but its
  unbooked future slots stop appearing to students browsing available slots; reactivating restores
  that visibility. Removing a lecturer's assignment similarly preserves every existing booking and
  only stops new slots being created for that pairing; re-assigning the same lecturer later creates
  a new, separate assignment record rather than reviving the old one.
- Assigning a lecturer is refused for an inactive course, a deactivated account, or an account that
  is not a lecturer; assigning the same active pairing twice is refused as a duplicate.

![Administrator courses](images/admin-courses.png)

### Guidelines and announcements

**Announcements** (`/admin/announcements`) manages standing **guidelines** and time-bound
**announcements** shown to every active user (see
[Reading guidelines and announcements](#reading-guidelines-and-announcements)).

- Select **New announcement** to open **Create guideline or announcement**: choose **Kind**
  (**Guideline** or **Announcement**), enter a **Title** (1–120 characters) and **Body** (1–2,000
  characters), then select **Create**. A new item is always created as a **Draft** — it is never
  visible to anyone else until you publish it.
- The list shows every item, published and draft, with its kind, a **Published**/**Draft** badge, a
  truncated body preview, an **Edit** button (opens a dialog pre-filled with the current kind,
  title and body) and a **Publish**/**Unpublish** toggle.
- There is **no delete**. Unpublishing immediately hides an item from every reader but keeps the
  row and its history; you can publish it again at any time.
- Title and body are always shown as plain text with line breaks preserved — never interpreted as
  HTML, scripts or Markdown, even if someone enters markup.
- If nothing has been created yet, the page shows **No guidelines or announcements yet.** with a
  **Create one** link that opens the same dialog.

![Administrator announcements, with published items and a draft](images/admin-announcements.png)
![Create guideline or announcement dialog](images/admin-new-announcement-dialog.png)

### Reports and AI activity summary

**Reports** (`/admin/reports`) shows booking activity for a chosen period — never any student's
name, topic, questions or rejection reason, only counts and catalogue labels.

- Choose a **Period**: **Last 7 days**, **Last 30 days**, or **Custom range** with explicit **Start
  date**/**End date**, then select **Apply**. A custom range must have an end date on or after the
  start date and span at most 92 days, or the page shows "Please choose an end date on or after the
  start date, within a 92-day span." before any query runs.
- The report shows **Total bookings**, and tables **By status** (Pending, Approved, Rejected,
  Cancelled, Completed — all five always shown, zero-filled), **By course** and **By lecturer**
  (only rows with at least one booking), and **By day** (every day in the range, zero-filled).
- An **approved** booking whose slot has already ended is counted as **Completed** in the report
  (matching what lecturers see on their dashboard), not as **Approved**; its stored status is
  unaffected.

![Administrator reports](images/admin-reports.png)

Selecting **Summarise this period** asks the AI gateway for a short, plain-text **AI-generated —
advisory** summary (at most 1,200 characters, truncated at a word boundary if needed) comparing the
shown period to the immediately preceding period of equal length. The summary is built only from
the same aggregate counts and course/lecturer labels shown in the report — never from any
individual booking, student, topic or question — and is never saved: each click regenerates it.
If the AI service has no key configured locally, or any other AI failure occurs, the panel shows a
message such as "AI summary unavailable: the AI service is not configured." and the report itself
is unaffected.

![AI activity summary showing the "not configured" failure state](images/admin-reports-ai-summary.png)

## AI features

Orbit has one AI feature per role, all going through the same server-side gateway:

| Role          | Feature                             | What it does                                                                                |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| Student       | **Improve my request**              | Suggests a clearer topic/questions and optional suggestions for an unsaved draft request    |
| Lecturer      | **Generate AI briefing**            | Summarises one approved consultation into a summary, question themes and preparation topics |
| Administrator | **Summarise this period** (Reports) | Summarises the report's aggregate counts, comparing the period shown to the one before it   |

Shared behaviour:

- **Shared daily limit.** All three features draw on one shared capacity of **100 successful AI
  responses per Singapore calendar day across the whole app** (the limit resets at midnight
  Singapore time, not 24 hours after your request). A request that is refused, fails, or times out
  does not use up any of that capacity.
- **One request at a time per user.** Only one of your AI requests can be in flight at once; a
  second click while one is still running is refused with an "already in progress"/"already being
  improved" message rather than starting a second call.
- **Untrusted data stays data.** Anything a student or course record contributes (topics,
  questions, course/lecturer names) is clearly wrapped as data before it reaches the model, with
  fixed instructions telling the model never to treat that content as instructions. The model
  output itself is always rendered as plain text, never as HTML or Markdown, so it cannot inject
  scripts or formatting.
- **AI never changes data.** None of the three features can approve, reject, create, edit, cancel,
  complete, publish or delete anything; they only read data and return advisory text for a human to
  review.
- **Failures never block ordinary features.** If the AI service is not configured, times out, is
  rate-limited, or the shared daily limit is reached, every feature shows a plain, friendly message
  (e.g. "AI summary unavailable: the shared daily AI limit has been reached. Please try again
  later.") and booking, slot, account, course and announcement features keep working normally.

## Known limitations

- After a password change or reset, other devices can stay signed in for up to one hour, until
  their current sign-in expires. They cannot renew it. To lock someone out immediately, an
  administrator deactivates the account.
- Public sign-up through the Supabase API is still enabled; the app itself offers no sign-up page.
- The administrator dashboard currently shows the text of pending consultation requests; a privacy
  review of this is planned.
- Editing an existing lecturer slot is implemented on the server but has no control in the current
  lecturer dashboard UI (see [Creating consultation slots](#creating-consultation-slots)).
