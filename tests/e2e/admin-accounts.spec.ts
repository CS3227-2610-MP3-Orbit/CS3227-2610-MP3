import { expect, test, type Page } from "@playwright/test";

// Uses the repo's documented local-only seed accounts (password LocalOnly!123):
// demo-admin2@localhost.test is an ordinary, non-protected admin -- the acting caller here, so
// its OWN row is tested for ADM-01-R5's self-lock. demo-admin@localhost.test is the protected
// recovery administrator (ADM-01-R8) marked by the 20261020000000 migration.
const ACTOR_EMAIL = "demo-admin2@localhost.test";
const ACTOR_PASSWORD = "LocalOnly!123";
const PROTECTED_EMAIL = "demo-admin@localhost.test";

// SH-07-R14/AC17: accounts render as a `Table` row at `>= md` and a `Card` below it. Both
// halves are always in the DOM; Tailwind's `hidden`/`md:hidden` controls which one is actually
// on screen (and so in the accessibility tree) for the current viewport. A row's accessible
// name is its email either way -- a `<tr>`'s own `aria-label` at the table layout, a
// `role="group"`'s `aria-label` at the card layout -- so `.or(...)` matches whichever layout is
// live without caring which one that is.
function accountRow(page: Page, email: string) {
  return page.getByRole("row", { name: email }).or(page.getByRole("group", { name: email }));
}

test("[ADM-01-AC17] protected admin and the caller's own row hide role/deactivate/reset controls", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/accounts?query=demo-admin");

  const protectedRow = accountRow(page, PROTECTED_EMAIL);
  await expect(protectedRow).toBeVisible();
  await expect(protectedRow.getByText("Protected", { exact: true })).toBeVisible();
  await expect(
    protectedRow.getByText(/its role, active status and password cannot be changed/i),
  ).toBeVisible();
  await expect(protectedRow.getByRole("combobox")).toHaveCount(0);
  await expect(protectedRow.getByRole("button", { name: "Change role" })).toHaveCount(0);
  await expect(protectedRow.getByRole("button", { name: /Deactivate|Activate/ })).toHaveCount(0);
  await expect(protectedRow.getByRole("button", { name: "Reset password" })).toHaveCount(0);

  const ownRow = accountRow(page, ACTOR_EMAIL);
  await expect(ownRow).toBeVisible();
  await expect(ownRow.getByText("Protected", { exact: true })).toHaveCount(0);
  await expect(
    ownRow.getByText(/role, deactivation and password-reset controls are not available/i),
  ).toBeVisible();
  await expect(ownRow.getByRole("combobox")).toHaveCount(0);
  await expect(ownRow.getByRole("button", { name: "Change role" })).toHaveCount(0);
  await expect(ownRow.getByRole("button", { name: /Deactivate|Activate/ })).toHaveCount(0);
  await expect(ownRow.getByRole("button", { name: "Reset password" })).toHaveCount(0);
});

test("[SH-07-AC17] accounts render as a table at >= md and as cards below md, with the same row data", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/accounts?query=demo-admin2");

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("row", { name: ACTOR_EMAIL })).toBeVisible();
  await expect(page.getByRole("group", { name: ACTOR_EMAIL })).toHaveCount(0);

  await page.setViewportSize({ width: 500, height: 800 });
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByRole("group", { name: ACTOR_EMAIL })).toBeVisible();
  await expect(page.getByRole("row", { name: ACTOR_EMAIL })).toHaveCount(0);
});

test("[SH-07-AC18] the New account button opens a Dialog with the unchanged create-account fields", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/accounts");

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "New account" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(dialog.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(dialog.getByLabel("Full name", { exact: true })).toBeVisible();
  await expect(dialog.getByLabel("Role", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Create account" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
