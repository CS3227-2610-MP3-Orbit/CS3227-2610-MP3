import { defineConfig, devices } from "@playwright/test";
import { appUrl } from "../integration/stu02-test-helpers.mjs";

export default defineConfig({
  testDir: ".",
  testMatch: "student-request-consultation.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 45000,
  use: { baseURL: appUrl, ...devices["Desktop Chrome"] },
});
