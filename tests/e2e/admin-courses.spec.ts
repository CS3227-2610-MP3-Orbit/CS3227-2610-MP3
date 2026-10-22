import { expect, test, type Page } from "@playwright/test";

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

// SH-07-R14/AC17: courses render as a `Table` row at `>= md` and a `Card` below it, both
// always in the DOM -- `.or(...)` matches whichever layout is actually on screen (and so in
// the accessibility tree) for the current viewport, identified either way by the course code
// (a `<tr>`'s own `aria-label` at the table layout, a `role="group"`'s `aria-label` at the
// card layout, since neither role reliably gets a "name from content").
function courseRow(page: Page, code: string) {
  return page.getByRole("row", { name: code }).or(page.getByRole("group", { name: code }));
}

test("[ADM-02-AC1] [ADM-02-AC6] [ADM-02-AC7] [ADM-02-AC8] [ADM-02-AC12] [ADM-02-AC14] [SH-07-AC15] [SH-07-AC18] an admin creates a course via the New course dialog, assigns and removes a lecturer, and deactivates/reactivates it", async ({
  page,
}) => {
  const code = `E2E${Date.now().toString().slice(-8)}`;
  const name = `Playwright Course ${code}`;

  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // [SH-07-AC15] "Active courses" starts at this known count, then increases by exactly 1
  // once the new course below is created and activated -- a real, seed-independent check
  // that the tile reflects listCourses({ activeFilter: "true" }).
  const activeCoursesBefore = Number(
    await page.getByText("Active courses").first().locator("..").locator("p").nth(1).innerText(),
  );

  await page.getByRole("link", { name: "Manage courses" }).click();
  await expect(page).toHaveURL(/\/admin\/courses$/);

  // [SH-07-AC18] the create-course fields now live inside a Dialog opened by "New course".
  await page.getByRole("button", { name: "New course" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // [ADM-02-AC1] create a course; it appears in the list with an Active badge.
  await dialog.getByLabel("Code", { exact: true }).fill(code);
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  await dialog.getByRole("button", { name: "Create course" }).click();
  await expect(dialog.getByText(`Course created: ${code}`)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.goto(`/admin/courses?query=${code}`);
  const row = courseRow(page, code);
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
  await expect(courseRow(page, code)).toBeVisible();

  // [SH-07-AC15] back on the dashboard, "Active courses" increased by exactly 1.
  await page.goto("/admin");
  const activeCoursesAfter = Number(
    await page.getByText("Active courses").first().locator("..").locator("p").nth(1).innerText(),
  );
  expect(activeCoursesAfter).toBe(activeCoursesBefore + 1);
});

test("[ADM-02-AC3] [SH-07-AC18] creating a course with an invalid code shows a field-level validation error", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/courses");
  // [SH-07-AC18] the create-course fields now live inside a Dialog opened by "New course".
  await page.getByRole("button", { name: "New course" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Code", { exact: true }).fill("!");
  await dialog.getByLabel("Name", { exact: true }).fill("Invalid Code Course");
  await dialog.getByRole("button", { name: "Create course" }).click();
  await expect(dialog.getByText(/Please correct the code/i)).toBeVisible();
});

test("[SH-07-AC17] courses render as a table at >= md and as cards below md, with the same row data", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/courses?query=CS3227");

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("row", { name: "CS3227" })).toBeVisible();
  await expect(page.getByRole("group", { name: "CS3227" })).toHaveCount(0);

  await page.setViewportSize({ width: 500, height: 800 });
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "CS3227" })).toBeVisible();
  await expect(page.getByRole("row", { name: "CS3227" })).toHaveCount(0);
});
