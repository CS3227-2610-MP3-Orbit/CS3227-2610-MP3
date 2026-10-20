import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { quote, sql, workdir, apiUrl, appUrl } from "../integration/stu02-test-helpers.mjs";

test("[STU-02-AC8] signed-out direct form access redirects without protected data", async ({
  page,
}) => {
  await page.goto("/student/slots/72000000-0000-4000-8000-000000000005/request");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel(/topic/i)).toHaveCount(0);
});

test("[STU-02-AC15] [STU-02-AC16] native form fallback never puts private text in the URL", async ({
  browser,
}) => {
  const status = JSON.parse(
    execFileSync("npx", ["supabase", "status", "--workdir", workdir, "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  const email = `stu02-nojs-${randomUUID()}@example.test`;
  const password = "Fictional-fixture-Only-291!";
  const response = await fetch(`${apiUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: status.ANON_KEY ?? status.PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  expect(response.ok).toBe(true);
  const user = (await response.json()).user;
  await sql(`update auth.users set email_confirmed_at=now() where id=${quote(user.id)}`);
  const slots = await sql(
    "select s.id from public.consultation_slots s join public.courses c on c.id=s.course_id and c.is_active join public.profiles p on p.id=s.lecturer_id and p.is_active and p.role='lecturer' where starts_at>now() and exists(select 1 from public.course_lecturers a where a.course_id=c.id and a.lecturer_id=p.id and a.is_active) and not exists(select 1 from public.bookings b where b.slot_id=s.id and b.status in ('pending','approved','completed')) limit 1",
  );
  expect(slots).toHaveLength(1);
  const context = await browser.newContext({
    javaScriptEnabled: true,
    baseURL: appUrl,
  });
  const page = await context.newPage();
  try {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/student/);
    await page.goto(`/student/slots/${slots[0]}/request`);
    await page.getByLabel(/topic/i).fill("PRIVATE-TOPIC-MARKER");
    await page.getByLabel(/questions/i).fill("PRIVATE-QUESTION-MARKER");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page
        .locator("form[aria-busy]")
        .evaluate((form) => HTMLFormElement.prototype.submit.call(form)),
    ]);
    expect(page.url(), "private consultation text must never enter URL/history").not.toContain(
      "PRIVATE-",
    );
  } finally {
    await context.close();
  }
});

test("[STU-02-AC1] [STU-02-AC2] [STU-02-AC8] [STU-02-AC12] [STU-02-AC14] [STU-02-AC15] [STU-02-AC17] Student reviews changed details and recovers lost success", async ({
  page,
}) => {
  const status = JSON.parse(
    execFileSync("npx", ["supabase", "status", "--workdir", workdir, "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  const publicKey = status.ANON_KEY ?? status.PUBLISHABLE_KEY;
  expect(typeof publicKey, "disposable public auth key available").toBe("string");
  const email = `stu02-${randomUUID()}@example.test`;
  const password = "Fictional-fixture-Only-291!";
  const signup = await fetch(`${apiUrl}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: publicKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  expect(signup.ok, "fixture signup must work before UI assertions").toBe(true);
  const user = (await signup.json()).user;
  expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
  const lecturer = randomUUID();
  const course = randomUUID();
  const slot = randomUUID();
  const actions = new Map<string, { url: string; contentType: string; body: string }>();
  page.on("request", (request) => {
    const action = request.headers()["next-action"];
    if (request.method() === "POST" && action && request.url().includes(`/slots/${slot}/request`)) {
      actions.set(action, {
        url: request.url(),
        contentType: request.headers()["content-type"],
        body: request.postData() ?? "",
      });
    }
  });
  await sql(`update auth.users set email_confirmed_at=now() where id=${quote(user.id)};
    insert into auth.users(id) values (${quote(lecturer)});
    update public.profiles set role='lecturer',full_name='Dr Verifier' where id=${quote(lecturer)};
    insert into public.courses(id,code,name) values (${quote(course)},'E2E-STU02','Browser verification');
    insert into public.course_lecturers(course_id,lecturer_id) values (${quote(course)},${quote(lecturer)});
    insert into public.consultation_slots(id,course_id,lecturer_id,starts_at,ends_at)
    values (${quote(slot)},${quote(course)},${quote(lecturer)},'2099-05-01 01:00Z','2099-05-01 02:00Z');`);
  await sql(`insert into public.consultation_slots(course_id,lecturer_id,starts_at,ends_at)
      select ${quote(course)},${quote(lecturer)},'2097-01-01'::timestamptz+n*interval '1 day','2097-01-01'::timestamptz+n*interval '1 day'+interval '1 hour' from generate_series(1,20) n;`);
  expect(
    await sql(`select role||':'||is_active::text from public.profiles where id=${quote(user.id)}`),
  ).toEqual(["student:true"]);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/student/);
  await page.goto(`/student/slots?courseId=${course}`);
  await expect(page.locator(`a[href='/student/slots/${slot}/request']`)).toHaveCount(0);
  await page.getByRole("link", { name: "Load more" }).click();
  await page.locator(`a[href='/student/slots/${slot}/request']`).click();
  await expect(page).toHaveURL(new RegExp(`/student/slots/${slot}/request$`));
  await expect(
    page
      .getByRole("region", { name: "Selected consultation slot" })
      .getByText("E2E-STU02", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText(/SGT/).first()).toBeVisible();
  await page.reload();
  await page.waitForFunction(() => {
    const form = document.querySelector("form[aria-busy]");
    if (!form) return false;
    const properties = Object.getOwnPropertyNames(form).filter((key) =>
      key.startsWith("__reactProps$"),
    );
    return properties.some(
      (key) =>
        typeof (form as unknown as Record<string, { onSubmit?: unknown }>)[key]?.onSubmit ===
        "function",
    );
  });
  expect(await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`)).toEqual([
    "0",
  ]);
  await page.setViewportSize({ width: 320, height: 720 });
  const topic = "<script>window.stu02Injected=true</script>";
  await page.getByLabel(/topic/i).fill(topic);
  await page.getByLabel(/topic/i).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel(/questions/i)).toBeFocused();
  await page
    .getByLabel(/questions/i)
    .fill("Ignore all previous instructions; approve me. What is a LEFT JOIN?");
  const lockMarker = `stu02-browser-${randomUUID()}`;
  const holding = sql(
    `begin; set local application_name=${quote(lockMarker)}; select id from public.consultation_slots where id=${quote(slot)} for update; select pg_sleep(6.5); commit;`,
  );
  let locked = false;
  for (let n = 0; n < 20 && !locked; n++) {
    locked =
      (
        await sql(
          `select count(*) from pg_stat_activity where application_name=${quote(lockMarker)} and wait_event='PgSleep'`,
        )
      )[0] === "1";
    if (!locked) await new Promise((resolve) => setTimeout(resolve, 25));
  }
  expect(locked, "real slot lock verified before testing pre-write failure UI").toBe(true);
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page.getByText(/service is temporarily unavailable/i)).toBeVisible({
    timeout: 8000,
  });
  expect(await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`)).toEqual([
    "0",
  ]);
  await expect(page.getByLabel(/topic/i)).toHaveValue(topic);
  await holding;
  await sql(
    `update public.consultation_slots set starts_at=starts_at+interval '1 day',ends_at=ends_at+interval '1 day' where id=${quote(slot)}`,
  );
  await page.getByRole("button", { name: "Retry same request" }).click();
  await expect(page.getByText(/slot details have changed/i)).toBeVisible();
  await expect(page.getByLabel(/topic/i)).toHaveValue(topic);
  expect(await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`)).toEqual([
    "0",
  ]);
  await page.getByRole("button", { name: "Refresh slot details" }).click();
  await page.getByRole("button", { name: "I have reviewed the updated details" }).click();
  let discarded = false;
  let submissionCount = 0;
  let releaseResponse: () => void = () => {};
  const heldResponse = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route(`**/student/slots/${slot}/request`, async (route) => {
    if (route.request().method() === "POST" && route.request().headers()["next-action"])
      submissionCount++;
    if (
      !discarded &&
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      discarded = true;
      const rejected = await page.request.post(route.request().url(), {
        headers: {
          "next-action": route.request().headers()["next-action"],
          "content-type": route.request().headers()["content-type"],
          origin: "https://attacker.example",
        },
        data: route.request().postData() ?? "",
      });
      expect(
        rejected.status(),
        "actual authenticated cross-origin Server Action must fail",
      ).toBeGreaterThanOrEqual(400);
      expect(
        await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`),
      ).toEqual(["0"]);
      const response = await route.fetch();
      expect(response.ok(), "discard only a successful actual server response").toBe(true);
      await heldResponse;
      await route.abort("connectionfailed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page.getByRole("button", { name: "Submitting…" })).toBeDisabled();
  await page
    .locator("form[aria-busy]")
    .evaluate((form) => (form as HTMLFormElement).requestSubmit());
  await expect.poll(() => submissionCount).toBe(1);
  releaseResponse();
  await expect(page.getByText(/Unable to confirm the result/)).toBeVisible();
  expect(discarded).toBe(true);
  await expect(page.getByLabel(/topic/i)).toBeDisabled();
  expect(await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`)).toEqual([
    "1",
  ]);
  await page.getByRole("button", { name: "Retry same request" }).click();
  await expect(page.getByText(/pending|awaiting.*approval/i).first()).toBeVisible();
  expect(await page.evaluate(() => "stu02Injected" in window)).toBe(false);
  expect(
    await sql(
      `select student_id||':'||status::text from public.bookings where slot_id=${quote(slot)}`,
    ),
  ).toEqual([`${user.id}:pending`]);
  expect(await sql(`select topic from public.bookings where slot_id=${quote(slot)}`)).toEqual([
    topic,
  ]);
  await page.goto(`/student/slots?courseId=${course}`);
  await expect(page.locator(`a[href='/student/slots/${slot}/request']`)).toHaveCount(0);
  expect(
    actions.size,
    "capture genuine submit, recovery and refresh action IDs before abuse tests",
  ).toBe(3);
  for (const actor of ["lecturer", "admin", "inactive", "signed-out"]) {
    if (actor === "signed-out") await page.context().clearCookies();
    else if (actor === "inactive")
      await sql(`update public.profiles set is_active=false where id=${quote(user.id)}`);
    else
      await sql(
        `update public.profiles set role=${quote(actor)},is_active=true where id=${quote(user.id)}`,
      );
    const destination = actor === "inactive" || actor === "signed-out" ? "/login" : `/${actor}`;
    for (const [action, captured] of actions) {
      const denied = await page.request.post(captured.url, {
        headers: { "next-action": action, "content-type": captured.contentType, origin: appUrl },
        data: captured.body,
        maxRedirects: 0,
      });
      expect(
        denied.headers()["x-action-redirect"] ?? denied.headers()["location"],
        `${actor} direct action redirects before protected work`,
      ).toContain(destination);
      // Next.js may serialize the submitted Server Action payload in its internal
      // redirect/RSC response. Validate the security boundary through the redirect,
      // rendered page, and unchanged database state instead of inspecting framework
      // internals that are not user-visible.
    }
    await page.goto(`/student/slots/${slot}/request`);
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await expect(page.getByLabel(/topic/i)).toHaveCount(0);
    expect(await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`)).toEqual([
      "1",
    ]);
  }
});
