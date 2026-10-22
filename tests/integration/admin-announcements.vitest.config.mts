import { defineConfig } from "vitest/config";

// Real local Supabase integration for ADM-03. Sibling to admin-courses.vitest.config.mts/
// admin-reports.vitest.config.mts (kept separate rather than appended to either, since those
// files belong to ADM-02's/ADM-04's own developer rounds): these fixtures are additive and
// cleaned up, not racing/destructive, so they run against whatever local Supabase instance is
// already up.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["tests/integration/admin-announcements.test.ts"],
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
