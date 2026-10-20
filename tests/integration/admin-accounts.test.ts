// ADM-01 real-Postgres/real-Auth verification. Runs against whatever local Supabase instance
// is already up (`npx supabase status -o json` supplies the target; no .env file is read, no
// key is ever printed). Unlike tests/integration/stu02.*, these fixtures are additive and
// cleaned up in afterAll rather than racing/destructive, so they do not need a disposable
// "stu02-"-prefixed stack: the account-management actions here never block on, or interact
// with, another concurrent session the way STU-02's booking races do.
//
// Design note (why this can import src/features/admin/accounts/server.ts directly, unlike the
// STU-02 integration tests which only ever exercise raw SQL/REST): every exported function in
// that module calls requireRole("admin") first, which depends on next/headers' cookies() via
// @/lib/supabase/server's createClient(). That one call is mocked here to return a REAL,
// already-signed-in supabase-js client for whichever fixture user a given test acts as --
// everything downstream of it (requireRole's own is_active/role re-check, every RPC, the
// Auth Admin API) is the real local Postgres/GoTrue, not a double.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));

import { createAccount, listAccounts, resetPassword } from "@/features/admin/accounts/server";

let apiUrl: string;
let publishableKey: string;
let serviceClient: SupabaseClient;
const createdUserIds: string[] = [];
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

async function createFixtureUser(role: "student" | "lecturer" | "admin") {
  const email = `adm01-${randomUUID()}@example.test`;
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password: fixturePassword,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("fixture user creation failed");
  createdUserIds.push(data.user.id);
  if (role !== "student") {
    const { error: roleError } = await serviceClient
      .from("profiles")
      .update({ role })
      .eq("id", data.user.id);
    if (roleError) throw roleError;
  }
  return { id: data.user.id, email, password: fixturePassword };
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
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = publishableKey;
  process.env.SUPABASE_SECRET_KEY = secretKey;
  serviceClient = createSupabaseClient(apiUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
});

afterAll(async () => {
  for (const id of createdUserIds) {
    await serviceClient.auth.admin.deleteUser(id).catch(() => {});
  }
});

describe("ADM-01 admin accounts: real Postgres + real Auth", () => {
  let admin: { id: string; email: string; password: string };

  beforeEach(async () => {
    admin = await createFixtureUser("admin");
    mocks.client.mockResolvedValue(await signedInActor(admin.email, admin.password));
  });

  it("[ADM-01-AC1] a lecturer request ends with role lecturer, not the trigger's default student", async () => {
    const email = `adm01-${randomUUID()}@example.test`;
    const result = await createAccount({ email, fullName: "New Lecturer", role: "lecturer" });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("fixture creation must succeed");
    createdUserIds.push(result.account.id);
    expect(result.account).toMatchObject({ email, role: "lecturer" });
    const stored = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", result.account.id)
      .single();
    expect(stored.data?.role).toBe("lecturer");
  });

  it("[ADM-01-AC2] a student request creates exactly one profile with role student", async () => {
    const email = `adm01-${randomUUID()}@example.test`;
    const result = await createAccount({ email, fullName: "New Student", role: "student" });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("fixture creation must succeed");
    createdUserIds.push(result.account.id);
    const rows = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("id", result.account.id);
    expect(rows.data).toHaveLength(1);
    expect(rows.data?.[0]).toMatchObject({ role: "student" });
  });

  it("[ADM-01-AC3] a duplicate email is refused with no second account created", async () => {
    const email = `adm01-${randomUUID()}@example.test`;
    const first = await createAccount({ email, fullName: "First", role: "student" });
    expect(first.kind).toBe("success");
    if (first.kind !== "success") throw new Error("fixture creation must succeed");
    createdUserIds.push(first.account.id);
    const second = await createAccount({ email, fullName: "Second", role: "lecturer" });
    expect(second).toEqual({ kind: "conflict", reason: "duplicate_email" });
  });

  it("[ADM-01-AC4] [ADM-01-AC13] list/search returns only allowlisted fields, never a just-issued credential", async () => {
    const email = `adm01-${randomUUID()}@example.test`;
    const created = await createAccount({ email, fullName: "Findable Person", role: "student" });
    expect(created.kind).toBe("success");
    if (created.kind !== "success") throw new Error("fixture creation must succeed");
    createdUserIds.push(created.account.id);

    const found = await listAccounts({ query: email });
    expect(found.kind).toBe("success");
    if (found.kind !== "success") throw new Error("list must succeed");
    expect(found.accounts).toEqual([
      {
        id: created.account.id,
        email,
        fullName: "Findable Person",
        role: "student",
        isActive: true,
        isProtected: false,
      },
    ]);
    expect(JSON.stringify(found)).not.toContain(created.initialCredential);

    // A second read of the same account never re-exposes the credential either.
    const again = await listAccounts({ query: email });
    expect(JSON.stringify(again)).not.toContain(created.initialCredential);
  });

  it("[ADM-01-AC18] a reset password signs in with the new password and the old one stops working", async () => {
    const target = await createFixtureUser("student");
    const result = await resetPassword({ targetId: target.id });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("reset must succeed");

    const oldAttempt = await freshClient().auth.signInWithPassword({
      email: target.email,
      password: target.password,
    });
    expect(oldAttempt.error).not.toBeNull();

    const newAttempt = await freshClient().auth.signInWithPassword({
      email: target.email,
      password: result.initialCredential,
    });
    expect(newAttempt.error).toBeNull();
    expect(newAttempt.data.user?.id).toBe(target.id);
  });

  it("[ADM-01-AC19] an admin cannot reset their own password, including a direct call", async () => {
    const result = await resetPassword({ targetId: admin.id });
    expect(result).toEqual({ kind: "forbidden_self_change" });
    // The password used to sign this admin in still works -- nothing changed.
    const stillWorks = await freshClient().auth.signInWithPassword({
      email: admin.email,
      password: admin.password,
    });
    expect(stillWorks.error).toBeNull();
  });

  it("[ADM-01-AC20] an admin cannot reset the protected recovery administrator's password", async () => {
    const protectedRow = await serviceClient
      .from("profiles")
      .select("id")
      .eq("is_protected", true)
      .maybeSingle();
    expect(
      protectedRow.data,
      "the ADM-01 migration must have already marked exactly one protected admin in this environment",
    ).not.toBeNull();
    const result = await resetPassword({ targetId: protectedRow.data!.id });
    expect(result).toEqual({ kind: "forbidden_protected" });
  });

  it("[ADM-01-AC21] a non-admin caller cannot reset anyone's password through a direct call", async () => {
    const nonAdmin = await createFixtureUser("lecturer");
    const target = await createFixtureUser("student");
    mocks.client.mockResolvedValue(await signedInActor(nonAdmin.email, nonAdmin.password));

    await expect(resetPassword({ targetId: target.id })).rejects.toThrow("NEXT_REDIRECT");

    // Confirm no mutation occurred: the target's original fixture password still works.
    const stillWorks = await freshClient().auth.signInWithPassword({
      email: target.email,
      password: target.password,
    });
    expect(stillWorks.error).toBeNull();
  });

  it("[ADM-01-AC21] a signed-out caller cannot reset anyone's password through a direct call", async () => {
    const target = await createFixtureUser("student");
    mocks.client.mockResolvedValue(freshClient()); // never signed in

    await expect(resetPassword({ targetId: target.id })).rejects.toThrow("NEXT_REDIRECT");

    const stillWorks = await freshClient().auth.signInWithPassword({
      email: target.email,
      password: target.password,
    });
    expect(stillWorks.error).toBeNull();
  });

  it("[ADM-01-AC22] a reset's new password never appears in listAccounts or a later response, and resetting again issues a different one", async () => {
    const target = await createFixtureUser("student");
    const first = await resetPassword({ targetId: target.id });
    expect(first.kind).toBe("success");
    if (first.kind !== "success") throw new Error("first reset must succeed");

    const list = await listAccounts({ query: target.email });
    expect(JSON.stringify(list)).not.toContain(first.initialCredential);

    const second = await resetPassword({ targetId: target.id });
    expect(second.kind).toBe("success");
    if (second.kind !== "success") throw new Error("second reset must succeed");
    expect(second.initialCredential).not.toBe(first.initialCredential);
    expect(JSON.stringify(second)).not.toContain(first.initialCredential);
  });
});
