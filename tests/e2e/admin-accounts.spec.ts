import { expect, test } from "@playwright/test";

// Uses the repo's documented local-only seed accounts (password LocalOnly!123):
// demo-admin2@localhost.test is an ordinary, non-protected admin -- the acting caller here, so
// its OWN row is tested for ADM-01-R5's self-lock. demo-admin@localhost.test is the protected
// recovery administrator (ADM-01-R8) marked by the 20261020000000 migration.
const ACTOR_EMAIL = "demo-admin2@localhost.test";
const ACTOR_PASSWORD = "LocalOnly!123";
const PROTECTED_EMAIL = "demo-admin@localhost.test";

test("[ADM-01-AC17] protected admin and the caller's own row hide role/deactivate/reset controls", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACTOR_EMAIL);
  await page.getByLabel("Password").fill(ACTOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/accounts?query=demo-admin");

  const protectedRow = page.locator("li").filter({ hasText: PROTECTED_EMAIL });
  await expect(protectedRow).toBeVisible();
  await expect(protectedRow.getByText("Protected", { exact: true })).toBeVisible();
  await expect(
    protectedRow.getByText(/its role, active status and password cannot be changed/i),
  ).toBeVisible();
  await expect(protectedRow.getByRole("combobox")).toHaveCount(0);
  await expect(protectedRow.getByRole("button", { name: "Change role" })).toHaveCount(0);
  await expect(protectedRow.getByRole("button", { name: /Deactivate|Activate/ })).toHaveCount(0);
  await expect(protectedRow.getByRole("button", { name: "Reset password" })).toHaveCount(0);

  const ownRow = page.locator("li").filter({ hasText: ACTOR_EMAIL });
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
