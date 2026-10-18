import { expect, test } from "@playwright/test";

test("[STU-01-AC2] [SH-03-AC24] signed-out slot browsing redirects before rendering slot data", async ({
  page,
}) => {
  await page.goto(
    "/student/slots?courseId=22222222-2222-4222-8222-222222222222&role=student",
  );

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("Available consultation slots")).toHaveCount(0);
});
