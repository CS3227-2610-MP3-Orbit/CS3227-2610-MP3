import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  client: vi.fn(),
  rpc: vi.fn(),
  rpcAbort: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  rowAbort: vi.fn(),
  maybeSingle: vi.fn(),
  adminClient: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  updateUserById: vi.fn(),
  password: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireRole: mocks.role }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.adminClient }));
vi.mock("./password", () => ({ generateInitialPassword: mocks.password }));

import { createAccount, listAccounts, resetPassword, setActive, setRole } from "./server";

const actorId = "99999999-9999-4999-8999-999999999999";
const targetId = "11111111-1111-4111-8111-111111111111";
const createInput = {
  email: "new.lecturer@example.test",
  fullName: "New Lecturer",
  role: "lecturer",
};

describe("ADM-01 admin accounts server boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.role.mockResolvedValue({ id: actorId, role: "admin", fullName: "Admin" });
    mocks.client.mockResolvedValue({ rpc: mocks.rpc, from: mocks.from });
    mocks.rpc.mockReturnValue({ abortSignal: mocks.rpcAbort });
    mocks.rpcAbort.mockResolvedValue({
      data: { kind: "success", targetId, role: "lecturer" },
      error: null,
    });
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ abortSignal: mocks.rowAbort });
    mocks.rowAbort.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.maybeSingle.mockResolvedValue({ data: { is_protected: false }, error: null });
    mocks.adminClient.mockReturnValue({
      auth: {
        admin: {
          createUser: mocks.createUser,
          deleteUser: mocks.deleteUser,
          updateUserById: mocks.updateUserById,
        },
      },
    });
    mocks.createUser.mockResolvedValue({ data: { user: { id: targetId } }, error: null });
    mocks.deleteUser.mockResolvedValue({ data: {}, error: null });
    mocks.updateUserById.mockResolvedValue({ data: {}, error: null });
    mocks.password.mockReturnValue("generated-password-value");
  });

  it("[ADM-01-AC10] [ADM-01-AC21] auth redirects propagate before any database work, for every action", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    mocks.role.mockRejectedValue(redirect);
    await expect(createAccount(createInput)).rejects.toBe(redirect);
    await expect(listAccounts({})).rejects.toBe(redirect);
    await expect(setRole({ targetId, role: "lecturer" })).rejects.toBe(redirect);
    await expect(setActive({ targetId, active: false })).rejects.toBe(redirect);
    await expect(resetPassword({ targetId })).rejects.toBe(redirect);
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  describe("createAccount (ADM-01-R1)", () => {
    it("[ADM-01-AC11] rejects malformed email, empty name and invalid role before any write", async () => {
      for (const invalid of [
        { ...createInput, email: "not-an-email" },
        { ...createInput, fullName: "   " },
        { ...createInput, role: "superadmin" },
        { ...createInput, extraField: "x" },
      ]) {
        expect(await createAccount(invalid)).toMatchObject({ kind: "validation_error" });
      }
      expect(mocks.createUser).not.toHaveBeenCalled();
    });

    it("creates a student account with a single step: no role-set RPC call for the default role", async () => {
      mocks.password.mockReturnValue("student-password");
      const result = await createAccount({ ...createInput, role: "student" });
      expect(result).toEqual({
        kind: "success",
        account: {
          id: targetId,
          email: createInput.email,
          fullName: createInput.fullName,
          role: "student",
          isActive: true,
          isProtected: false,
        },
        initialCredential: "student-password",
      });
      expect(mocks.createUser).toHaveBeenCalledWith({
        email: createInput.email,
        password: "student-password",
        email_confirm: true,
        user_metadata: { full_name: createInput.fullName },
      });
      expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("a non-student role calls admin_set_role under the caller's own session before reporting success", async () => {
      const result = await createAccount(createInput);
      expect(result).toMatchObject({ kind: "success", account: { role: "lecturer" } });
      expect(mocks.rpc).toHaveBeenCalledWith("admin_set_role", {
        target_id: targetId,
        new_role: "lecturer",
      });
      expect(mocks.role.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.createUser.mock.invocationCallOrder[0],
      );
      expect(mocks.createUser.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.rpc.mock.invocationCallOrder[0],
      );
    });

    it("[ADM-01-AC3] maps a duplicate email to conflict without creating a second account", async () => {
      mocks.createUser.mockResolvedValue({
        data: { user: null },
        error: { code: "email_exists", message: "User already registered" },
      });
      expect(await createAccount(createInput)).toEqual({
        kind: "conflict",
        reason: "duplicate_email",
      });
      expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("reports the account as never created when the auth call fails for another reason", async () => {
      mocks.createUser.mockResolvedValue({
        data: { user: null },
        error: { code: "unexpected_failure", message: "db offline" },
      });
      expect(await createAccount(createInput)).toMatchObject({ kind: "temporarily_unavailable" });
    });

    it("compensates (deletes the auth user) and reports incomplete when the role-set step does not confirm success, never reporting the requested role", async () => {
      mocks.rpcAbort.mockResolvedValue({ data: { kind: "forbidden_or_not_found" }, error: null });
      const result = await createAccount(createInput);
      expect(result).toMatchObject({ kind: "incomplete" });
      expect(mocks.deleteUser).toHaveBeenCalledWith(targetId);
      expect(JSON.stringify(result)).not.toContain("lecturer");
    });

    it("still reports incomplete (never success) even if the compensating delete itself fails", async () => {
      mocks.rpcAbort.mockRejectedValue(new Error("network drop"));
      mocks.deleteUser.mockRejectedValue(new Error("delete also failed"));
      const result = await createAccount(createInput);
      expect(result).toMatchObject({ kind: "incomplete" });
    });

    it("[ADM-01-AC12] a failure response never contains the generated password", async () => {
      mocks.password.mockReturnValue("super-secret-password-abc");
      mocks.rpcAbort.mockResolvedValue({ data: { kind: "forbidden_or_not_found" }, error: null });
      const result = await createAccount(createInput);
      expect(JSON.stringify(result)).not.toContain("super-secret-password-abc");
    });
  });

  describe("listAccounts (ADM-01-R2)", () => {
    it("[ADM-01-AC4] forwards query/role/active filters to the RPC, defaulting omitted filters to null", async () => {
      mocks.rpcAbort.mockResolvedValue({ data: { kind: "success", accounts: [] }, error: null });
      await listAccounts({ query: "ada", roleFilter: "lecturer", activeFilter: "true" });
      expect(mocks.rpc).toHaveBeenCalledWith("admin_list_accounts", {
        p_query: "ada",
        p_role: "lecturer",
        p_active: true,
      });
      await listAccounts({});
      expect(mocks.rpc).toHaveBeenLastCalledWith("admin_list_accounts", {
        p_query: null,
        p_role: null,
        p_active: null,
      });
    });

    it("[ADM-01-AC13] never surfaces a password/secret field, even if one leaked into the RPC payload", async () => {
      mocks.rpcAbort.mockResolvedValue({
        data: {
          kind: "success",
          accounts: [
            {
              id: targetId,
              email: "a@example.test",
              fullName: "A",
              role: "student",
              isActive: true,
              isProtected: false,
              password: "should-never-appear",
            },
          ],
        },
        error: null,
      });
      const result = await listAccounts({});
      // The extra field makes the row fail the strict schema entirely, so the whole response is
      // reported as unavailable rather than silently dropping just the unexpected field -- either
      // way, the secret never reaches the caller.
      expect(JSON.stringify(result)).not.toContain("should-never-appear");
    });

    it("reports unavailable on a thrown transport error", async () => {
      mocks.client.mockRejectedValue(new Error("offline"));
      expect(await listAccounts({})).toMatchObject({ kind: "temporarily_unavailable" });
    });
  });

  describe("setRole/setActive (ADM-01-R3/R4/R5/R7/R8)", () => {
    it("forwards targetId/role to admin_set_role", async () => {
      await setRole({ targetId, role: "admin" });
      expect(mocks.rpc).toHaveBeenCalledWith("admin_set_role", {
        target_id: targetId,
        new_role: "admin",
      });
    });
    it("forwards targetId/active to admin_set_active", async () => {
      mocks.rpcAbort.mockResolvedValue({
        data: { kind: "success", targetId, isActive: false },
        error: null,
      });
      expect(await setActive({ targetId, active: false })).toEqual({
        kind: "success",
        targetId,
        isActive: false,
      });
      expect(mocks.rpc).toHaveBeenCalledWith("admin_set_active", {
        target_id: targetId,
        active: false,
      });
    });
    it("[ADM-01-AC6] [ADM-01-AC8] passes through the RPC's own refusal kinds unchanged", async () => {
      for (const kind of [
        "forbidden_self_change",
        "forbidden_protected",
        "forbidden_zero_admins",
        "forbidden_or_not_found",
      ]) {
        mocks.rpcAbort.mockResolvedValueOnce({ data: { kind }, error: null });
        expect((await setRole({ targetId, role: "student" })).kind).toBe(kind);
      }
    });
    it("reports outcome_unknown (not success) on a thrown or malformed RPC response", async () => {
      mocks.rpcAbort.mockRejectedValueOnce(new Error("network drop"));
      expect(await setRole({ targetId, role: "student" })).toMatchObject({
        kind: "outcome_unknown",
      });
      mocks.rpcAbort.mockResolvedValueOnce({
        data: { kind: "success" /* missing fields */ },
        error: null,
      });
      expect(await setActive({ targetId, active: true })).toMatchObject({
        kind: "outcome_unknown",
      });
    });
    it("[ADM-01-AC11] rejects a malformed target id or role before calling the RPC", async () => {
      expect(await setRole({ targetId: "not-a-uuid", role: "student" })).toMatchObject({
        kind: "validation_error",
      });
      expect(await setActive({ targetId, active: "yes" })).toMatchObject({
        kind: "validation_error",
      });
      expect(mocks.rpc).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword (ADM-01-R9/R10)", () => {
    beforeEach(() => {
      // Default: admin_revoke_sessions (called via the same shared db.rpc mock as
      // admin_set_role/admin_list_accounts) reports a confirmed success, so tests in this
      // block that do not care about revocation itself still observe plain "success".
      mocks.rpcAbort.mockResolvedValue({
        data: { kind: "success", targetId, sessionsRevoked: 1 },
        error: null,
      });
    });

    it("[ADM-01-AC19] refuses the caller's own account before any lookup or write", async () => {
      const result = await resetPassword({ targetId: actorId });
      expect(result).toEqual({ kind: "forbidden_self_change" });
      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.updateUserById).not.toHaveBeenCalled();
    });

    it("[ADM-01-AC20] refuses the protected recovery administrator before any write", async () => {
      mocks.maybeSingle.mockResolvedValue({ data: { is_protected: true }, error: null });
      const result = await resetPassword({ targetId });
      expect(result).toEqual({ kind: "forbidden_protected" });
      expect(mocks.updateUserById).not.toHaveBeenCalled();
    });

    it("refuses an unknown target", async () => {
      mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
      expect(await resetPassword({ targetId })).toEqual({ kind: "forbidden_or_not_found" });
      expect(mocks.updateUserById).not.toHaveBeenCalled();
    });

    it("resets an ordinary target's password, revokes their sessions, and returns the new one-time credential", async () => {
      mocks.password.mockReturnValue("brand-new-reset-password");
      const result = await resetPassword({ targetId });
      expect(result).toEqual({ kind: "success", initialCredential: "brand-new-reset-password" });
      expect(mocks.updateUserById).toHaveBeenCalledWith(targetId, {
        password: "brand-new-reset-password",
      });
      expect(mocks.rpc).toHaveBeenCalledWith("admin_revoke_sessions", { target_id: targetId });
      // ADM-01-R10: the password write must complete before sessions are revoked.
      expect(mocks.updateUserById.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.rpc.mock.invocationCallOrder[0],
      );
    });

    it("[ADM-01-AC25] does not call admin_revoke_sessions when the password write itself fails", async () => {
      mocks.updateUserById.mockResolvedValue({ data: null, error: new Error("auth offline") });
      expect(await resetPassword({ targetId })).toMatchObject({ kind: "outcome_unknown" });
      expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("[ADM-01-R10] reports password_reset_sessions_not_revoked (still with the new password) when the RPC returns a non-success kind", async () => {
      mocks.password.mockReturnValue("reset-but-not-revoked");
      mocks.rpcAbort.mockResolvedValueOnce({
        data: { kind: "forbidden_or_not_found" },
        error: null,
      });
      const result = await resetPassword({ targetId });
      expect(result).toEqual({
        kind: "password_reset_sessions_not_revoked",
        initialCredential: "reset-but-not-revoked",
      });
      // The password did change -- never reported as outcome_unknown or a false success.
      expect(result.kind).not.toBe("outcome_unknown");
      expect(result.kind).not.toBe("success");
    });

    it("[ADM-01-R10] reports password_reset_sessions_not_revoked when the RPC call itself throws or returns a malformed payload", async () => {
      mocks.password.mockReturnValue("reset-but-rpc-threw");
      mocks.rpcAbort.mockRejectedValueOnce(new Error("network drop"));
      expect(await resetPassword({ targetId })).toEqual({
        kind: "password_reset_sessions_not_revoked",
        initialCredential: "reset-but-rpc-threw",
      });

      mocks.password.mockReturnValue("reset-but-rpc-malformed");
      mocks.rpcAbort.mockResolvedValueOnce({
        data: { kind: "success" /* missing fields */ },
        error: null,
      });
      expect(await resetPassword({ targetId })).toEqual({
        kind: "password_reset_sessions_not_revoked",
        initialCredential: "reset-but-rpc-malformed",
      });
    });

    it("[ADM-01-R10] a password_reset_sessions_not_revoked response never contains any other generated password", async () => {
      mocks.password.mockReturnValue("only-this-password-should-appear");
      mocks.rpcAbort.mockResolvedValueOnce({
        data: { kind: "temporarily_unavailable" },
        error: null,
      });
      const result = await resetPassword({ targetId });
      expect(result).toMatchObject({ kind: "password_reset_sessions_not_revoked" });
      expect(JSON.stringify(result)).toContain("only-this-password-should-appear");
    });

    it("[ADM-01-AC21] [ADM-01-AC11] rejects a malformed target id before any lookup", async () => {
      expect(await resetPassword({ targetId: "not-a-uuid" })).toMatchObject({
        kind: "validation_error",
      });
      expect(mocks.from).not.toHaveBeenCalled();
    });

    it("reports unavailable kinds for lookup/update failures, never a false success", async () => {
      mocks.maybeSingle.mockResolvedValue({ data: null, error: new Error("db offline") });
      expect(await resetPassword({ targetId })).toMatchObject({ kind: "temporarily_unavailable" });
      mocks.maybeSingle.mockResolvedValue({ data: { is_protected: false }, error: null });
      mocks.updateUserById.mockResolvedValue({ data: null, error: new Error("auth offline") });
      expect(await resetPassword({ targetId })).toMatchObject({ kind: "outcome_unknown" });
    });

    it("[ADM-01-AC22] a failure response never contains the generated password", async () => {
      mocks.password.mockReturnValue("another-secret-value");
      mocks.updateUserById.mockResolvedValue({ data: null, error: new Error("auth offline") });
      const result = await resetPassword({ targetId });
      expect(JSON.stringify(result)).not.toContain("another-secret-value");
    });
  });

  it("[ADM-01-AC12] [ADM-01-AC22] never logs anything, so a password can never reach server logs", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await createAccount(createInput);
      await resetPassword({ targetId });
      mocks.createUser.mockResolvedValue({ data: { user: null }, error: { message: "boom" } });
      await createAccount(createInput);
      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      logSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });
});
