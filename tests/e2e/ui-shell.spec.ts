import { expect, test, type Page } from "@playwright/test";

// SH-07: new e2e checks for the shared sidebar shell. Runs under tests/e2e/admin.playwright.config.ts
// (ADMIN_E2E_PORT), against whatever local Supabase instance is already running, using the
// repo's documented local-only seed accounts (password LocalOnly!123 for all three below) --
// the same pattern tests/e2e/admin-accounts.spec.ts and tests/e2e/auth.spec.ts already use, so
// this spec needs no disposable stack of its own.
const PASSWORD = "LocalOnly!123";
const STUDENT_EMAIL = "demo-student@localhost.test";
const LECTURER_EMAIL = "demo-lecturer@localhost.test";
const ADMIN_EMAIL = "demo-admin2@localhost.test";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe("[SH-07-AC2] role nav isolation", () => {
  test("a student only sees the student's nav links", async ({ page }) => {
    await signIn(page, STUDENT_EMAIL);
    await expect(page).toHaveURL(/\/student$/);
    const nav = page.getByRole("navigation").first();
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Available slots" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "My bookings" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Accounts" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Courses" })).toHaveCount(0);
  });

  test("a lecturer only sees the lecturer's nav links", async ({ page }) => {
    await signIn(page, LECTURER_EMAIL);
    await expect(page).toHaveURL(/\/lecturer$/);
    const nav = page.getByRole("navigation").first();
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Available slots" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Accounts" })).toHaveCount(0);
  });

  test("an admin only sees the admin's nav links", async ({ page }) => {
    await signIn(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin$/);
    const nav = page.getByRole("navigation").first();
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Accounts" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Courses" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Available slots" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "My bookings" })).toHaveCount(0);
  });
});

test("[SH-07-AC3] dark mode applies the dark token set on a restyled page", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/login");
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // The light token for --background is oklch(1 0 0) (white, i.e. rgb(255, 255, 255)); the dark
  // token is oklch(0.145 0 0) (near-black). Asserting the computed colour is the dark one (and
  // not white) proves the `prefers-color-scheme: dark` media query actually switched the tokens.
  expect(background).not.toBe("rgb(255, 255, 255)");

  await signIn(page, STUDENT_EMAIL);
  await expect(page).toHaveURL(/\/student$/);
  const dashboardBackground = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  expect(dashboardBackground).not.toBe("rgb(255, 255, 255)");
});

test("[SH-07-AC4] a tabbed-to interactive element shows a visible focus indicator in both themes", async ({
  page,
}) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto("/login");
    await page.getByLabel("Email").focus();
    await page.keyboard.press("Tab"); // move to the password field
    const indicator = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = getComputedStyle(el);
      return { outlineStyle: style.outlineStyle, boxShadow: style.boxShadow };
    });
    expect(indicator).not.toBeNull();
    const hasVisibleOutline = indicator!.outlineStyle !== "none";
    const hasVisibleRing = indicator!.boxShadow !== "none" && indicator!.boxShadow !== "";
    expect(hasVisibleOutline || hasVisibleRing).toBe(true);
  }
});

test("[SH-07-AC6] restyled pages keep the accessible labels and roles existing tests query by", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

  await signIn(page, STUDENT_EMAIL);
  await expect(page).toHaveURL(/\/student$/);
  await page.goto("/student/bookings");
  await expect(page.getByRole("heading", { name: /my bookings/i })).toBeVisible();
});

test("[SH-07-AC1] the restyled sign-in -> dashboard -> sign-out flow still works end to end", async ({
  page,
}) => {
  await signIn(page, STUDENT_EMAIL);
  await expect(page).toHaveURL(/\/student$/);
  await page.getByRole("link", { name: "Browse consultation slots" }).click();
  await expect(page).toHaveURL(/\/student\/slots$/);
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("[SH-07-AC8] a role=alert message is present with its pre-restyle text", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(STUDENT_EMAIL);
  await page.getByLabel("Password").fill("definitely-the-wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  // Scoped to our own markup (a <p role="alert">): once hydrated, the page also has Next.js's
  // own `#__next-route-announcer__` (`div role="alert"`), which `getByRole("alert")` alone would
  // also match.
  await expect(page.locator('p[role="alert"]')).toHaveText("Incorrect email or password.");
});

test("[SH-07-AC9] below md the sidebar collapses behind a keyboard-reachable, operable toggle", async ({
  page,
}) => {
  await page.setViewportSize({ width: 500, height: 800 });
  await signIn(page, STUDENT_EMAIL);
  await expect(page).toHaveURL(/\/student$/);

  // Below md the persistent sidebar nav is not in the accessibility tree; only the toggle is.
  const nav = page.getByRole("navigation").first();
  await expect(nav).toHaveCount(0);
  const trigger = page.getByRole("button", { name: "Toggle Sidebar" });
  await expect(trigger).toBeVisible();

  await trigger.focus();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");

  const openedNav = page.getByRole("navigation").first();
  await expect(openedNav.getByRole("link", { name: "Available slots" })).toBeVisible();
});

test("[SH-07-AC10] toggling the sidebar writes no new cookie or localStorage/sessionStorage entry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 500, height: 800 });
  await signIn(page, STUDENT_EMAIL);
  await expect(page).toHaveURL(/\/student$/);

  const trigger = page.getByRole("button", { name: "Toggle Sidebar" });
  await trigger.click();
  await expect(page.getByRole("navigation").first()).toBeVisible();
  // Closes via Escape, not a second click on `trigger`: once open, the sheet's full-viewport
  // backdrop sits over the original (now-covered) trigger and would intercept that click.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation")).toHaveCount(0);

  const cookieNames = (await page.context().cookies()).map((cookie) => cookie.name);
  expect(cookieNames).not.toContain("sidebar_state");
  const storageState = await page.evaluate(() => ({
    localStorage: { ...window.localStorage },
    sessionStorage: { ...window.sessionStorage },
  }));
  expect(Object.keys(storageState.localStorage)).toHaveLength(0);
  expect(Object.keys(storageState.sessionStorage)).toHaveLength(0);
});
