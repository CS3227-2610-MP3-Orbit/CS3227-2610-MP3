import { execFileSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

// Uses the repo's documented local-only seed accounts (password LocalOnly!123), the same ones
// admin-courses.spec.ts/admin-reports.spec.ts/ui-shell.spec.ts use. demo-admin2@localhost.test
// is an ordinary, non-protected admin. A random suffix keeps this spec's own titles
// collision-free across repeated runs against the same persistent dev DB.
const ADMIN_EMAIL = "demo-admin2@localhost.test";
const STUDENT_EMAIL = "demo-student@localhost.test";
const LECTURER_EMAIL = "demo-lecturer@localhost.test";
const PASSWORD = "LocalOnly!123";

// This spec's own fixture titles, deleted in afterAll via the local secret key (obtained the
// same no-print way tests/integration/*.test.ts and this directory's own playwright config
// already do: shelling out to `supabase status -o json`, never reading a .env file) -- this is
// a disposable local-only stack's key, not a production credential.
const createdTitles: string[] = [];

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.afterAll(async () => {
  if (createdTitles.length === 0) return;
  const status = JSON.parse(
    execFileSync("npx", ["supabase", "status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  const apiUrl = status.API_URL;
  const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
  if (!apiUrl || !secretKey) return;
  const serviceClient = createClient(apiUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await serviceClient.from("announcements").delete().in("title", createdTitles);
});

// SH-07-R14/AC17: items render as a `Table` row at `>= md` and a `Card` below it, both always
// in the DOM -- `.or(...)` matches whichever layout is actually on screen (and so in the
// accessibility tree) for the current viewport, identified either way by the item's title (a
// `<tr>`'s own `aria-label` at the table layout, a `role="group"`'s `aria-label` at the card
// layout, since neither role reliably gets a "name from content").
function itemRow(page: Page, title: string) {
  return page.getByRole("row", { name: title }).or(page.getByRole("group", { name: title }));
}

test("[ADM-03-AC1] [ADM-03-AC3] [ADM-03-AC5] [ADM-03-AC6] an admin creates a guideline via the New announcement dialog, edits it, and publishes/unpublishes it", async ({
  page,
}) => {
  const title = `E2E guideline ${Date.now()}`;
  const editedTitle = `${title} (edited)`;
  createdTitles.push(title, editedTitle);

  await signIn(page, ADMIN_EMAIL);
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "Announcements" }).click();
  await expect(page).toHaveURL(/\/admin\/announcements$/);
  await expect(page.getByRole("heading", { name: "Announcements" })).toBeVisible();

  // [ADM-03-AC1] create a draft guideline via the dialog.
  await page.getByRole("button", { name: "New announcement" }).click();
  const createDialog = page.getByRole("dialog");
  await expect(createDialog).toBeVisible();
  await createDialog.getByLabel("Kind").selectOption("guideline");
  await createDialog.getByLabel("Title", { exact: true }).fill(title);
  await createDialog.getByLabel("Body", { exact: true }).fill("Consult before the deadline.");
  await createDialog.getByRole("button", { name: "Create" }).click();
  await expect(createDialog.getByText("Created as a draft.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.reload();
  const row = itemRow(page, title);
  await expect(row).toBeVisible();
  await expect(row.getByText("Draft", { exact: true })).toBeVisible();

  // [ADM-03-AC3] edit it via the Edit dialog, pre-filled with its current values.
  await row.getByRole("button", { name: "Edit" }).click();
  const editDialog = page.getByRole("dialog");
  await expect(editDialog).toBeVisible();
  await expect(editDialog.getByLabel("Title", { exact: true })).toHaveValue(title);
  await editDialog.getByLabel("Title", { exact: true }).fill(editedTitle);
  await editDialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const editedRow = itemRow(page, editedTitle);
  await expect(editedRow).toBeVisible();
  // [ADM-03-AC5] still a draft after editing (edit never changes isPublished).
  await expect(editedRow.getByText("Draft", { exact: true })).toBeVisible();

  // [ADM-03-AC5] [ADM-03-AC6] publish it; it is no longer a draft, then unpublish it again.
  await editedRow.getByRole("button", { name: "Publish" }).click();
  await expect(editedRow.getByText("Published.")).toBeVisible();
  await expect(editedRow.getByText("Published", { exact: true })).toBeVisible();

  await editedRow.getByRole("button", { name: "Unpublish" }).click();
  await expect(editedRow.getByText("Unpublished.")).toBeVisible();
  await expect(editedRow.getByText("Draft", { exact: true })).toBeVisible();
});

test("[ADM-03-AC2] creating an announcement with an empty title shows a field-level validation error", async ({
  page,
}) => {
  await signIn(page, ADMIN_EMAIL);
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/announcements");
  await page.getByRole("button", { name: "New announcement" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Kind").selectOption("announcement");
  await dialog.getByLabel("Body", { exact: true }).fill("Body text.");
  // The native "required" attribute on a completely empty Title would block submission
  // client-side before the server action ever runs; this spec instead submits a
  // whitespace-only title, which "required" accepts but the server's trim-based bound still
  // rejects (ADM-03-R1), to exercise the real field-level error path end to end.
  await dialog.getByLabel("Title", { exact: true }).fill("   ");
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog.getByText(/Please correct the title/i)).toBeVisible();
});

test("[ADM-03-AC14] a published guideline and announcement appear on both the Student and the Lecturer dashboard cards", async ({
  page,
}) => {
  const guidelineTitle = `E2E reader guideline ${Date.now()}`;
  const announcementTitle = `E2E reader announcement ${Date.now()}`;
  const guidelineBody = "Bring your student ID to every consultation.";
  const announcementBody = "The office is closed this Friday.";
  createdTitles.push(guidelineTitle, announcementTitle);

  await signIn(page, ADMIN_EMAIL);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/announcements");

  for (const [kind, title, body] of [
    ["guideline", guidelineTitle, guidelineBody],
    ["announcement", announcementTitle, announcementBody],
  ] as const) {
    await page.getByRole("button", { name: "New announcement" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Kind").selectOption(kind);
    await dialog.getByLabel("Title", { exact: true }).fill(title);
    await dialog.getByLabel("Body", { exact: true }).fill(body);
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog.getByText("Created as a draft.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    await itemRow(page, title).getByRole("button", { name: "Publish" }).click();
    await expect(itemRow(page, title).getByText("Published", { exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login$/);

  // [ADM-03-AC14] [ADM-03-R10] the Student dashboard card shows both, title as a heading and
  // body as plain text with line breaks preserved.
  await signIn(page, STUDENT_EMAIL);
  await expect(page).toHaveURL(/\/student$/);
  const studentCard = page
    .getByRole("heading", { name: "Guidelines and announcements" })
    .locator("..");
  await expect(studentCard.getByRole("heading", { name: guidelineTitle })).toBeVisible();
  await expect(studentCard.getByText(guidelineBody)).toBeVisible();
  await expect(studentCard.getByRole("heading", { name: announcementTitle })).toBeVisible();
  await expect(studentCard.getByText(announcementBody)).toBeVisible();
  await page.getByRole("button", { name: /sign out/i }).click();

  // [ADM-03-AC14] [ADM-03-R10] the Lecturer dashboard card shows the exact same content.
  await signIn(page, LECTURER_EMAIL);
  await expect(page).toHaveURL(/\/lecturer$/);
  const lecturerCard = page
    .getByRole("heading", { name: "Guidelines and announcements" })
    .locator("..");
  await expect(lecturerCard.getByRole("heading", { name: guidelineTitle })).toBeVisible();
  await expect(lecturerCard.getByText(guidelineBody)).toBeVisible();
  await expect(lecturerCard.getByRole("heading", { name: announcementTitle })).toBeVisible();
  await expect(lecturerCard.getByText(announcementBody)).toBeVisible();
});
