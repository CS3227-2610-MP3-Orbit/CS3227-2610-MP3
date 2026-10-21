// ADM-04 real-Postgres/real-Auth verification. Runs against whatever local Supabase instance is
// already up (`npx supabase status -o json` supplies the target; no .env file is read, no key
// is ever printed). Fixtures are additive and cleaned up in afterAll/inline, same convention as
// tests/integration/admin-courses.test.ts (not a disposable "stu02-"-prefixed stack: these
// writes never race another concurrent session the way STU-02's booking tests do).
//
// "openai" is mocked at the module boundary (never a real provider call/key) so the two tests
// that exercise generateActivitySummary can still go through the REAL claim_ai_attempt/
// resolve_ai_attempt RPCs against local Postgres -- the only way to honestly verify ADM-04-AC10/
// AC11's "no row other than two ai_usage rows" against a real database. SOCLAAS_* env vars below
// are fixture placeholder strings local to this test process, never read from a .env file.
//
// Design note (why this can import src/features/admin/reports/server.ts directly): every
// exported function there calls requireRole("admin") first, which depends on next/headers'
// cookies() via @/lib/supabase/server's createClient(). That one call is mocked here to return a
// REAL, already-signed-in supabase-js client for whichever fixture user a given test acts as --
// everything downstream of it (requireRole's own is_active/role re-check, every RPC) is the real
// local Postgres/GoTrue, not a double.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: vi.fn(), openaiCreate: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("openai", () => ({
  default: class OpenAI {
    chat = { completions: { create: mocks.openaiCreate } };
  },
  APIConnectionTimeoutError: class APIConnectionTimeoutError extends Error {},
  RateLimitError: class RateLimitError extends Error {},
}));

import { generateActivitySummary, getBookingReport } from "@/features/admin/reports/server";

let apiUrl: string;
let publishableKey: string;
let serviceClient: SupabaseClient;
const createdUserIds: string[] = [];
const createdCourseIds: string[] = [];
const fixturePassword = "Fictional-Fixture-Only-391!";

function freshClient() {
  return createSupabaseClient(apiUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signedInActor(email: string, password: string): Promise<SupabaseClient> {
  const client = freshClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function createFixtureUser(
  role: "student" | "lecturer" | "admin",
  fullName = "",
): Promise<{ id: string; email: string; password: string }> {
  const email = `adm04-${randomUUID()}@example.test`;
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password: fixturePassword,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("fixture user creation failed");
  createdUserIds.push(data.user.id);
  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ role, full_name: fullName })
    .eq("id", data.user.id);
  if (profileError) throw profileError;
  return { id: data.user.id, email, password: fixturePassword };
}

async function createFixtureCourse(code: string, name: string): Promise<string> {
  const { data, error } = await serviceClient
    .from("courses")
    .insert({ code, name, is_active: true })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("fixture course creation failed");
  createdCourseIds.push(data.id as string);
  return data.id as string;
}

async function createFixtureSlot(
  courseId: string,
  lecturerId: string,
  startsAtIso: string,
): Promise<string> {
  const { data, error } = await serviceClient
    .from("consultation_slots")
    .insert({
      course_id: courseId,
      lecturer_id: lecturerId,
      starts_at: startsAtIso,
      ends_at: new Date(new Date(startsAtIso).getTime() + 3_600_000).toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("fixture slot creation failed");
  return data.id as string;
}

async function createFixtureBooking(
  slotId: string,
  studentId: string,
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed",
  extra: Record<string, unknown> = {},
): Promise<string> {
  const { data, error } = await serviceClient
    .from("bookings")
    .insert({
      slot_id: slotId,
      student_id: studentId,
      status,
      topic: "ADM-04 fixture topic",
      questions: "ADM-04 fixture questions",
      rejection_reason: status === "rejected" ? "ADM-04 fixture rejection reason" : null,
      ...extra,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("fixture booking creation failed");
  return data.id as string;
}

async function countAiUsageFor(userId: string): Promise<number> {
  const { count, error } = await serviceClient
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

async function deleteBookings(ids: string[]) {
  if (ids.length > 0) await serviceClient.from("bookings").delete().in("id", ids);
}
async function deleteSlots(ids: string[]) {
  if (ids.length > 0) await serviceClient.from("consultation_slots").delete().in("id", ids);
}

beforeAll(() => {
  const status = JSON.parse(
    execFileSync("npx", ["supabase", "status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  apiUrl = status.API_URL;
  publishableKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
  const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
  if (!apiUrl || !publishableKey || !secretKey) {
    throw new Error("local Supabase status did not return the expected URL/keys");
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = apiUrl;
  process.env.SUPABASE_SECRET_KEY = secretKey;
  // Fixture-only placeholders for this process: never read from a .env file, never a real
  // provider credential. They only need to be *present* for the local not_configured guard;
  // "openai" itself is mocked above, so no network call is ever attempted.
  process.env.SOCLAAS_BASE_URL = "https://fixture.invalid/adm04";
  process.env.SOCLAAS_API_KEY = "fixture-not-a-real-key";
  process.env.SOCLAAS_MODEL = "fixture-model";
  serviceClient = createSupabaseClient(apiUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
});

afterAll(async () => {
  if (createdCourseIds.length > 0) {
    await serviceClient.from("courses").delete().in("id", createdCourseIds);
  }
  for (const id of createdUserIds) {
    await serviceClient.auth.admin.deleteUser(id).catch(() => {});
  }
  delete process.env.SOCLAAS_BASE_URL;
  delete process.env.SOCLAAS_API_KEY;
  delete process.env.SOCLAAS_MODEL;
});

describe("ADM-04 admin booking report: real Postgres + real Auth", () => {
  let admin: { id: string; email: string; password: string };

  beforeEach(async () => {
    vi.clearAllMocks();
    admin = await createFixtureUser("admin");
    mocks.client.mockResolvedValue(await signedInActor(admin.email, admin.password));
  });

  it("[ADM-04-AC1] 92 days is accepted, 93 days and end < start are refused, before any data is returned", async () => {
    const ok = await getBookingReport({ startDate: "2026-01-01", endDate: "2026-04-02" }); // 92 days
    expect(ok.kind).toBe("success");

    const tooLong = await getBookingReport({ startDate: "2026-01-01", endDate: "2026-04-03" }); // 93 days
    expect(tooLong).toEqual({ kind: "validation_error", field: "range" });

    const reversed = await getBookingReport({ startDate: "2026-04-02", endDate: "2026-01-01" });
    expect(reversed).toEqual({ kind: "validation_error", field: "range" });
  });

  it("[ADM-04-AC2] a zero-booking period returns all-zero counts, not an error", async () => {
    const result = await getBookingReport({ startDate: "2020-01-01", endDate: "2020-01-03" });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("must succeed");
    expect(result.totalBookings).toBe(0);
    expect(result.byStatus).toEqual([
      { status: "pending", count: 0 },
      { status: "approved", count: 0 },
      { status: "rejected", count: 0 },
      { status: "cancelled", count: 0 },
      { status: "completed", count: 0 },
    ]);
    expect(result.byCourse).toEqual([]);
    expect(result.byLecturer).toEqual([]);
    expect(result.byDay).toEqual([
      { date: "2020-01-01", count: 0 },
      { date: "2020-01-02", count: 0 },
      { date: "2020-01-03", count: 0 },
    ]);
  });

  it("[ADM-04-AC2] [ADM-04-AC3] [ADM-04-AC4] seeded bookings across statuses/courses/lecturers/days produce exact, zero-filled, minimized counts", async () => {
    const lecturerA = await createFixtureUser("lecturer", "ADM-04 Lecturer A");
    const lecturerB = await createFixtureUser("lecturer", "ADM-04 Lecturer B");
    const student = await createFixtureUser("student", "ADM-04-SECRET-STUDENT-NAME");
    const courseA = await createFixtureCourse(`A04${randomUUID().slice(0, 6)}`, "ADM-04 Course A");
    const courseB = await createFixtureCourse(`B04${randomUUID().slice(0, 6)}`, "ADM-04 Course B");

    // Fixed window, far from "today" so this test never collides with another test's data.
    const day0 = "2030-05-10";
    const day1 = "2030-05-11";
    const day2 = "2030-05-12";
    const day3 = "2030-05-13"; // deliberately left empty, to prove zero-fill

    const slotIds: string[] = [];
    const bookingIds: string[] = [];
    try {
      const slotA1 = await createFixtureSlot(courseA, lecturerA.id, `${day0}T01:00:00Z`);
      const slotA2 = await createFixtureSlot(courseA, lecturerA.id, `${day0}T02:00:00Z`);
      const slotB1 = await createFixtureSlot(courseB, lecturerB.id, `${day1}T01:00:00Z`);
      const slotA3 = await createFixtureSlot(courseA, lecturerA.id, `${day1}T02:00:00Z`);
      const slotB2 = await createFixtureSlot(courseB, lecturerB.id, `${day2}T01:00:00Z`);
      slotIds.push(slotA1, slotA2, slotB1, slotA3, slotB2);

      bookingIds.push(
        await createFixtureBooking(slotA1, student.id, "pending"),
        await createFixtureBooking(slotA2, student.id, "approved"),
        await createFixtureBooking(slotB1, student.id, "completed"),
        await createFixtureBooking(slotA3, student.id, "rejected"),
        await createFixtureBooking(slotB2, student.id, "cancelled"),
      );

      const result = await getBookingReport({ startDate: day0, endDate: day3 });
      expect(result.kind).toBe("success");
      if (result.kind !== "success") throw new Error("must succeed");

      expect(result.totalBookings).toBe(5);
      expect(result.byStatus).toEqual([
        { status: "pending", count: 1 },
        { status: "approved", count: 1 },
        { status: "rejected", count: 1 },
        { status: "cancelled", count: 1 },
        { status: "completed", count: 1 },
      ]);
      expect(result.byStatus.reduce((total, row) => total + row.count, 0)).toBe(
        result.totalBookings,
      );

      // RPC orders byCourse/byLecturer by code/name ascending; "A04..." < "B04..." and
      // "ADM-04 Lecturer A" < "ADM-04 Lecturer B" lexicographically, so course/lecturer A sorts
      // first deterministically -- no re-sort needed here.
      expect(result.byCourse).toEqual([
        {
          courseId: courseA,
          code: expect.stringContaining("A04"),
          name: "ADM-04 Course A",
          count: 3,
        },
        {
          courseId: courseB,
          code: expect.stringContaining("B04"),
          name: "ADM-04 Course B",
          count: 2,
        },
      ]);
      expect(result.byLecturer).toEqual([
        { lecturerId: lecturerA.id, lecturerName: "ADM-04 Lecturer A", count: 3 },
        { lecturerId: lecturerB.id, lecturerName: "ADM-04 Lecturer B", count: 2 },
      ]);
      expect(result.byDay).toEqual([
        { date: day0, count: 2 },
        { date: day1, count: 2 },
        { date: day2, count: 1 },
        { date: day3, count: 0 },
      ]);

      // [ADM-04-AC4] never a student id/name/topic/questions/rejection_reason.
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain(student.id);
      expect(serialized).not.toContain("ADM-04-SECRET-STUDENT-NAME");
      expect(serialized).not.toContain("ADM-04 fixture topic");
      expect(serialized).not.toContain("ADM-04 fixture questions");
      expect(serialized).not.toContain("ADM-04 fixture rejection reason");
    } finally {
      await deleteBookings(bookingIds);
      await deleteSlots(slotIds);
    }
  });

  it("[ADM-04-AC3] a booking is counted by its slot's starts_at SGT day, not the booking's own created_at", async () => {
    const lecturer = await createFixtureUser("lecturer", "ADM-04 AC3 Lecturer");
    const student = await createFixtureUser("student");
    const course = await createFixtureCourse(`C04${randomUUID().slice(0, 6)}`, "ADM-04 AC3 Course");

    const slotDay = "2031-06-15"; // the slot's own starts_at day
    const createdDay = "2031-07-20"; // a different day, used only for created_at

    const slotIds: string[] = [];
    const bookingIds: string[] = [];
    try {
      const slotId = await createFixtureSlot(course, lecturer.id, `${slotDay}T01:00:00Z`);
      slotIds.push(slotId);
      const bookingId = await createFixtureBooking(slotId, student.id, "approved", {
        created_at: `${createdDay}T01:00:00Z`,
      });
      bookingIds.push(bookingId);

      const bySlotDay = await getBookingReport({ startDate: slotDay, endDate: slotDay });
      expect(bySlotDay.kind).toBe("success");
      if (bySlotDay.kind === "success") expect(bySlotDay.totalBookings).toBe(1);

      const byCreatedDay = await getBookingReport({ startDate: createdDay, endDate: createdDay });
      expect(byCreatedDay.kind).toBe("success");
      if (byCreatedDay.kind === "success") expect(byCreatedDay.totalBookings).toBe(0);
    } finally {
      await deleteBookings(bookingIds);
      await deleteSlots(slotIds);
    }
  });

  it("[ADM-04-AC5] a signed-out, Student, or Lecturer caller is refused, both through the action and a direct RPC call", async () => {
    const lecturer = await createFixtureUser("lecturer");
    const student = await createFixtureUser("student");

    mocks.client.mockResolvedValue(await signedInActor(lecturer.email, lecturer.password));
    await expect(
      getBookingReport({ startDate: "2026-01-01", endDate: "2026-01-02" }),
    ).rejects.toThrow("NEXT_REDIRECT");

    mocks.client.mockResolvedValue(await signedInActor(student.email, student.password));
    await expect(
      getBookingReport({ startDate: "2026-01-01", endDate: "2026-01-02" }),
    ).rejects.toThrow("NEXT_REDIRECT");

    mocks.client.mockResolvedValue(freshClient()); // never signed in
    await expect(
      getBookingReport({ startDate: "2026-01-01", endDate: "2026-01-02" }),
    ).rejects.toThrow("NEXT_REDIRECT");

    // Direct RPC bypass: an authenticated-but-non-admin session still carries the execute grant
    // (grant execute ... to authenticated), so the function's own current_app_role() check, not
    // the database grant, must be what refuses it.
    const lecturerClient = await signedInActor(lecturer.email, lecturer.password);
    const direct = await lecturerClient.rpc("admin_get_booking_report", {
      p_start_date: "2026-01-01",
      p_end_date: "2026-01-02",
    });
    expect(direct.error).toBeNull();
    expect(direct.data).toEqual({ kind: "forbidden_or_not_found" });

    const anonDirect = await freshClient().rpc("admin_get_booking_report", {
      p_start_date: "2026-01-01",
      p_end_date: "2026-01-02",
    });
    expect(anonDirect.error).not.toBeNull();
  });

  it("[ADM-04-AC14] exercising only the report path leaves zero new ai_usage rows", async () => {
    const before = await countAiUsageFor(admin.id);
    await getBookingReport({ startDate: "2026-01-01", endDate: "2026-01-02" });
    await getBookingReport({ startDate: "2026-02-01", endDate: "2026-02-05" });
    expect(await countAiUsageFor(admin.id)).toBe(before);
  });

  it("[ADM-04-AC10] [ADM-04-AC11] two real summary generations write exactly two ai_usage rows and change nothing else", async () => {
    const lecturer = await createFixtureUser("lecturer", "ADM-04 AC10 Lecturer");
    const student = await createFixtureUser("student");
    const course = await createFixtureCourse(
      `D04${randomUUID().slice(0, 6)}`,
      "ADM-04 AC10 Course",
    );
    const slotIds: string[] = [];
    const bookingIds: string[] = [];

    mocks.openaiCreate.mockResolvedValue({
      choices: [{ message: { content: "A fixture AI summary used only by this test." } }],
    });

    try {
      const slotId = await createFixtureSlot(course, lecturer.id, "2032-01-10T01:00:00Z");
      slotIds.push(slotId);
      bookingIds.push(await createFixtureBooking(slotId, student.id, "completed"));

      const period = { startDate: "2032-01-01", endDate: "2032-01-20" };
      const before = await countAiUsageFor(admin.id);

      const first = await generateActivitySummary(period);
      expect(first.kind).toBe("success");
      const second = await generateActivitySummary(period);
      expect(second.kind).toBe("success");

      const after = await countAiUsageFor(admin.id);
      expect(after - before).toBe(2);

      const usageRows = await serviceClient
        .from("ai_usage")
        .select("feature, state")
        .eq("user_id", admin.id);
      expect(usageRows.data?.every((row) => row.feature === "admin.activity-summary")).toBe(true);
      expect(usageRows.data?.every((row) => row.state === "succeeded")).toBe(true);

      // [ADM-04-AC11] no booking/slot/course/profile row was ever touched by the AI calls.
      const courseRow = await serviceClient.from("courses").select("*").eq("id", course).single();
      expect(courseRow.data).toMatchObject({ id: course, is_active: true });
      const slotRow = await serviceClient
        .from("consultation_slots")
        .select("*")
        .eq("id", slotId)
        .single();
      expect(slotRow.data).toMatchObject({
        id: slotId,
        course_id: course,
        lecturer_id: lecturer.id,
      });
      const bookingRow = await serviceClient
        .from("bookings")
        .select("status")
        .eq("id", bookingIds[0])
        .single();
      expect(bookingRow.data).toMatchObject({ status: "completed" });
    } finally {
      await deleteBookings(bookingIds);
      await deleteSlots(slotIds);
      // Clean up immediately: these two rows are real entries against the shared stack's daily
      // AI capacity, so this test must not leave them counted against today's quota.
      await serviceClient.from("ai_usage").delete().eq("user_id", admin.id);
    }
  });
});
