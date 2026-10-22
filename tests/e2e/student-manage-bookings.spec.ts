import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { apiUrl, quote, sql, workdir } from "../integration/stu02-test-helpers.mjs";

// These acceptance tests describe externally observable STU-04 behaviour.
async function createOwnedBookingFixture() {
  const status = JSON.parse(
    execFileSync("npx", ["supabase", "status", "--workdir", workdir, "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  const email = `stu04-${randomUUID()}@example.test`;
  const password = "Fictional-fixture-Only-404!";
  const signup = await fetch(`${apiUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: status.ANON_KEY ?? status.PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  expect(signup.ok, "fixture signup must succeed before browser assertions").toBe(true);
  const student = (await signup.json()).user.id as string;
  const lecturer = randomUUID();
  const course = randomUUID();
  const bookingIds = Array.from({ length: 6 }, () => randomUUID());
  const slotIds = Array.from({ length: 6 }, () => randomUUID());
  const statuses = [
    "pending",
    "approved",
    "rejected",
    "cancelled",
    "completed",
    "approved",
  ] as const;
  await sql(`update auth.users set email_confirmed_at=now() where id=${quote(student)};
    insert into auth.users(id) values (${quote(lecturer)});
    update public.profiles set role='lecturer',full_name='Dr STU04 Fixture' where id=${quote(lecturer)};
    insert into public.courses(id,code,name) values (${quote(course)},${quote(`STU04-${course.replaceAll("-", "").slice(0, 12).toUpperCase()}`)},'Manage booking verification');
    insert into public.course_lecturers(course_id,lecturer_id) values (${quote(course)},${quote(lecturer)});
    insert into public.consultation_slots(id,course_id,lecturer_id,starts_at,ends_at)
    select slot_id,${quote(course)}::uuid,${quote(lecturer)}::uuid,
      case when ordinal = 6 then '2000-06-01 01:00Z'::timestamptz
        else '2099-06-01 01:00Z'::timestamptz + ordinal * interval '2 hours' end,
      case when ordinal = 6 then '2000-06-01 02:00Z'::timestamptz
        else '2099-06-01 02:00Z'::timestamptz + ordinal * interval '2 hours' end
    from unnest(array[${slotIds.map(quote).join(",")} ]::uuid[]) with ordinality as fixture(slot_id,ordinal);
    insert into public.bookings(id,slot_id,student_id,status,topic,questions,rejection_reason)
    select booking_id,slot_id,${quote(student)}::uuid,status::public.booking_status,
      case when status='pending' then '<script>window.stu04Injected=true</script>' else 'STU04 '||status end,
      'Fixture questions for '||status,
      case when status='rejected' then 'Private rejection reason' else null end
    from unnest(array[${bookingIds.map(quote).join(",")} ]::uuid[],array[${slotIds.map(quote).join(",")} ]::uuid[],array[${statuses.map(quote).join(",")} ]::text[])
      as fixture(booking_id,slot_id,status);`);
  return { email, password, bookingIds };
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/student/);
}

test("[STU-04-AC9] signed-out Student cannot access booking list or detail", async ({ page }) => {
  await page.goto("/student/bookings");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText(/my bookings/i)).toHaveCount(0);

  await page.goto("/student/bookings/74000000-0000-4000-8000-000000000999");
  await expect(page).toHaveURL(/\/login$/);
});

test("[STU-04-AC11] booking views provide keyboard-operable labelled actions at narrow width", async ({
  page,
}) => {
  const fixture = await createOwnedBookingFixture();
  await signIn(page, fixture.email, fixture.password);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/student/bookings");
  await expect(page.getByRole("heading", { name: /my bookings/i })).toBeVisible();
  await page
    .getByRole("link", { name: /view booking/i })
    .first()
    .focus();
  await expect(page.getByRole("link", { name: /view booking/i }).first()).toBeFocused();
});

test("[STU-04-AC1] [STU-04-AC3] [STU-04-AC12] owned history renders statuses and hostile text literally", async ({
  page,
}) => {
  const fixture = await createOwnedBookingFixture();
  await signIn(page, fixture.email, fixture.password);
  await page.goto("/student/bookings");
  await expect(page.getByText("Status: pending", { exact: true })).toBeVisible();
  await expect(page.getByText("Status: approved", { exact: true })).toBeVisible();
  await expect(page.getByText("Status: completed", { exact: true }).first()).toBeVisible();
  await expect(
    page.evaluate(() => (window as typeof window & { stu04Injected?: unknown }).stu04Injected),
  ).resolves.toBeUndefined();
  await page.goto(`/student/bookings/${fixture.bookingIds[2]}`);
  await expect(page.getByText("Rejection reason: Private rejection reason")).toBeVisible();
});

test("[STU-04-AC4] [STU-04-AC5] [STU-04-AC6] [STU-04-AC7] [STU-04-AC8] [STU-04-AC10] edit and cancel report safe conflicts", async ({
  page,
}) => {
  const fixture = await createOwnedBookingFixture();
  await signIn(page, fixture.email, fixture.password);
  await page.goto(`/student/bookings/${fixture.bookingIds[0]}`);
  await page.getByRole("button", { name: /edit/i }).click();
  await expect(page.getByLabel(/topic/i)).toBeVisible();
  await expect(page.getByLabel(/questions/i)).toBeVisible();
  await page.getByLabel(/topic/i).fill("Updated STU04 topic");
  await page.getByLabel(/questions/i).fill("Updated STU04 questions");
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page.getByRole("status")).toHaveText("Booking updated.");
  await expect(page.getByText("Topic: Updated STU04 topic")).toBeVisible();
  await expect(page.getByText("Questions: Updated STU04 questions")).toBeVisible();
  await page.getByRole("button", { name: /cancel booking/i }).click();
  await expect(page.getByText(/This cancellation cannot be undone/)).toBeVisible();
  await expect(page.getByRole("button", { name: /confirm cancellation/i })).toBeVisible();
  await page.getByRole("button", { name: /confirm cancellation/i }).click();
  await expect(page.getByRole("status")).toHaveText("Booking cancelled.");
  await expect(page.getByText("Status: cancelled")).toBeVisible();
  await expect(page.getByText("Topic: Updated STU04 topic")).toBeVisible();
  await expect(page.getByText("Questions: Updated STU04 questions")).toBeVisible();
});
