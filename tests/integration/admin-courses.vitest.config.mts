import { defineConfig } from "vitest/config";

// Real local Supabase integration for ADM-02. Sibling to admin-accounts.vitest.config.mts
// (kept separate rather than appended to that config's include list, since that file belongs
// to ADM-01's own developer round): these fixtures are additive-and-cleaned-up, not
// racing/destructive, so they run against whatever local Supabase instance is already up.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["tests/integration/admin-courses.test.ts"],
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
