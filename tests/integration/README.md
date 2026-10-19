# STU-02 disposable verification

These suites create fictional users, courses, slots and bookings. Run only against an isolated
Supabase stack with all repository migrations applied. They intentionally fail if infrastructure,
authentication or fixture eligibility is unavailable; they never silently skip a database check.
Real concurrent tests use independent PostgreSQL connections and verified lock holders.

## Explicit targets

Override the variables for a fresh isolated stack; defaults describe the original verification run.

| Variable                      | Default                               |
| ----------------------------- | ------------------------------------- |
| `STU02_TEST_DB_CONTAINER`     | `supabase_db_stu02-disposable-u65dd8` |
| `STU02_TEST_SUPABASE_WORKDIR` | `/tmp/stu02-verify.U65dd8`            |
| `STU02_TEST_API_URL`          | `http://127.0.0.1:55321`              |
| `STU02_TEST_APP_URL`          | `http://localhost:3102`               |

The container must start `supabase_db_stu02-`; API/app origins must be HTTP loopback. There is no
fallback to the ordinary project database. Review overrides carefully: prefix checks are guardrails,
not proof a database is disposable. Public auth keys are obtained internally from local status;
private keys are neither used nor printed. Fixture passwords are fictional. No `.env` file is read.

## Setup and commands

1. Create an isolated Supabase workdir/project with unused ports and project ID beginning `stu02-`.
   Start it using the Supabase CLI, then apply repository migrations in filename order to that
   disposable database. Do not use production credentials or the normal project's database.
2. Start a separate Next runtime using that stack's public URL/key and unused app port. For this
   run the coordinator used a separate source copy to avoid the original app's Next dev lock.
   Use `localhost` for browser access; this Next dev runtime did not hydrate on `127.0.0.1`.
3. Export the four overrides above if targets differ. Then run:

```sh
npx vitest run src/features/student/bookings/request-verification.test.ts
npx vitest run --config tests/integration/stu02.vitest.config.mts
npx playwright test --config tests/e2e/stu02.playwright.config.ts
```

The dedicated real-DB runner is **not** included in `npm test`. The dedicated browser configuration
expects an already running app and starts no webserver. Default `npm run test:e2e` discovers **all**
browser tests, including these fixture-writing cases. Its configuration now requires all four explicit
`STU02_TEST_*` overrides and `NEXT_PUBLIC_SUPABASE_URL` exactly matching `STU02_TEST_API_URL`.
Set the corresponding public local Supabase key for the app as well. Default E2E starts/reuses that app;
it no longer silently combines the ordinary app with unrelated disposable fixtures.

The CI End-to-end job runs `node workflow/scripts/stu02-ci.mjs`: on an ephemeral GitHub runner it
creates a uniquely named disposable stack, applies copied migrations through startup, supplies matching
targets/public configuration, runs real integration races, then **all** browser tests. It excludes none.
The runner refuses non-CI execution. Remote GitHub execution remains separate from local verification.

The pgTAP file can be run inside the validated disposable DB:

```sh
docker exec -i supabase_db_stu02-disposable-u65dd8 psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/student_request_consultation.test.sql
```

Inspect TAP output for every assertion: `psql` success alone does not prove TAP passed. This file rolls
back its fixtures. Integration/browser tests retain fake rows for diagnosis, so use a fresh schema
database for baseline suites that assert global table counts. Do not weaken those baseline assertions.

## Evidence and limitations

`workflow/handoffs/stu-02/tester.md` records reviewed commits, initial failures, corrected test setup,
confirmed defects, final counts, scoped shared coverage and unexecuted manual checks. A passing command
does not certify every requirement clause; acceptance IDs are traceability labels, not proof by themselves.
