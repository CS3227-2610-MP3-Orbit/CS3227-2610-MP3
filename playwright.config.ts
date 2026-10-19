import { defineConfig, devices } from "@playwright/test";

// This suite includes fixture-writing tests: require an explicit disposable target.
const required = [
  "STU02_TEST_DB_CONTAINER",
  "STU02_TEST_SUPABASE_WORKDIR",
  "STU02_TEST_API_URL",
  "STU02_TEST_APP_URL",
];
if (required.some((name) => !process.env[name])) {
  throw new Error(
    "Full E2E requires all four explicit STU02_TEST_* disposable target variables; see tests/integration/README.md.",
  );
}
if (!process.env.STU02_TEST_DB_CONTAINER!.startsWith("supabase_db_stu02-"))
  throw new Error("E2E requires a disposable stu02 database");
const baseURL = process.env.STU02_TEST_APP_URL!;
for (const value of [baseURL, process.env.STU02_TEST_API_URL!]) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    throw new Error("E2E targets must be HTTP loopback");
}
if (process.env.NEXT_PUBLIC_SUPABASE_URL !== process.env.STU02_TEST_API_URL)
  throw new Error("App and fixture Supabase targets must match");
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 45000,
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${new URL(baseURL).port || "80"}`,
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
  },
});
