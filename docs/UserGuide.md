# User Guide

## Getting started

Start the application with the project’s normal development command and sign in with an account
that has the required role. The available pages and actions depend on the authenticated user’s
permissions. Do not use real student data in local testing.

## Student

Students can view available consultation slots and submit consultation requests with a topic and
questions. Their requests show a user-facing status. A rejected request includes the rejection
reason alongside the status, for example `Rejected: schedule unavailable`.

## Lecturer

Lecturers can:

- create, view, edit, and delete their own consultation slots;
- review consultation requests for their slots and approve or reject them;
- provide a rejection reason from the available reasons;
- view upcoming, ongoing, and completed consultations; and
- generate an AI briefing for a selected upcoming approved consultation.

The AI briefing contains a summary, grouped question themes, and preparation topics. It uses the
student’s name, topic, and questions where required by the feature, but excludes email from the
model prompt. Generated briefings are retained in the database, while the user interface displays
only the latest ten. A briefing may fail when the consultation is not eligible, the user lacks
access, the quota is exhausted, or the AI provider is unavailable.

## Administrator

Administrator capabilities are documented and controlled separately from the Lecturer workflow.
They may include oversight of consultation records, but users must not assume that an administrator
action is available unless it is enabled by the deployed application and access policy.

## AI features

AI output is generated from application data and should be reviewed by the lecturer before use.
Student topics and questions are treated as content, not instructions to the AI system. Do not
enter secrets or unrelated personal information into consultation fields.

## Known limitations

- Local development requires correctly configured, uncommitted environment variables.
- AI output depends on the SoC LLM gateway and its quota/rate limits.
- Briefings are retained in the database, but only the latest ten are shown in the lecturer UI.
- User-facing behaviour may differ until the relevant feature branch has passed CI and been merged.
