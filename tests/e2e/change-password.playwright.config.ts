import { defineConfig, devices } from "@playwright/test";

// SH-06 e2e drives a real browser against a real Next dev server and real local Supabase
// Auth. It needs its own app port (never the project's default :3000, which another agent
// may be using) and the same local Supabase credentials the integration suite uses.
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
];
for (const name of required) {
  if (!process.env[name])
    throw new Error(`SH-06 e2e requires ${name}; see tests/integration/README.md`);
}
const apiUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
if (apiUrl.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(apiUrl.hostname))
  throw new Error("SH-06 e2e requires a local HTTP loopback Supabase instance, never hosted");

const port = process.env.SH06_TEST_APP_PORT ?? "3107";
// localhost, not 127.0.0.1: the Next dev server blocks its client scripts for other origins,
// which would leave the page without JavaScript.
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "change-password.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 45000,
  use: { baseURL, ...devices["Desktop Chrome"] },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
