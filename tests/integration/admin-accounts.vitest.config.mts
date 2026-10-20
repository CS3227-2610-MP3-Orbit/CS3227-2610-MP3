import { defineConfig } from "vitest/config";

// Real local Supabase integration for ADM-01 (not a disposable "stu02-" stack: these fixtures
// are additive-and-cleaned-up, not racing/destructive, so they run against whatever local
// Supabase instance the developer already has running). See tests/integration/README.md for the
// unrelated STU-02 disposable-stack convention this file intentionally does not reuse.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["tests/integration/admin-accounts.test.ts"],
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
