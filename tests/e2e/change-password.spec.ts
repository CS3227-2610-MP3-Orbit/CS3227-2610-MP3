import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

import {
  createFixtureUser,
  deleteFixtureUser,
  FIXTURE_PASSWORD,
} from "../integration/sh06-test-helpers.mjs";

test("[SH-06-AC5] a signed-out visitor is sent to the login page, form never shown", async ({
  page,
}) => {
  await page.goto("/account/password");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel(/current password/i)).toHaveCount(0);
});

test("[SH-06-AC1] [SH-06-AC2] [SH-06-AC6] a signed-in user changes their own password via the real app", async ({
  page,
}) => {
  const user = await createFixtureUser();
  try {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(FIXTURE_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/student/);

    await page.getByRole("link", { name: /change password/i }).click();
    await expect(page).toHaveURL(/\/account\/password$/);

    // Wrong current password: generic refusal. The form is a real <form action={Server
    // Action}>, so it submits as a POST even before hydration (progressive enhancement) --
    // and per React 19, a form bound this way resets its (uncontrolled) fields on every
    // dispatch, win or lose. Re-entry is required after a refusal; this is accepted
    // behaviour, not a bug (see the handoff).
    await page.getByLabel(/current password/i).fill("definitely-the-wrong-password");
    await page.getByLabel("New password", { exact: true }).fill("a-fresh-new-password");
    await page.getByLabel(/confirm new password/i).fill("a-fresh-new-password");
    await page.getByRole("button", { name: /change password/i }).click();
    await expect(page.getByText(/current password is incorrect/i)).toBeVisible();
    await expect(page.getByLabel(/current password/i)).toHaveValue("");

    // Correct current password and a valid new password: succeeds, stays signed in.
    const newPassword = `Sh06-E2E-${randomUUID()}`;
    await page.getByLabel(/current password/i).fill(FIXTURE_PASSWORD);
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel(/confirm new password/i).fill(newPassword);
    await page.getByRole("button", { name: /change password/i }).click();
    await expect(page.getByRole("status").getByText(/password changed/i)).toBeVisible();
    await expect(page).not.toHaveURL(/\/login$/);

    // Signing out and back in: the old password now fails, the new one works (AC6).
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(FIXTURE_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/incorrect email or password/i)).toBeVisible();

    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(newPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/student/);
  } finally {
    await deleteFixtureUser(user.id);
  }
});

test("[SH-06-AC9] [SH-06-AC10] a 6th wrong-current-password attempt within 15 minutes, even with the correct password, is refused as rate-limited", async ({
  page,
}) => {
  const user = await createFixtureUser();
  try {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(FIXTURE_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/student/);

    await page.getByRole("link", { name: /change password/i }).click();
    await expect(page).toHaveURL(/\/account\/password$/);

    for (let i = 0; i < 5; i += 1) {
      await page.getByLabel(/current password/i).fill("definitely-the-wrong-password");
      await page.getByLabel("New password", { exact: true }).fill("a-fresh-new-password");
      await page.getByLabel(/confirm new password/i).fill("a-fresh-new-password");
      await page.getByRole("button", { name: /change password/i }).click();
      await expect(page.getByText(/current password is incorrect/i)).toBeVisible();
    }

    // 6th attempt, this time with the CORRECT current password: still refused, before
    // Supabase Auth is ever contacted for verification.
    await page.getByLabel(/current password/i).fill(FIXTURE_PASSWORD);
    await page.getByLabel("New password", { exact: true }).fill("a-fresh-new-password");
    await page.getByLabel(/confirm new password/i).fill("a-fresh-new-password");
    await page.getByRole("button", { name: /change password/i }).click();
    await expect(page.getByText(/too many attempts\. try again in \d+ minutes?\./i)).toBeVisible();
  } finally {
    await deleteFixtureUser(user.id);
  }
});
