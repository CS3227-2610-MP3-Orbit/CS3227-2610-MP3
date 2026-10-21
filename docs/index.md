---
layout: default
title: Orbit
description: Consultations, organised around you.
---

Orbit is a consultation booking app for a university course: students book consultation slots
with their lecturers, lecturers publish availability and decide requests, and administrators run
the course catalogue, accounts, guidelines/announcements and activity reporting — with one AI
feature built for each role, on top of a Next.js + Supabase stack with separate development and
production environments.

[Read the User Guide](UserGuide.md){: .btn } [Read the Developer Guide](DeveloperGuide.md){: .btn } [View the repository](https://github.com/CS3227-2610-MP3-Orbit/CS3227-2610-MP3){: .btn }

![Orbit sign-in page](images/login.png)

## Three roles, one app

### Student

Browse and filter open consultation slots by course, lecturer and date; submit a request with a
topic and questions; edit or cancel a request while it is still pending; track every booking's
status (including a lecturer's rejection reason); and read the institution's published guidelines
and announcements from the dashboard.

![Student dashboard](images/student-dashboard.png)

### Lecturer

Publish consultation slots (at least an hour ahead, never overlapping an existing one); approve or
reject incoming requests with a reason; see upcoming, ongoing and automatically-completed
consultations; and generate an AI briefing before meeting a student.

![Lecturer dashboard](images/lecturer-dashboard.png)

### Administrator

Manage every account and its role, the course catalogue and lecturer assignments, publish
guidelines and announcements, and review booking activity reports with an AI-generated summary —
all without ever exposing a student's private booking content.

![Administrator dashboard](images/admin-dashboard.png)

## One AI feature per role

| Role          | Feature                   | What it does                                                                         |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| Student       | **Improve my request**    | Suggests a clearer, editable topic/questions proposal for an unsaved draft request   |
| Lecturer      | **Generate AI briefing**  | Summarises one approved consultation into a summary, question themes and prep topics |
| Administrator | **Summarise this period** | Turns a report's aggregate booking counts into a short plain-text activity summary   |

All three go through one shared server-side gateway and one shared daily budget — **100 successful
AI responses per Singapore calendar day across the whole app** — with at most one in-flight request
per user. Every failure (not configured, rate-limited, over quota, timed out) degrades to a plain
message; booking, slot, account, course and announcement features never stop working because AI is
unavailable. See [AI features](UserGuide.md#ai-features) in the User Guide and
[AI features and the SoC LLM gateway](DeveloperGuide.md#ai-features-and-the-soc-llm-gateway) in the
Developer Guide for the full detail.

![AI activity summary, shown here in its "not configured" failure state](images/admin-reports-ai-summary.png)

## Security highlights

- **Untrusted data stays data.** Everything a student or course record contributes to a prompt —
  topics, questions, course/lecturer names — is wrapped and labelled before it reaches the model,
  with fixed instructions that it can never be treated as an instruction.
- **AI output is always plain text**, never HTML or Markdown, so a model echoing back a `<script>`
  tag can never execute it; AI can never approve, reject, create, edit or delete anything.
- **Three independent layers enforce every permission boundary**: a page/layout check, a repeated
  Server Action check, and row-level security plus `security definer` database functions that
  re-verify the caller's role themselves — so a direct database call cannot bypass authorization
  even if the layers above it were skipped.
- **Dev/prod separation.** Local, development (`develop` branch) and production (`master` branch)
  each have their own Supabase project and Vercel environment; production deploys require a human
  reviewer's approval.

See the [Security](DeveloperGuide.md#security) section of the Developer Guide for the full model.

## Built with spec-driven, multi-agent development

Every feature starts as an approved specification under `workflow/specs/`, implemented and
independently reviewed by separate agent roles (requirements, development, testing/security)
before a human merges it — see [Spec-driven development](DeveloperGuide.md#spec-driven-development)
and [Specialised agents and the `workflow/` folder](DeveloperGuide.md#specialised-agents-and-the-workflow-folder).
The team's reflections on what that process taught us are in [Reflections](Reflections.md).

## More screens

<div markdown="1">

|                                                                                                    |                                                                             |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| ![Request a consultation, with the AI "Improve my request" panel](images/student-request-form.png) | ![Administrator courses and lecturer assignments](images/admin-courses.png) |
| ![Administrator reports](images/admin-reports.png)                                                 | ![Administrator announcements](images/admin-announcements.png)              |

</div>

## Learn more

- [User Guide](UserGuide.md) — every current feature, and how to access and test the app.
- [Developer Guide](DeveloperGuide.md) — architecture, data model, AI gateway, security, testing
  and the development process.
- [Reflections](Reflections.md) — what the team learned building Orbit.
- [GitHub repository](https://github.com/CS3227-2610-MP3-Orbit/CS3227-2610-MP3)
