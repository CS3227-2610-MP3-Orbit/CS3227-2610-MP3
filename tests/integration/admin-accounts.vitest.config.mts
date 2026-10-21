import { defineConfig } from "vitest/config";

// Real local Supabase integration for ADM-01 (not a disposable "stu02-" stack: these fixtures
// are additive-and-cleaned-up, not racing/destructive, so they run against whatever local
// Supabase instance the developer already has running). See tests/integration/README.md for the
// unrelated STU-02 disposable-stack convention this file intentionally does not reuse.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: [
      "tests/integration/admin-accounts.test.ts",
      // Independent tester_verifier coverage (direct non-admin/signed-out calls for every
      // action, ownership substitution, a real two-connection AC14 race, and
      // requireUser()/getCurrentUser() against a deactivated user). See that file's header.
      "tests/integration/admin-accounts-verification.test.ts",
    ],
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
