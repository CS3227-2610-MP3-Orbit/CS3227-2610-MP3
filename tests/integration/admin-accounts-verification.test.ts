// Independent tester_verifier coverage for ADM-01/SH-06, added on top of the developers' own
// tests/integration/admin-accounts.test.ts. This file targets gaps found while judging that
// suite against the approved spec's intent, not just its wording:
//
//   - setRole/setActive had ZERO live-DB integration coverage (only mocked-unit + pgTAP-RPC);
//     the Server Action's own requireRole("admin") boundary for those two actions was untested
//     against a real non-admin/signed-out caller.
//   - createAccount/listAccounts had no live-DB non-admin/signed-out direct-call coverage either
//     (only resetPassword did, as AC21).
//   - Ownership substitution (an admin targeting their own id via setRole/setActive, and the
//     protected admin's id) was pgTAP-only, never through the real Server Action + real session.
//   - ADM-01-AC14's true two-connection concurrent race was explicitly marked
//     not-run/blocked by the developer's pgTAP (one session, one transaction at a time) and
//     deferred to the tester -- this file provides the real two-connection version.
//   - requireUser()/getCurrentUser() denying a deactivated user mid-session (ADM-01-R6/AC9,
//     shared with SH-06-R5) had no direct test of the TS session helpers themselves, only of
//     the database's own current_app_role().
//
// Same harness conventions as the developers' own admin-accounts.test.ts: local Supabase via
// `npx supabase status -o json` (no .env read, no key printed), only
// @/lib/supabase/server's createClient() mocked (to a real, already-signed-in client per
// actor), everything downstream real.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));

import { getCurrentUser, requireRole, requireUser } from "@/lib/auth/session";
import {
  createAccount,
  listAccounts,
  resetPassword,
  setActive,
  setRole,
} from "@/features/admin/accounts/server";

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
  const email = `adm01v-${randomUUID()}@example.test`;
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

describe("[ADM-01-AC10] direct Server Action calls by non-admin/signed-out callers, for EVERY admin action", () => {
  async function actAs(kind: "non-admin" | "signed-out") {
    if (kind === "signed-out") {
      mocks.client.mockResolvedValue(freshClient());
      return;
    }
    const lecturer = await createFixtureUser("lecturer");
    mocks.client.mockResolvedValue(await signedInActor(lecturer.email, lecturer.password));
  }

  it.each(["non-admin", "signed-out"] as const)(
    "createAccount: a %s caller is refused before any account is created",
    async (kind) => {
      await actAs(kind);
      const email = `adm01v-should-not-exist-${randomUUID()}@example.test`;
      await expect(
        createAccount({ email, fullName: "Should Not Exist", role: "student" }),
      ).rejects.toThrow("NEXT_REDIRECT");

      // Confirmed as a real admin: the email was never created.
      const admin = await createFixtureUser("admin");
      mocks.client.mockResolvedValue(await signedInActor(admin.email, admin.password));
      const found = await listAccounts({ query: email });
      expect(found).toMatchObject({ kind: "success", accounts: [] });
    },
  );

  it.each(["non-admin", "signed-out"] as const)(
    "listAccounts: a %s caller is refused and receives no account data",
    async (kind) => {
      await actAs(kind);
      await expect(listAccounts({})).rejects.toThrow("NEXT_REDIRECT");
    },
  );

  it.each(["non-admin", "signed-out"] as const)(
    "setRole: a %s caller is refused and the target's role is unchanged",
    async (kind) => {
      const target = await createFixtureUser("student");
      await actAs(kind);
      await expect(setRole({ targetId: target.id, role: "lecturer" })).rejects.toThrow(
        "NEXT_REDIRECT",
      );

      const stored = await serviceClient
        .from("profiles")
        .select("role")
        .eq("id", target.id)
        .single();
      expect(stored.data?.role).toBe("student");
    },
  );

  it.each(["non-admin", "signed-out"] as const)(
    "setActive: a %s caller is refused and the target's active state is unchanged",
    async (kind) => {
      const target = await createFixtureUser("student");
      await actAs(kind);
      await expect(setActive({ targetId: target.id, active: false })).rejects.toThrow(
        "NEXT_REDIRECT",
      );

      const stored = await serviceClient
        .from("profiles")
        .select("is_active")
        .eq("id", target.id)
        .single();
      expect(stored.data?.is_active).toBe(true);
    },
  );

  it.each(["non-admin", "signed-out"] as const)(
    "resetPassword: a %s caller is refused and the target's password is unchanged",
    async (kind) => {
      const target = await createFixtureUser("student");
      await actAs(kind);
      await expect(resetPassword({ targetId: target.id })).rejects.toThrow("NEXT_REDIRECT");

      const stillWorks = await freshClient().auth.signInWithPassword({
        email: target.email,
        password: target.password,
      });
      expect(stillWorks.error).toBeNull();
    },
  );
});

describe("[ADM-01-AC6] [ADM-01-AC8] [ADM-01-AC15] ownership substitution, live Server Action + real session", () => {
  it("setRole: an admin cannot change their own role via a direct call, even though targetId is the only accepted field", async () => {
    const admin = await createFixtureUser("admin");
    mocks.client.mockResolvedValue(await signedInActor(admin.email, admin.password));

    const result = await setRole({ targetId: admin.id, role: "lecturer" });
    expect(result).toMatchObject({ kind: "forbidden_self_change" });

    const stored = await serviceClient.from("profiles").select("role").eq("id", admin.id).single();
    expect(stored.data?.role).toBe("admin");
  });

  it("setActive: an admin cannot deactivate themselves via a direct call", async () => {
    const admin = await createFixtureUser("admin");
    mocks.client.mockResolvedValue(await signedInActor(admin.email, admin.password));

    const result = await setActive({ targetId: admin.id, active: false });
    expect(result).toMatchObject({ kind: "forbidden_self_change" });

    const stored = await serviceClient
      .from("profiles")
      .select("is_active")
      .eq("id", admin.id)
      .single();
    expect(stored.data?.is_active).toBe(true);
  });

  it("setRole/setActive: another admin cannot change the protected recovery administrator, live", async () => {
    const admin = await createFixtureUser("admin");
    mocks.client.mockResolvedValue(await signedInActor(admin.email, admin.password));
    const protectedRow = await serviceClient
      .from("profiles")
      .select("id, role, is_active")
      .eq("is_protected", true)
      .maybeSingle();
    expect(
      protectedRow.data,
      "exactly one protected admin must exist in this environment",
    ).not.toBeNull();
    const protectedId = protectedRow.data!.id;

    expect(await setRole({ targetId: protectedId, role: "lecturer" })).toMatchObject({
      kind: "forbidden_protected",
    });
    expect(await setActive({ targetId: protectedId, active: false })).toMatchObject({
      kind: "forbidden_protected",
    });

    const stillProtected = await serviceClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", protectedId)
      .single();
    expect(stillProtected.data).toEqual(
      protectedRow.data
        ? { role: protectedRow.data.role, is_active: protectedRow.data.is_active }
        : null,
    );
  });
});

describe("[ADM-01-AC14] real two-connection concurrent demotion (not a sequential proxy)", () => {
  // The seed has exactly two admins (one protected). To exercise "exactly two active admins"
  // as AC14 specifies, the seed admins are deactivated for the duration of this one test only
  // (service-role write, restored in `finally` no matter the outcome) so the zero-admin
  // invariant is driven by our two fresh fixtures alone, not diluted by unrelated admins.
  const SEED_ADMIN_IDS = [
    "12000000-0000-4000-8000-000000000001",
    "12000000-0000-4000-8000-000000000002",
  ];

  it("two real connections, each demoting the other via admin_set_role at the same time: at most one commits, at least one admin always remains", async () => {
    const original = new Map<string, boolean>();
    for (const id of SEED_ADMIN_IDS) {
      const row = await serviceClient.from("profiles").select("is_active").eq("id", id).single();
      original.set(id, row.data!.is_active as boolean);
    }

    try {
      const { error: isolateError } = await serviceClient
        .from("profiles")
        .update({ is_active: false })
        .in("id", SEED_ADMIN_IDS);
      expect(isolateError).toBeNull();

      const adminX = await createFixtureUser("admin");
      const adminY = await createFixtureUser("admin");
      const clientX = await signedInActor(adminX.email, adminX.password);
      const clientY = await signedInActor(adminY.email, adminY.password);

      // Two genuinely separate HTTP/Postgres connections, dispatched together. The RPC's own
      // pg_advisory_xact_lock(82010001) serializes them inside Postgres; this test proves the
      // outcome that lock exists to guarantee, using two real backends, not pgTAP's single
      // session.
      const [xDemotesY, yDemotesX] = await Promise.all([
        clientX.rpc("admin_set_role", { target_id: adminY.id, new_role: "lecturer" }),
        clientY.rpc("admin_set_role", { target_id: adminX.id, new_role: "lecturer" }),
      ]);

      expect(xDemotesY.error).toBeNull();
      expect(yDemotesX.error).toBeNull();

      const kinds = [xDemotesY.data?.kind as string, yDemotesX.data?.kind as string];
      const successCount = kinds.filter((kind) => kind === "success").length;
      // At most one change commits. (With two symmetric cross-demotions and the advisory
      // lock serializing them, exactly one succeeds and the other is refused -- either
      // "forbidden_zero_admins" or "forbidden_or_not_found", depending on whether the second
      // call's own actor was already demoted by the first by the time it is authorized.)
      expect(successCount).toBeLessThanOrEqual(1);
      for (const kind of kinds) {
        expect(["success", "forbidden_zero_admins", "forbidden_or_not_found"]).toContain(kind);
      }

      const remaining = await serviceClient
        .from("profiles")
        .select("id")
        .in("id", [adminX.id, adminY.id])
        .eq("role", "admin")
        .eq("is_active", true);
      // No window with zero active administrators: exactly one of the two fixtures is still
      // an active admin afterward (the isolation above guarantees no other admin exists).
      expect(remaining.data).toHaveLength(1);
    } finally {
      for (const [id, isActive] of original) {
        await serviceClient.from("profiles").update({ is_active: isActive }).eq("id", id);
      }
    }
  });
});

describe("[ADM-01-R6] [ADM-01-AC9] [SH-06-R5] requireUser()/requireRole() deny a deactivated user on the very next call", () => {
  it("a user deactivated mid-session is treated as signed out without re-login, via the real session helpers", async () => {
    const user = await createFixtureUser("student");
    const client = await signedInActor(user.email, user.password);
    mocks.client.mockResolvedValue(client);

    const before = await getCurrentUser();
    expect(before?.id).toBe(user.id);

    const { error: deactivateError } = await serviceClient
      .from("profiles")
      .update({ is_active: false })
      .eq("id", user.id);
    expect(deactivateError).toBeNull();

    const after = await getCurrentUser();
    expect(after).toBeNull();

    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT");
    await expect(requireRole("student")).rejects.toThrow("NEXT_REDIRECT");
  });
});
