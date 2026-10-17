import { expect, test } from "@playwright/test";

test("[SH-01-AC2] a signed-out visitor is sent to the login page", async ({ page }) => {
  for (const path of ["/", "/student", "/lecturer", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});
