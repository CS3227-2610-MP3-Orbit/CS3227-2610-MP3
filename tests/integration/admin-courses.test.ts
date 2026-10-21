// ADM-02 real-Postgres/real-Auth verification. Runs against whatever local Supabase instance
// is already up (`npx supabase status -o json` supplies the target; no .env file is read, no
// key is ever printed). Fixtures are additive and cleaned up in afterAll, same convention as
// tests/integration/admin-accounts.test.ts (not a disposable "stu02-"-prefixed stack: these
// writes never race another concurrent session the way STU-02's booking tests do).
//
// Design note (why this can import src/features/admin/courses/server.ts directly): every
// exported function there calls requireRole("admin") first, which depends on next/headers'
// cookies() via @/lib/supabase/server's createClient(). That one call is mocked here to return
// a REAL, already-signed-in supabase-js client for whichever fixture user a given test acts as
// -- everything downstream of it (requireRole's own is_active/role re-check, every RPC) is the
// real local Postgres/GoTrue, not a double.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));

import {
  assignLecturer,
  createCourse,
  listCourses,
  removeAssignment,
  setCourseActive,
  updateCourse,
} from "@/features/admin/courses/server";

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

async function createFixtureUser(role: "student" | "lecturer" | "admin", active = true) {
  const email = `adm02-${randomUUID()}@example.test`;
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password: fixturePassword,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("fixture user creation failed");
  createdUserIds.push(data.user.id);
  if (role !== "student" || !active) {
    const { error: profileError } = await serviceClient
      .from("profiles")
      .update({ role, is_active: active })
      .eq("id", data.user.id);
    if (profileError) throw profileError;
  }
  return { id: data.user.id, email, password: fixturePassword };
}

async function createFixtureCourse(code: string, isActive = true) {
  const { data, error } = await serviceClient
    .from("courses")
    .insert({ code, name: `ADM-02 fixture ${code}`, is_active: isActive })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("fixture course creation failed");
  createdCourseIds.push(data.id);
  return { id: data.id as string, code };
}

async function countAiUsage(): Promise<number> {
  const { count, error } = await serviceClient
    .from("ai_usage")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
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
  serviceClient = createSupabaseClient(apiUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
});

afterAll(async () => {
  if (createdCourseIds.length > 0) {
    await serviceClient.from("course_lecturers").delete().in("course_id", createdCourseIds);
    await serviceClient.from("courses").delete().in("id", createdCourseIds);
  }
  for (const id of createdUserIds) {
    await serviceClient.auth.admin.deleteUser(id).catch(() => {});
  }
});

describe("ADM-02 admin courses: real Postgres + real Auth", () => {
  let admin: { id: string; email: string; password: string };

  beforeEach(async () => {
    admin = await createFixtureUser("admin");
    mocks.client.mockResolvedValue(await signedInActor(admin.email, admin.password));
  });

  it("[ADM-02-AC1] creating a course stores exactly one row with the normalized code and isActive true", async () => {
    const code = `adm02-${randomUUID().slice(0, 8)}`;
    const result = await createCourse({ code, name: "  Software Engineering  " });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("fixture creation must succeed");
    createdCourseIds.push(result.courseId);
    expect(result).toMatchObject({
      code: code.toUpperCase(),
      name: "Software Engineering",
      isActive: true,
    });
    const rows = await serviceClient
      .from("courses")
      .select("id, code, is_active")
      .eq("id", result.courseId);
    expect(rows.data).toHaveLength(1);
    expect(rows.data?.[0]).toMatchObject({ code: code.toUpperCase(), is_active: true });
  });

  it("[ADM-02-AC2] a duplicate normalized code is refused against both an active and an inactive course", async () => {
    const code = `adm02-${randomUUID().slice(0, 8)}`;
    const active = await createFixtureCourse(code.toUpperCase(), true);
    const dup1 = await createCourse({ code: `  ${code}  `, name: "Second attempt" });
    expect(dup1).toEqual({ kind: "conflict_duplicate_code" });

    const inactiveCode = `adm02-${randomUUID().slice(0, 8)}`;
    await createFixtureCourse(inactiveCode.toUpperCase(), false);
    const dup2 = await createCourse({ code: inactiveCode, name: "Third attempt" });
    expect(dup2).toEqual({ kind: "conflict_duplicate_code" });

    const count = await serviceClient
      .from("courses")
      .select("id", { count: "exact", head: true })
      .ilike("code", active.code);
    expect(count.count).toBe(1);
  });

  it("[ADM-02-AC4] editing a course's code and name updates the stored row", async () => {
    const created = await createCourse({
      code: `adm02-${randomUUID().slice(0, 8)}`,
      name: "Original Name",
    });
    expect(created.kind).toBe("success");
    if (created.kind !== "success") throw new Error("fixture creation must succeed");
    createdCourseIds.push(created.courseId);

    const newCode = `adm02-${randomUUID().slice(0, 8)}`;
    const updated = await updateCourse({
      courseId: created.courseId,
      code: newCode,
      name: "Updated Name",
    });
    expect(updated).toEqual({
      kind: "success",
      courseId: created.courseId,
      code: newCode.toUpperCase(),
      name: "Updated Name",
      isActive: true,
    });
    const row = await serviceClient
      .from("courses")
      .select("code, name")
      .eq("id", created.courseId)
      .single();
    expect(row.data).toMatchObject({ code: newCode.toUpperCase(), name: "Updated Name" });
  });

  it("[ADM-02-AC6] [ADM-02-AC7] deactivating then reactivating a course preserves the row and flips isActive", async () => {
    const course = await createFixtureCourse(`adm02-${randomUUID().slice(0, 8)}`.toUpperCase());

    const deactivated = await setCourseActive({ courseId: course.id, isActive: false });
    expect(deactivated).toEqual({ kind: "success", courseId: course.id, isActive: false });
    const afterDeactivate = await serviceClient
      .from("courses")
      .select("id, code, is_active")
      .eq("id", course.id)
      .single();
    expect(afterDeactivate.data).toMatchObject({ code: course.code, is_active: false });

    const reactivated = await setCourseActive({ courseId: course.id, isActive: true });
    expect(reactivated).toEqual({ kind: "success", courseId: course.id, isActive: true });
    const afterReactivate = await serviceClient
      .from("courses")
      .select("id, code, is_active")
      .eq("id", course.id)
      .single();
    expect(afterReactivate.data).toMatchObject({ code: course.code, is_active: true });
  });

  it("[ADM-02-AC5] editing to another course's normalized code is refused; neither row changes", async () => {
    const codeA = `adm02-${randomUUID().slice(0, 8)}`;
    const codeB = `adm02-${randomUUID().slice(0, 8)}`;
    const courseA = await createFixtureCourse(codeA.toUpperCase());
    const courseB = await createFixtureCourse(codeB.toUpperCase());

    const result = await updateCourse({ courseId: courseA.id, code: codeB, name: "Renamed" });
    expect(result).toEqual({ kind: "conflict_duplicate_code" });

    const rows = await serviceClient
      .from("courses")
      .select("id, code, name")
      .in("id", [courseA.id, courseB.id]);
    const byId = new Map(rows.data?.map((row) => [row.id, row]));
    expect(byId.get(courseA.id)).toMatchObject({ code: codeA.toUpperCase() });
    expect(byId.get(courseB.id)).toMatchObject({ code: codeB.toUpperCase() });
  });

  it("[ADM-02-AC8] assigning an active lecturer to an active course creates exactly one active row", async () => {
    const course = await createFixtureCourse(`adm02-${randomUUID().slice(0, 8)}`.toUpperCase());
    const lecturer = await createFixtureUser("lecturer");

    const result = await assignLecturer({ courseId: course.id, lecturerId: lecturer.id });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("assignment must succeed");

    const rows = await serviceClient
      .from("course_lecturers")
      .select("id, is_active")
      .eq("course_id", course.id)
      .eq("lecturer_id", lecturer.id);
    expect(rows.data).toHaveLength(1);
    expect(rows.data?.[0]).toMatchObject({ is_active: true });
  });

  it("[ADM-02-AC9] assigning to an inactive course is refused and creates no row", async () => {
    const course = await createFixtureCourse(
      `adm02-${randomUUID().slice(0, 8)}`.toUpperCase(),
      false,
    );
    const lecturer = await createFixtureUser("lecturer");

    const result = await assignLecturer({ courseId: course.id, lecturerId: lecturer.id });
    expect(result).toEqual({ kind: "course_inactive" });

    const rows = await serviceClient
      .from("course_lecturers")
      .select("id")
      .eq("course_id", course.id);
    expect(rows.data).toHaveLength(0);
  });

  it("[ADM-02-AC10] assigning a deactivated lecturer or a student-role account is each refused", async () => {
    const course = await createFixtureCourse(`adm02-${randomUUID().slice(0, 8)}`.toUpperCase());
    const deactivatedLecturer = await createFixtureUser("lecturer", false);
    const student = await createFixtureUser("student");

    const first = await assignLecturer({ courseId: course.id, lecturerId: deactivatedLecturer.id });
    expect(first).toEqual({ kind: "lecturer_inactive" });

    const second = await assignLecturer({ courseId: course.id, lecturerId: student.id });
    expect(second).toEqual({ kind: "lecturer_wrong_role" });

    const rows = await serviceClient
      .from("course_lecturers")
      .select("id")
      .eq("course_id", course.id);
    expect(rows.data).toHaveLength(0);
  });

  it("[ADM-02-AC12] removing an assignment ends it while preserving every other row", async () => {
    const course = await createFixtureCourse(`adm02-${randomUUID().slice(0, 8)}`.toUpperCase());
    const lecturer = await createFixtureUser("lecturer");
    const assigned = await assignLecturer({ courseId: course.id, lecturerId: lecturer.id });
    expect(assigned.kind).toBe("success");
    if (assigned.kind !== "success") throw new Error("fixture assignment must succeed");

    const result = await removeAssignment({ assignmentId: assigned.assignmentId });
    expect(result).toEqual({ kind: "success", assignmentId: assigned.assignmentId });

    const row = await serviceClient
      .from("course_lecturers")
      .select("is_active, ended_at")
      .eq("id", assigned.assignmentId)
      .single();
    expect(row.data?.is_active).toBe(false);
    expect(row.data?.ended_at).not.toBeNull();
  });

  it("[ADM-02-AC14] list/search/filter returns only allowlisted fields and exactly the active lecturers", async () => {
    const code = `adm02-${randomUUID().slice(0, 8)}`;
    const course = await createFixtureCourse(code.toUpperCase());
    const lecturer = await createFixtureUser("lecturer");
    const assigned = await assignLecturer({ courseId: course.id, lecturerId: lecturer.id });
    expect(assigned.kind).toBe("success");

    const found = await listCourses({ query: code });
    expect(found.kind).toBe("success");
    if (found.kind !== "success") throw new Error("list must succeed");
    expect(found.courses).toHaveLength(1);
    expect(typeof found.courses[0]?.createdAt).toBe("string");
    expect(found.courses[0]).toMatchObject({
      id: course.id,
      code: code.toUpperCase(),
      name: `ADM-02 fixture ${code.toUpperCase()}`,
      isActive: true,
      lecturers: [
        {
          assignmentId: (assigned as { assignmentId: string }).assignmentId,
          lecturerId: lecturer.id,
          lecturerName: "",
        },
      ],
    });
    expect(Object.keys(found.courses[0] ?? {}).sort()).toEqual(
      ["code", "createdAt", "id", "isActive", "lecturers", "name"].sort(),
    );
  });

  it("[ADM-02-AC15] a non-admin or signed-out caller cannot call any course/assignment action directly", async () => {
    const lecturer = await createFixtureUser("lecturer");
    const student = await createFixtureUser("student");
    const course = await createFixtureCourse(`adm02-${randomUUID().slice(0, 8)}`.toUpperCase());

    mocks.client.mockResolvedValue(await signedInActor(lecturer.email, lecturer.password));
    await expect(createCourse({ code: "ADM02X", name: "Should never exist" })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    mocks.client.mockResolvedValue(await signedInActor(student.email, student.password));
    await expect(assignLecturer({ courseId: course.id, lecturerId: student.id })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    mocks.client.mockResolvedValue(freshClient()); // never signed in
    await expect(listCourses({})).rejects.toThrow("NEXT_REDIRECT");

    const rows = await serviceClient.from("courses").select("id").ilike("code", "ADM02X");
    expect(rows.data).toHaveLength(0);
  });

  it("[ADM-02-AC16] a real successful course mutation leaves ai_usage unchanged", async () => {
    const before = await countAiUsage();
    const result = await createCourse({
      code: `adm02-${randomUUID().slice(0, 8)}`,
      name: "No AI Course",
    });
    expect(result.kind).toBe("success");
    if (result.kind === "success") createdCourseIds.push(result.courseId);
    expect(await countAiUsage()).toBe(before);
  });
});
