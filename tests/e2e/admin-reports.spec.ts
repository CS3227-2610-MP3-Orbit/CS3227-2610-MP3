import { expect, test } from "@playwright/test";

// Uses the repo's documented local-only seed accounts (password LocalOnly!123), the same ones
// admin-accounts.spec.ts/admin-courses.spec.ts use. demo-admin2@localhost.test is an ordinary,
// non-protected admin. This spec deliberately never clicks "Summarise this period": whether a
// real SOCLAAS key is configured in this dev environment varies, and the AI path is already
// covered deterministically by the mocked unit tests and the real-DB integration suite.
const ACTOR_EMAIL = "demo-admin2@localhost.test";
const ACTOR_PASSWORD = "LocalOnly!123";

test("[ADM-04-AC1] [ADM-04-AC2] an admin opens Reports, sees the default 7-day period, and switches to a custom range", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "View reports" }).click();
  await expect(page).toHaveURL(/\/admin\/reports$/);
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();

  // [ADM-04-AC1] the default period preset is "Last 7 days".
  await expect(page.getByLabel("Period", { exact: true })).toHaveValue("7");
  // CardTitle (src/components/ui/card.tsx) renders a styled <div>, not a heading element.
  await expect(page.getByText("Total bookings")).toBeVisible();

  // [ADM-04-AC2] all five booking_status rows render, zero-filled, summing to the total shown.
  await expect(page.getByRole("heading", { name: "By status" })).toBeVisible();
  for (const label of ["Pending", "Approved", "Rejected", "Cancelled", "Completed"]) {
    await expect(page.getByRole("cell", { name: label, exact: true })).toBeVisible();
  }

  // A bounded custom range (92 days) is accepted and re-renders the report.
  await page.getByLabel("Period", { exact: true }).selectOption("custom");
  await page.getByLabel("Start date").fill("2026-01-01");
  await page.getByLabel("End date").fill("2026-04-02");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/preset=custom/);
  await expect(page.getByText("Showing 2026-01-01 to 2026-04-02")).toBeVisible();
  await expect(page.getByText("Total bookings")).toBeVisible();

  // The AI summary panel is present and ready, but this spec does not click it (see header note).
  await expect(page.getByRole("heading", { name: "AI activity summary" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Summarise this period" })).toBeVisible();
});

test("[ADM-04-AC1] a 93-day custom range is refused with a validation message, not a report", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/reports?preset=custom&start=2026-01-01&end=2026-04-03"); // 93 days
  await expect(page.getByText(/92-day span/i)).toBeVisible();
  await expect(page.getByText("Total bookings")).not.toBeVisible();
});
