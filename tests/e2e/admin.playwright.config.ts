import { execFileSync } from "node:child_process";

import { defineConfig, devices } from "@playwright/test";

// Dedicated config for the admin-accounts e2e spec, deliberately separate from the root
// playwright.config.ts (which the STU-02 round repurposed to require a disposable
// "stu02-"-prefixed Supabase stack for every e2e run). ADM-01's admin-accounts spec targets
// whatever local Supabase instance is already running -- it reads local-only seed admin
// accounts, never a secret key -- so it needs no disposable stack of its own. Runs its own dev
// server on a non-default port so it does not collide with anything already on :3000.
const port = Number(process.env.ADMIN_E2E_PORT ?? 3104);
// localhost, not 127.0.0.1: the Next dev server blocks its client scripts for other origins,
// which would leave the page without JavaScript.
const baseURL = `http://localhost:${port}`;

// The spawned dev server needs the public Supabase URL/key. These come from the local CLI's own
// status output (never a .env file, and never the secret key) so this config works whether or
// not a .env.local happens to be present in this checkout.
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
) as { API_URL?: string; PUBLISHABLE_KEY?: string; ANON_KEY?: string };

export default defineConfig({
  // Relative to this config file's own directory (tests/e2e), not the cwd -- unlike the root
  // playwright.config.ts, which lives at the project root where "tests/e2e" is correct.
  testDir: ".",
  // SH-07 added ui-shell.spec.ts here too: it needs the same already-running local Supabase
  // instance and local-only seed accounts as the admin-accounts spec, so it shares this config
  // rather than the root playwright.config.ts (which requires a disposable STU02_TEST_* stack).
  testMatch: /(admin-.*|ui-shell)\.spec\.ts$/,
  workers: 1,
  timeout: 45000,
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: status.API_URL ?? "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY ?? status.ANON_KEY ?? "",
    },
  },
});
