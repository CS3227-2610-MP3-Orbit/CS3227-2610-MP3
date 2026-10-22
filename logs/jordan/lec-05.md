# LEC-05 — Lecturer consultation dashboard

## Specification status

- The current repository marks `LEC-05-lecturer-dashboard.md` as `draft`.
- Recorded decisions include: bookings only; next 100 future consultations; rejected/cancelled records
  in separate history; Singapore time; course code and course name; read-only dashboard behavior; and no
  Administrator dashboard access.
- “No open questions” in the document does not change its front-matter status from `draft`.

## Development context

- Dashboard behavior was developed across the Lecturer completion/dashboard work and later UI merges.
- The active consultation list shows course, student, topic, questions, slot times, and derived status.
- The AI briefing button is shown for upcoming consultations and uses the consultation booking ID.

## Verification boundary

- The branch and current source support the described dashboard flow, but the spec remains draft and should
  not be represented as formally approved.
- Narrow viewport/accessibility and complete live dashboard acceptance coverage were not independently
  established by the available conversation evidence.

Generated summary verified against the current LEC-05 document and source behavior.
