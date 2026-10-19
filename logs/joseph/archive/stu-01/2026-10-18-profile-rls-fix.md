# Student profile RLS fix

- Date: 2026-10-18
- Task: `TASK-STU-01-PROFILE-RLS-FIX`
- Requirements: `SH-01-AC8`, `STU-01-AC21`, `SH-03-AC19`
- Requested by: Joseph in the project Codex conversation
- Outcome: local patch complete; sensitive human review is required before merge or database use.

## Changes

- Added `supabase/migrations/20261018010000_restrict_student_profile_access.sql`.
  - Drops the pre-existing broad `profiles: active users read staff` policy.
  - Preserves the existing own-profile and Administrator policies.
  - Does not grant a new role or apply the migration to a persistent database.
- Updated `supabase/tests/student_browse_available_slots.test.sql`.
  - Replaced the grant-only `has_column_privilege` assertion with behavioral Student row-visibility
    checks.
  - Proves own-profile access remains available and other staff/audit rows are unavailable.
  - Scoped the rejected/cancelled-history fixture assertion to its own course so pre-existing demo data
    cannot displace the fixtures from the first result page.

## Evidence

| Check                                                        | Result           | Evidence                                                     |
| ------------------------------------------------------------ | ---------------- | ------------------------------------------------------------ |
| Transactional new migration plus pgTAP, followed by rollback | passed           | 22/22 assertions passed; database state was rolled back.     |
| `npm test`                                                   | passed           | 26 passed, 4 todo, one skipped file.                         |
| `npm run lint`                                               | passed           | ESLint exited successfully.                                  |
| `npm run typecheck`                                          | passed           | Next type generation and TypeScript passed.                  |
| `npm run check:spec`                                         | passed           | 16 specs, 150 criteria, 53 covered; draft gaps are warnings. |
| `npm run check:secrets`                                      | passed           | No reported secret finding.                                  |
| `npm run check:sensitive`                                    | passed with gate | Both migration files require human sensitive-change review.  |
| `git diff --check`                                           | passed           | No whitespace errors.                                        |

## Limitations

- The new migration was not applied persistently, pushed, merged, or deployed.
- Ordinary `npm run test:db` was not used for final evidence because the persistent local database does
  not contain the new uncommitted migration; verification instead applied it inside a transaction and
  rolled the transaction back.
- The affected canonical specifications are currently draft after the broader requirement-boundary
  revision. Joseph explicitly requested this narrow security repair, but exact-digest teammate review
  and sensitive migration review remain required before merge.

## File digests

- Migration: `acacacbd0a704b330030d9bc901886abd0496cf686fea3fdc126328170aa8aec`
- pgTAP test: `40b4afeeef71b91d77c7e5cbdf16691c7a6bfbb53bef09eb5ab1bff52a9989c6`
