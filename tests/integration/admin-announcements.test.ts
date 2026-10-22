// ADM-03 real-Postgres/real-Auth verification. Runs against whatever local Supabase instance is
// already up (`npx supabase status -o json` supplies the target; no .env file is read, no key
// is ever printed). Fixtures are additive and cleaned up in afterAll, same convention as
// tests/integration/admin-courses.test.ts/admin-reports.test.ts.
//
// Design note (why this can import src/features/admin/announcements/server.ts and
// src/features/shared/announcements/server.ts directly): every exported function there calls
// requireRole("admin") or requireUser() first, which depends on next/headers' cookies() via
// @/lib/supabase/server's createClient(). That one call is mocked here to return a REAL,
// already-signed-in supabase-js client for whichever fixture user a given test acts as --
// everything downstream of it (requireRole's/requireUser's own is_active/role re-check, every
// RPC, every direct table read behind RLS) is the real local Postgres/GoTrue, not a double.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));

import {
  createAnnouncement,
  listAnnouncementsForAdmin,
  setAnnouncementPublished,
  updateAnnouncement,
} from "@/features/admin/announcements/server";
import { listPublishedAnnouncements } from "@/features/shared/announcements/server";

let apiUrl: string;
let publishableKey: string;
let serviceClient: SupabaseClient;
const createdUserIds: string[] = [];
const createdAnnouncementIds: string[] = [];
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
  const email = `adm03-${randomUUID()}@example.test`;
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

async function createFixtureAnnouncement(options: {
  kind: "guideline" | "announcement";
  title: string;
  body: string;
  isPublished: boolean;
  createdBy: string;
  createdAt?: string;
}) {
  const { data, error } = await serviceClient
    .from("announcements")
    .insert({
      kind: options.kind,
      title: options.title,
      body: options.body,
      is_published: options.isPublished,
      created_by: options.createdBy,
      updated_by: options.createdBy,
      ...(options.createdAt
        ? { created_at: options.createdAt, updated_at: options.createdAt }
        : {}),
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("fixture announcement creation failed");
  createdAnnouncementIds.push(data.id as string);
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
  if (createdAnnouncementIds.length > 0) {
    await serviceClient.from("announcements").delete().in("id", createdAnnouncementIds);
  }
  for (const id of createdUserIds) {
    await serviceClient.auth.admin.deleteUser(id).catch(() => {});
  }
});

describe("ADM-03 admin announcements: real Postgres + real Auth", () => {
  let admin: { id: string; email: string; password: string };

  beforeEach(async () => {
    admin = await createFixtureUser("admin");
    mocks.client.mockResolvedValue(await signedInActor(admin.email, admin.password));
  });

  it("[ADM-03-AC1] creating an item stores exactly one draft row with createdBy/updatedBy set to the admin's own id", async () => {
    const result = await createAnnouncement({
      kind: "guideline",
      title: `ADM-03 AC1 ${randomUUID().slice(0, 8)}`,
      body: "Consult before the deadline.",
    });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("fixture creation must succeed");
    createdAnnouncementIds.push(result.id);
    expect(result).toMatchObject({ announcementKind: "guideline", isPublished: false });

    const rows = await serviceClient
      .from("announcements")
      .select("id, created_by, updated_by, is_published")
      .eq("id", result.id);
    expect(rows.data).toHaveLength(1);
    expect(rows.data?.[0]).toMatchObject({
      created_by: admin.id,
      updated_by: admin.id,
      is_published: false,
    });
  });

  it("[ADM-03-AC3] editing kind/title/body updates the stored row; updatedBy is the editor and isPublished is unchanged", async () => {
    const id = await createFixtureAnnouncement({
      kind: "guideline",
      title: "Original title",
      body: "Original body.",
      isPublished: true,
      createdBy: admin.id,
    });
    const editor = await createFixtureUser("admin");
    mocks.client.mockResolvedValue(await signedInActor(editor.email, editor.password));

    const result = await updateAnnouncement({
      id,
      kind: "announcement",
      title: "Updated title",
      body: "Updated body.",
    });
    expect(result).toMatchObject({
      kind: "success",
      id,
      announcementKind: "announcement",
      title: "Updated title",
      body: "Updated body.",
      isPublished: true,
    });

    const row = await serviceClient
      .from("announcements")
      .select("kind, title, body, is_published, created_by, updated_by")
      .eq("id", id)
      .single();
    expect(row.data).toMatchObject({
      kind: "announcement",
      title: "Updated title",
      body: "Updated body.",
      is_published: true,
      created_by: admin.id,
      updated_by: editor.id,
    });
  });

  it("[ADM-03-AC4] editing an unknown item id is refused and changes no row", async () => {
    const result = await updateAnnouncement({
      id: randomUUID(),
      kind: "guideline",
      title: "Title",
      body: "Body",
    });
    expect(result).toEqual({ kind: "forbidden_or_not_found" });
  });

  it("[ADM-03-AC5] publishing then unpublishing then republishing never deletes the row and flips isPublished exactly", async () => {
    const id = await createFixtureAnnouncement({
      kind: "announcement",
      title: "Toggle me",
      body: "Body.",
      isPublished: false,
      createdBy: admin.id,
    });

    const published = await setAnnouncementPublished({ id, isPublished: true });
    expect(published).toEqual({ kind: "success", id, isPublished: true });
    const unpublished = await setAnnouncementPublished({ id, isPublished: false });
    expect(unpublished).toEqual({ kind: "success", id, isPublished: false });
    const republished = await setAnnouncementPublished({ id, isPublished: true });
    expect(republished).toEqual({ kind: "success", id, isPublished: true });

    const row = await serviceClient
      .from("announcements")
      .select("id, is_published")
      .eq("id", id)
      .single();
    expect(row.data).toMatchObject({ id, is_published: true });
  });

  it("[ADM-03-AC6] the admin list contains every item, published and draft alike, with only allowlisted fields", async () => {
    const tag = randomUUID().slice(0, 8);
    const draftId = await createFixtureAnnouncement({
      kind: "guideline",
      title: `ADM-03 AC6 draft ${tag}`,
      body: "Draft body.",
      isPublished: false,
      createdBy: admin.id,
    });
    const publishedId = await createFixtureAnnouncement({
      kind: "announcement",
      title: `ADM-03 AC6 published ${tag}`,
      body: "Published body.",
      isPublished: true,
      createdBy: admin.id,
    });

    const result = await listAnnouncementsForAdmin();
    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("list must succeed");
    const ids = result.items.map((item) => item.id);
    expect(ids).toContain(draftId);
    expect(ids).toContain(publishedId);
    for (const item of result.items) {
      expect(Object.keys(item).sort()).toEqual(
        ["body", "createdAt", "id", "isPublished", "kind", "title", "updatedAt"].sort(),
      );
    }
  });

  it("[ADM-03-AC7] a draft item is invisible to a Student, a Lecturer, or a signed-out caller, including a direct PostgREST select", async () => {
    const draftId = await createFixtureAnnouncement({
      kind: "guideline",
      title: `ADM-03 AC7 ${randomUUID().slice(0, 8)}`,
      body: "Draft body.",
      isPublished: false,
      createdBy: admin.id,
    });

    const lecturer = await createFixtureUser("lecturer");
    const student = await createFixtureUser("student");

    const lecturerClient = await signedInActor(lecturer.email, lecturer.password);
    const lecturerRows = await lecturerClient.from("announcements").select("id").eq("id", draftId);
    expect(lecturerRows.data).toHaveLength(0);

    const studentClient = await signedInActor(student.email, student.password);
    const studentRows = await studentClient.from("announcements").select("id").eq("id", draftId);
    expect(studentRows.data).toHaveLength(0);

    // anon holds no table-level select grant at all (only "authenticated" does, ADM-03-R6), so
    // a signed-out caller is refused before any policy even runs -- either shape (a permission
    // error, or an empty result) means the same thing here: no row is ever returned.
    const anonRows = await freshClient().from("announcements").select("id").eq("id", draftId);
    expect(anonRows.data ?? []).toHaveLength(0);
  });

  it("[ADM-03-AC8] [STU-06-AC1] a published guideline and a published announcement both appear to an active Student and Lecturer reader", async () => {
    const tag = randomUUID().slice(0, 8);
    const guidelineId = await createFixtureAnnouncement({
      kind: "guideline",
      title: `ADM-03 AC8 guideline ${tag}`,
      body: "Guideline body.",
      isPublished: true,
      createdBy: admin.id,
    });
    const announcementId = await createFixtureAnnouncement({
      kind: "announcement",
      title: `ADM-03 AC8 announcement ${tag}`,
      body: "Announcement body.",
      isPublished: true,
      createdBy: admin.id,
    });

    const student = await createFixtureUser("student");
    mocks.client.mockResolvedValue(await signedInActor(student.email, student.password));
    const studentResult = await listPublishedAnnouncements();
    expect(studentResult.kind).toBe("success");
    if (studentResult.kind === "success") {
      expect(studentResult.guidelines.map((item) => item.id)).toContain(guidelineId);
      expect(studentResult.announcements.map((item) => item.id)).toContain(announcementId);
    }

    const lecturer = await createFixtureUser("lecturer");
    mocks.client.mockResolvedValue(await signedInActor(lecturer.email, lecturer.password));
    const lecturerResult = await listPublishedAnnouncements();
    expect(lecturerResult.kind).toBe("success");
    if (lecturerResult.kind === "success") {
      expect(lecturerResult.guidelines.map((item) => item.id)).toContain(guidelineId);
      expect(lecturerResult.announcements.map((item) => item.id)).toContain(announcementId);
    }
  });

  it("[ADM-03-AC9] a signed-out, Student, or Lecturer caller cannot call any announcement write action or RPC directly", async () => {
    const lecturer = await createFixtureUser("lecturer");
    const student = await createFixtureUser("student");

    mocks.client.mockResolvedValue(await signedInActor(lecturer.email, lecturer.password));
    await expect(
      createAnnouncement({ kind: "guideline", title: "Should never exist", body: "Body" }),
    ).rejects.toThrow("NEXT_REDIRECT");

    mocks.client.mockResolvedValue(await signedInActor(student.email, student.password));
    await expect(setAnnouncementPublished({ id: randomUUID(), isPublished: true })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    mocks.client.mockResolvedValue(freshClient()); // never signed in
    await expect(listAnnouncementsForAdmin()).rejects.toThrow("NEXT_REDIRECT");

    // Direct RPC bypass: an authenticated-but-non-admin session still carries the execute
    // grant, so the function's own current_app_role() check, not the database grant, must be
    // what refuses it.
    const lecturerClient = await signedInActor(lecturer.email, lecturer.password);
    const direct = await lecturerClient.rpc("admin_create_announcement", {
      p_kind: "guideline",
      p_title: "Should never exist",
      p_body: "Body",
    });
    expect(direct.error).toBeNull();
    expect(direct.data).toEqual({ kind: "forbidden_or_not_found" });

    const studentClient = await signedInActor(student.email, student.password);
    const directUpdate = await studentClient.rpc("admin_update_announcement", {
      p_id: randomUUID(),
      p_kind: "guideline",
      p_title: "x",
      p_body: "y",
    });
    expect(directUpdate.error).toBeNull();
    expect(directUpdate.data).toEqual({ kind: "forbidden_or_not_found" });

    const anonDirect = await freshClient().rpc("admin_set_announcement_published", {
      p_id: randomUUID(),
      p_published: true,
    });
    expect(anonDirect.error).not.toBeNull();

    const rows = await serviceClient
      .from("announcements")
      .select("id")
      .ilike("title", "Should never exist");
    expect(rows.data).toHaveLength(0);
  });

  it("[ADM-03-AC11] creating/editing/publishing/listing/reading leaves ai_usage unchanged", async () => {
    const before = await countAiUsageFor(admin.id);
    const created = await createAnnouncement({
      kind: "guideline",
      title: `ADM-03 AC11 ${randomUUID().slice(0, 8)}`,
      body: "Body.",
    });
    expect(created.kind).toBe("success");
    if (created.kind !== "success") throw new Error("fixture creation must succeed");
    createdAnnouncementIds.push(created.id);

    await updateAnnouncement({ id: created.id, kind: "guideline", title: "T2", body: "Body 2." });
    await setAnnouncementPublished({ id: created.id, isPublished: true });
    await listAnnouncementsForAdmin();
    await listPublishedAnnouncements();

    expect(await countAiUsageFor(admin.id)).toBe(before);
  });

  it("[ADM-03-AC13] [STU-06-AC2] 2 published guidelines and 6 published announcements: the reader returns both guidelines and exactly the 5 newest announcements, all newest-first", async () => {
    const tag = randomUUID().slice(0, 8);
    const base = Date.parse("2030-01-01T00:00:00Z");
    const guidelineIds: string[] = [];
    for (let i = 0; i < 2; i++) {
      guidelineIds.push(
        await createFixtureAnnouncement({
          kind: "guideline",
          title: `ADM-03 AC13 guideline ${tag} ${i}`,
          body: "Guideline body.",
          isPublished: true,
          createdBy: admin.id,
          createdAt: new Date(base + i * 1000).toISOString(),
        }),
      );
    }
    const announcementIds: string[] = [];
    for (let i = 0; i < 6; i++) {
      announcementIds.push(
        await createFixtureAnnouncement({
          kind: "announcement",
          title: `ADM-03 AC13 announcement ${tag} ${i}`,
          body: "Announcement body.",
          isPublished: true,
          createdBy: admin.id,
          createdAt: new Date(base + i * 1000).toISOString(),
        }),
      );
    }
    // Newest-first by created_at: guideline[1] is newer than guideline[0]; announcement[5] is
    // the newest of the six, announcement[0] is the oldest and must be excluded (only the 5
    // newest are returned to the reader).
    const expectedGuidelines = [guidelineIds[1], guidelineIds[0]];
    const expectedAnnouncements = [...announcementIds].reverse().slice(0, 5);

    mocks.client.mockResolvedValue(await signedInActor(admin.email, admin.password));
    const result = await listPublishedAnnouncements();
    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("reader must succeed");

    const guidelineIdsInThisBatch = result.guidelines
      .map((item) => item.id)
      .filter((id) => guidelineIds.includes(id));
    expect(guidelineIdsInThisBatch).toEqual(expectedGuidelines);

    const announcementIdsInThisBatch = result.announcements
      .map((item) => item.id)
      .filter((id) => announcementIds.includes(id));
    expect(announcementIdsInThisBatch).toEqual(expectedAnnouncements);
    expect(announcementIdsInThisBatch).not.toContain(announcementIds[0]);

    const adminList = await listAnnouncementsForAdmin();
    expect(adminList.kind).toBe("success");
    if (adminList.kind === "success") {
      const allIds = adminList.items.map((item) => item.id);
      for (const id of [...guidelineIds, ...announcementIds]) expect(allIds).toContain(id);
    }
  });

  it("[ADM-03-AC15] [STU-06-AC4] [STU-06-AC8] a deactivated user's reader projection returns no items, regardless of publication state", async () => {
    const tag = randomUUID().slice(0, 8);
    const publishedId = await createFixtureAnnouncement({
      kind: "guideline",
      title: `ADM-03 AC15 ${tag}`,
      body: "Body.",
      isPublished: true,
      createdBy: admin.id,
    });

    const student = await createFixtureUser("student");
    const studentClient = await signedInActor(student.email, student.password);
    mocks.client.mockResolvedValue(studentClient);
    const before = await listPublishedAnnouncements();
    expect(before.kind).toBe("success");
    if (before.kind === "success") {
      expect(before.guidelines.some((item) => item.id === publishedId)).toBe(true);
    }

    const { error: deactivateError } = await serviceClient
      .from("profiles")
      .update({ is_active: false })
      .eq("id", student.id);
    expect(deactivateError).toBeNull();

    // Direct RLS check, same already-signed-in session (its JWT is still valid; only the
    // profile's is_active flag changed): current_app_role() now returns null, so neither
    // select policy matches and the still-published row is invisible -- the literal "returns
    // no items, published or not" behavior ADM-03-R5/the edge-case table describes.
    const directRows = await studentClient.from("announcements").select("id").eq("id", publishedId);
    expect(directRows.data).toHaveLength(0);

    // The app-layer Server Action goes one step further: requireUser() redirects a deactivated
    // caller before any query ever runs, the same behavior every other feature's requireRole/
    // requireUser gate already has.
    mocks.client.mockResolvedValue(studentClient);
    await expect(listPublishedAnnouncements()).rejects.toThrow("NEXT_REDIRECT");
  });
});
