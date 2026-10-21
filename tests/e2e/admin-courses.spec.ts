import { expect, test } from "@playwright/test";

// Uses the repo's documented local-only seed accounts (password LocalOnly!123), the same ones
// admin-accounts.spec.ts uses. demo-admin2@localhost.test is an ordinary, non-protected admin.
// demo-lecturer@localhost.test is the seeded active lecturer already assigned to course CS3227
// -- reused here as the "assign/remove" subject so this spec needs no new seed data, per the
// developer envelope's "prefer creating fixtures in tests" guidance. A random suffix keeps this
// spec's own course code collision-free across repeated runs against the same persistent dev DB.
const ACTOR_EMAIL = "demo-admin2@localhost.test";
const ACTOR_PASSWORD = "LocalOnly!123";
const LECTURER_NAME = "Demo Lecturer";
const LECTURER_EMAIL = "demo-lecturer@localhost.test";

test("[ADM-02-AC1] [ADM-02-AC6] [ADM-02-AC7] [ADM-02-AC8] [ADM-02-AC12] [ADM-02-AC14] an admin creates a course, assigns and removes a lecturer, and deactivates/reactivates it", async ({
  page,
}) => {
  const code = `E2E${Date.now().toString().slice(-8)}`;
  const name = `Playwright Course ${code}`;

  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "Manage courses" }).click();
  await expect(page).toHaveURL(/\/admin\/courses$/);

  // [ADM-02-AC1] create a course; it appears in the list with an Active badge.
  await page.getByLabel("Code", { exact: true }).fill(code);
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Create course" }).click();
  await expect(page.getByText(`Course created: ${code}`)).toBeVisible();

  await page.goto(`/admin/courses?query=${code}`);
  const row = page.locator("li").filter({ hasText: code }).first();
  await expect(row).toBeVisible();
  await expect(row.getByText("Active", { exact: true })).toBeVisible();
  await expect(row.getByText("No lecturer currently assigned.")).toBeVisible();

  // [ADM-02-AC8] assign the seeded active lecturer to the new course.
  await row
    .getByLabel("Assign lecturer")
    .selectOption({ label: `${LECTURER_NAME} (${LECTURER_EMAIL})` });
  await row.getByRole("button", { name: "Assign" }).click();
  await expect(row.getByText("Lecturer assigned.")).toBeVisible();
  await expect(row.getByText(LECTURER_NAME)).toBeVisible();

  // [ADM-02-AC12] remove the assignment; the row returns to "no lecturer assigned".
  await row.getByRole("button", { name: "Remove" }).click();
  await expect(row.getByText("Assignment removed.")).toBeVisible();
  await expect(row.getByText("No lecturer currently assigned.")).toBeVisible();

  // [ADM-02-AC6] deactivate the course; the badge flips and the control relabels.
  await row.getByRole("button", { name: "Deactivate" }).click();
  await expect(row.getByText("Course deactivated.")).toBeVisible();
  await expect(row.getByText("Deactivated", { exact: true })).toBeVisible();

  // [ADM-02-AC7] reactivate it; the badge flips back.
  await row.getByRole("button", { name: "Reactivate" }).click();
  await expect(row.getByText("Course activated.")).toBeVisible();
  await expect(row.getByText("Active", { exact: true })).toBeVisible();

  // [ADM-02-AC14] the active-status filter narrows the list to this course.
  await page.goto(`/admin/courses?query=${code}&active=true`);
  await expect(page.locator("li").filter({ hasText: code })).toBeVisible();
});

test("[ADM-02-AC3] creating a course with an invalid code shows a field-level validation error", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/courses");
  await page.getByLabel("Code", { exact: true }).fill("!");
  await page.getByLabel("Name", { exact: true }).fill("Invalid Code Course");
  await page.getByRole("button", { name: "Create course" }).click();
  await expect(page.getByText(/Please correct the code/i)).toBeVisible();
});
