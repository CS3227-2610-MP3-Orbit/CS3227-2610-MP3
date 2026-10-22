# SPEC-READINESS-01: specification readiness review

- Role: `requirements_architect`
- Review date: 2026-10-17
- Repository version inspected: `87a8951` on `AI-workflow-initalization`
- Specifications inspected: `PRD-01`, `TEC-01`, `SHR-01`, `INT-01`, `PLN-01`, and `SH-01`
- Review outcome: changes and human decisions are required before any product feature is ready for implementation

## Executive conclusion

The five umbrella documents form a useful product and architecture outline, but they are not yet an
implementation-ready specification set. All six specifications are still `draft`; there are no
approved detailed feature specs under `student/`, `lecturer/`, or `admin/`; and several decisions
that change permissions, state transitions, schema, and validation remain open. Under `AGENTS.md`
and `PLN-01-AC1`, product feature implementation must not begin yet.

The repository itself is a foundation scaffold, not a booking system. Authentication, role routing,
basic RLS, dashboard shells, an AI gateway skeleton, CI, and deployment workflows exist. Courses,
lecturer assignments, slots, bookings, announcements, reports, and every role-specific AI feature
remain planned. Parts of the foundation are incomplete or differ from the drafts, especially AI
quota handling and deactivated-user data access.

The smallest useful next product slice is administrator publication of plain-text announcements and
student reading of published announcements. It exercises a real two-role path, a new database table,
RLS, server authorization, validation, and browser rendering without depending on the unresolved
booking model or the incomplete AI gateway. It is proposed, not authorized: publication semantics,
record categorization, visibility, edit ownership, ordering, and field bounds require human decisions
and a separately approved `ADM-03` detailed spec first.

## Evidence inspected

The review covered:

- all Markdown files under `workflow/specs/`;
- role instructions and workflow rules in `AGENTS.md`, `workflow/README.md`,
  `workflow/agents/README.md`, and the handoff template;
- all current application files under `src/`, including authentication, Supabase clients, role
  layouts, and the AI gateway;
- the initial migration, seed, and pgTAP tests under `supabase/`;
- current Vitest and Playwright tests;
- package scripts, CI/deployment workflows, CODEOWNERS, and current user/developer documentation.

No environment file, credential, external service, production system, or deployment was accessed.

## Implemented, partially implemented, and planned

### Implemented foundation

| Area                                    | Evidence                                                                       | Assessment                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Stack and project configuration         | `package.json`, Next.js/Vitest/Playwright configs                              | Next.js, React, TypeScript, Supabase, Zod, Vitest, Playwright, and pgTAP are configured.                                   |
| Login UI and password sign-in           | `src/app/login/*`                                                              | Form input is server-validated and authentication failures use one generic message.                                        |
| Role model and role destinations        | `src/lib/auth/roles.ts`                                                        | `student`, `lecturer`, and `admin` map to separate dashboard roots.                                                        |
| Active profile lookup and role guard    | `src/lib/auth/session.ts`                                                      | Server code resolves role from `profiles` and `requireRole` redirects absent/wrong-role users.                             |
| Protected role shells                   | `src/app/{student,lecturer,admin}/layout.tsx`, `src/components/role-shell.tsx` | Each current role workspace has a server-side role guard and sign-out UI. Dashboard contents are headings only.            |
| Session refresh and signed-out redirect | `src/proxy.ts`, `src/lib/supabase/proxy.ts`                                    | Auth claims are refreshed; signed-out requests outside paths starting with `/login` are redirected.                        |
| Initial data foundation                 | `20261017000000_initial_schema.sql`                                            | `profiles`, `ai_usage`, default-student trigger, helper function, indexes, and RLS are present.                            |
| Prompt-data wrapper                     | `src/lib/ai/untrusted.ts`                                                      | Source labels are constrained and angle brackets are escaped.                                                              |
| CI/deployment definitions               | `.github/workflows/*.yml`                                                      | App/database checks and branch-dependent deployments are defined, with a GitHub environment gate described for production. |

### Partially implemented or insufficiently verified

| Area                             | Concrete gap                                                                                                                                                                                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SH-01` overall                  | The spec is `draft` even though its code was started. Existing implementation therefore has no approved specification baseline.                                                                                                                                                                          |
| Signed-out routing (`SH-01-AC2`) | One Playwright test exists but was not executable in this checkout because dependencies are absent. The proxy treats every path beginning `/login` as public, broader than the exact `/login` wording.                                                                                                   |
| Role routing (`SH-01-AC3`)       | Unit tests cover the role-to-path map, not authenticated root routing, cross-role URL denial, or inactive-user behavior.                                                                                                                                                                                 |
| Deactivation                     | `getCurrentUser` rejects an inactive profile, but the `profiles: read own` RLS policy still allows an inactive authenticated user to read their own profile. That conflicts with `PRD-01`'s promise that deactivated users are denied data access.                                                       |
| Server Action authorization rule | Product actions are absent. Existing `signIn` cannot call `requireRole`, and `signOut` does not call it. The blanket wording “every Server Action calls `requireRole`” needs an explicit authentication-action exception or a different guard contract.                                                  |
| AI gateway (`SH-01-AC6/AC7`)     | Input length, output token count, and provider timeout are configured, but `decideQuota` throws unconditionally. A successful usage claim therefore makes `generateText` throw, contradicting its typed/no-exception contract. Four quota tests are `todo`.                                              |
| AI output and logging            | The gateway checks only non-empty output; it has no output character bound or feature identifier allow-list. Logging the raw SDK error object may conflict with the rule against logging private consultation content. Database/setup failures outside the provider `try` can also escape as exceptions. |
| RLS assurance                    | The pgTAP suite proves that RLS is enabled, not that policies implement each role boundary. It tests no inactive-user, cross-user, or direct-table attack.                                                                                                                                               |
| Traceability                     | `npm run check:spec` reports 41 criteria and only 5 covered. A textual criterion reference counts as coverage, so the checker does not establish that a test adequately proves a criterion.                                                                                                              |
| Documentation                    | `UserGuide.md` is headings only; major Developer Guide sections are placeholders. Documentation does not yet describe actual role workflows.                                                                                                                                                             |
| Runtime verification             | Unit tests and lint could not run because `vitest` and `eslint` are not installed in the checkout. Database and browser suites require local services and were not run.                                                                                                                                  |

### Planned only

The following have no application implementation or schema in the repository:

- courses and lecturer-course assignments;
- consultation slots, overlap prevention, and availability queries;
- bookings, reservation concurrency, state transitions, and role-specific booking views;
- announcements/guidelines;
- administrator account UI and reporting;
- all three role-specific AI features;
- production-ready quota enforcement and AI response validation;
- role feature documentation and populated local test fixtures.

## Completeness, consistency, and testability findings

### Blocking product and permission decisions

1. **Student identity and eligibility (high).** Account provisioning and whether course enrolment
   constrains booking are unresolved. These alter account flows, tables, RLS, and booking
   authorization.
2. **Time and cancellation semantics (high).** The display timezone and cancellation cutoff are
   unresolved. “Before start time” cannot be tested consistently until the timezone and boundary
   (`<` versus an advance-notice duration) are fixed.
3. **Request course source (high).** `PRD-01` says the student supplies a course, while `TEC-01` and
   `INT-01` derive it from the selected slot. The request must not be able to claim a course that
   differs from its slot; the UI and contract need one authoritative rule.
4. **Administrator self-management (high).** It is not decided whether an administrator can change
   their own role or deactivate themselves, or what prevents removal of the last active admin.
5. **Administrator booking visibility (high).** Administrators manage aggregate reports, but the
   specs do not explicitly state whether they may ever read individual private booking text for
   support or moderation. RLS cannot be finalized without this decision.
6. **Announcement permissions (high for the proposed slice).** It is unclear whether lecturers see
   published announcements, whether all admins may edit all drafts, whether author identity is
   editable, and whether unpublishing is permitted.

### Data model and state-contract gaps

7. **Field bounds (high).** Topic, questions, rejection reason, course fields, announcement fields,
   and AI output lack concrete bounds. Zod schemas, SQL checks, UI counters, and boundary tests cannot
   be made consistent without them.
8. **Announcement model (high for the proposed slice).** The product distinguishes “guidelines and
   announcements,” but `INT-01` defines one `announcements` entity with only a boolean publication
   state. Decide whether these are one kind of record, a categorized record, or separate concepts,
   and whether publication scheduling is needed.
9. **Optimistic concurrency (medium).** Booking transitions require expected status, but edits to
   announcements, slots, topics/questions, courses, and profiles do not define stale-write behavior
   or a version/`updated_at` condition.
10. **Audit timestamps and attribution (medium).** Logical entities say “timestamps” but do not state
    which transitions record `approved_at`, `rejected_at`, `cancelled_at`, `completed_at`, or the
    acting user. This affects reporting and incident review.
11. **Deletion and retention (medium).** Course archive behavior, account deletion, announcement
    deletion, and retention of completed bookings, AI usage, and logs are unresolved. Foreign-key
    behavior cannot be finalized safely.
12. **Availability definition (medium).** Specs say a slot is available when it has no active booking,
    but do not fully define whether inactive courses, inactive lecturers, or inactive students hide
    or invalidate existing future slots/bookings.
13. **Database enforcement design (medium).** Required invariants are named but the transaction/RPC,
    exclusion constraint, partial uniqueness, and policy interaction are intentionally deferred.
    Detailed shared specs must make these observable and testable before migrations are written.

### Acceptance-criterion quality gaps

14. **Umbrella criteria are too compound (high).** Examples such as `PRD-01-AC8`, `PRD-01-AC9`,
    `SHR-01-AC3`, and `SHR-01-AC6` combine several independent behaviors or environments. Detailed
    feature criteria should split them into one observable outcome per test boundary.
15. **Many stated behaviors have no criterion (high).** Slot filtering, pending-request editing,
    completion timing, account/course management, announcement publication/reading, accessibility,
    pagination, and most input validation lack direct acceptance criteria.
16. **Error observability is underspecified (medium).** The failure contract names result categories
    but not stable TypeScript shapes, UI messages, HTTP semantics (if Route Handlers are used), or
    which distinctions are intentionally collapsed to prevent enumeration.
17. **Security criteria need layer attribution (medium).** Criteria should say which guarantees are
    proven at Server Action, RLS/database, and browser-rendering layers. UI-only success cannot prove
    direct API or database denial.
18. **Concurrency criteria need a reproducible harness (medium).** “Simultaneous” is not enough;
    detailed specs should define the transaction operation and invariant to assert, without relying
    on timing-sensitive browser clicks.

### AI and non-functional ambiguities

19. **Quota values and counting semantics (high before AI work).** Limits are placeholders. The specs
    do not settle whether failed/empty calls consume quota, which clock is authoritative, or how
    retry-after values are calculated.
20. **Valid AI output is undefined (high before AI work).** “Invalid/malformed” and “bounded plain
    text” need a concrete character limit, accepted format, and behavior for truncation, refusal, or
    provider content filtering.
21. **Prompt-injection protection is stated too absolutely (medium).** Escaping tags is a useful
    instruction/data boundary, not a guarantee that the model will ignore malicious text. Database
    authorization and data minimization must remain the enforceable controls, with tests framed
    around constructed prompts and non-execution rather than model obedience.
22. **Operational targets (medium).** Accessibility level, supported browsers, expected scale,
    pagination limits, and performance thresholds remain open, so the related non-functional clauses
    are not objectively testable.

## Spec-to-code mismatches requiring explicit resolution

| Requirement                                                            | Current code                                                                                                 | Resolution needed                                                                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `SH-01-AC7`: AI failure is typed and does not throw                    | `decideQuota` always throws after a successful claim; setup/database errors occur outside the provider `try` | Complete and test the gateway under an approved foundation/AI spec before any AI feature.                  |
| `PRD-01`: deactivated users have no data access                        | Own-profile SELECT policy does not depend on `is_active`                                                     | Decide whether an inactive user may read their own minimal profile. Then align wording, policy, and tests. |
| `SH-01`: every Server Action uses `requireRole`                        | `signIn` and `signOut` do not                                                                                | Define explicit authentication-action rules; do not force `signIn` through a role guard.                   |
| `SHR-01`: output has a length bound and invalid responses are rejected | Gateway uses a token generation limit and only checks trimmed non-empty text                                 | Define and enforce a response character/format contract.                                                   |
| `SHR-01`: logs omit private descriptions                               | Gateway logs the raw provider error object                                                                   | Confirm SDK error redaction or log only an allow-listed error classification.                              |
| `SH-01-AC3`: signed-in users are routed to their own dashboard         | Tests only prove a pure role-to-path map                                                                     | Add authenticated browser/integration coverage, including cross-role direct navigation.                    |
| `PRD-01`: only `/login` is public                                      | Proxy uses `pathname.startsWith("/login")`                                                                   | Decide whether nested login routes are intended; otherwise match exact allowed paths.                      |

## Specification hierarchy recommendation

Human reviewers should define the hierarchy before approval:

1. root umbrella documents set product-wide intent and constraints;
2. approved detailed specs under role/shared folders are the implementation authority;
3. a detailed spec must reference its parent IDs and may clarify, but must not silently contradict,
   an umbrella requirement;
4. conflicts return to human review, and the change log records which document changed;
5. consider separating the auth/RLS foundation from the AI gateway so incomplete quota work does not
   make the entire foundation impossible to approve accurately.

## Proposed first vertical slice

Proceed, after the required human decisions and approvals, with:

> An authenticated administrator creates or edits a bounded plain-text announcement and controls
> whether it is published; an authenticated student can list published announcements, but cannot see
> drafts or mutate any announcement.

This is the smallest useful cross-role slice currently available because it:

- maps to planned work item `P11` and explicit `PRD-01`, `TEC-01`, and `INT-01` behavior;
- depends on existing authentication/profile infrastructure but not courses, bookings, or AI;
- validates the repository's intended UI → Server Action → PostgreSQL/RLS → second-role UI pattern;
- adds one table and one bounded workflow, with no admin-client requirement;
- produces user value while the higher-risk booking and AI decisions are resolved.

It deliberately excludes deletion, scheduling, targeting, rich text, AI generation, notifications,
and booking logic. The bounded plan is in
`workflow/plans/2026-10-17-first-vertical-slice.md`.

## Human decisions required before drafting `ADM-03`

1. Are guidelines and announcements the same uncategorized record, or is a required category needed?
2. Is publication a boolean only, or are start/end publication dates required?
3. Are published records visible only to students, or also to lecturers?
4. May every active administrator edit/unpublish every record, or only its author?
5. Are records deletable? The smallest slice recommends no deletion and does not assume it.
6. What are maximum title/body lengths, and is an empty title/body ever valid?
7. What deterministic ordering and page/list limit should the student view use?
8. Must stale admin edits be rejected using `updated_at`/version matching?
9. May an inactive author remain referenced, and are announcements retained indefinitely?
10. Will reviewers approve the relevant authentication/RLS foundation separately from the incomplete
    AI quota work, or must all of `SH-01` be completed first as `PLN-01` currently implies?
