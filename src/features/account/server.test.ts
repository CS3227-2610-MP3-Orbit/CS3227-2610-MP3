import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  cookieClient: vi.fn(),
  getClaims: vi.fn(),
  updateUser: vi.fn(),
  signOutOthers: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  createPublicClient: vi.fn(),
  adminClient: vi.fn(),
  adminFrom: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  order: vi.fn(),
  delete: vi.fn(),
  deleteEq: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cookieClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.adminClient }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createPublicClient }));

import { changeOwnPassword } from "./server";

const userId = "40000000-0000-4000-8000-000000000001";
const email = "demo-user@localhost.test";
const input = {
  currentPassword: "correct-current-pw",
  newPassword: "a-fresh-new-password",
  confirmPassword: "a-fresh-new-password",
};

describe("SH-06 changeOwnPassword server boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Populated by the Next.js runtime in practice; stub here so the throwaway verifier
    // client is constructed with deterministic values instead of undefined.
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
    mocks.requireUser.mockResolvedValue({
      id: userId,
      fullName: "Demo User",
      role: "student",
    });
    mocks.cookieClient.mockResolvedValue({
      auth: {
        getClaims: mocks.getClaims,
        updateUser: mocks.updateUser,
        signOut: mocks.signOutOthers,
      },
    });
    mocks.getClaims.mockResolvedValue({ data: { claims: { email } } });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.signOutOthers.mockResolvedValue({ error: null });
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: "throwaway" } },
      error: null,
    });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.createPublicClient.mockReturnValue({
      auth: { signInWithPassword: mocks.signInWithPassword, signOut: mocks.signOut },
    });

    // SH-06-R7's claim-then-count protocol, via createAdminClient(). Default: a single
    // attempt (the one just claimed) in the window, well under the limit, so verification
    // proceeds -- most tests below are about the verification/update path and only override
    // these when the rate limit itself is under test.
    mocks.adminClient.mockReturnValue({ from: mocks.adminFrom });
    mocks.adminFrom.mockReturnValue({
      insert: mocks.insert,
      select: mocks.select,
      delete: mocks.delete,
    });
    mocks.insert.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ single: mocks.single, eq: mocks.eq });
    mocks.eq.mockReturnValue({ gte: mocks.gte });
    mocks.gte.mockReturnValue({ order: mocks.order });
    mocks.delete.mockReturnValue({ eq: mocks.deleteEq });
    mocks.single.mockResolvedValue({ data: { id: 101 }, error: null });
    mocks.order.mockResolvedValue({
      data: [{ created_at: new Date().toISOString() }],
      error: null,
    });
    mocks.deleteEq.mockResolvedValue({ data: null, error: null });
  });

  it("[SH-06-R2] [SH-06-R5] authorizes via requireUser() before any Supabase work", async () => {
    expect(await changeOwnPassword(input)).toEqual({
      kind: "success",
      otherSessionsEnded: true,
    });
    expect(mocks.requireUser).toHaveBeenCalledWith();
    expect(mocks.requireUser.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getClaims.mock.invocationCallOrder[0],
    );
  });

  it("[SH-06-AC5] an unauthorized/redirecting caller never reaches Supabase, and the refusal propagates", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    mocks.requireUser.mockRejectedValue(redirect);
    await expect(changeOwnPassword(input)).rejects.toBe(redirect);
    expect(mocks.cookieClient).not.toHaveBeenCalled();
    expect(mocks.createPublicClient).not.toHaveBeenCalled();
    expect(mocks.adminClient).not.toHaveBeenCalled();
  });

  it("[SH-06-AC2] wrong current password returns one generic refusal, without updating the password", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });
    expect(await changeOwnPassword(input)).toEqual({
      kind: "conflict",
      reason: "wrong_current_password",
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
    // SH-06-R7: a failed verification keeps the claimed attempt row -- only a success clears it.
    expect(mocks.deleteEq).not.toHaveBeenCalled();
  });

  it("[SH-06-R2] verifies via a non-persisting throwaway client, signs it out, then updates the real session", async () => {
    await changeOwnPassword(input);
    expect(mocks.createPublicClient).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email,
      password: input.currentPassword,
    });
    // "local" only: the default "global" scope would revoke the caller's real session too.
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: input.newPassword });
    expect(mocks.signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.updateUser.mock.invocationCallOrder[0],
    );
  });

  it("[SH-06-AC3] too-short/too-long new passwords are rejected before any Supabase call", async () => {
    for (const newPassword of ["x".repeat(11), "x".repeat(73)]) {
      expect(
        await changeOwnPassword({ ...input, newPassword, confirmPassword: newPassword }),
      ).toMatchObject({ kind: "validation_error", field: "newPassword" });
    }
    expect(mocks.getClaims).not.toHaveBeenCalled();
    expect(mocks.createPublicClient).not.toHaveBeenCalled();
    expect(mocks.adminClient).not.toHaveBeenCalled();
  });

  it("[SH-06-AC4] a new password equal to the current one, or a mismatched confirmation, is rejected before any Supabase call", async () => {
    expect(
      await changeOwnPassword({
        ...input,
        newPassword: input.currentPassword,
        confirmPassword: input.currentPassword,
      }),
    ).toMatchObject({ kind: "validation_error", field: "newPassword" });
    expect(
      await changeOwnPassword({ ...input, confirmPassword: "something-else-entirely" }),
    ).toMatchObject({ kind: "validation_error", field: "confirmPassword" });
    expect(mocks.getClaims).not.toHaveBeenCalled();
    expect(mocks.adminClient).not.toHaveBeenCalled();
  });

  it("rejects forged, duplicate and unknown FormData fields before any Supabase call", async () => {
    const forged = new FormData();
    for (const [key, value] of Object.entries(input)) forged.append(key, value);
    forged.append("targetUserId", "11111111-1111-4111-8111-111111111111");
    expect(await changeOwnPassword(forged)).toMatchObject({ kind: "validation_error" });
    expect(mocks.getClaims).not.toHaveBeenCalled();
    expect(mocks.adminClient).not.toHaveBeenCalled();
  });

  it("[SH-06-AC7] never returns or logs the current or new password on any outcome", async () => {
    const logs = vi.spyOn(console, "error").mockImplementation(() => {});
    const malicious = "p@ssW0rd-should-never-leak-123456";

    // Success path.
    const success = await changeOwnPassword({
      currentPassword: malicious,
      newPassword: "a-different-fresh-password",
      confirmPassword: "a-different-fresh-password",
    });
    expect(JSON.stringify(success)).not.toContain(malicious);

    // Wrong-current-password path: the real Supabase error message is never surfaced raw.
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: `Invalid login credentials for password ${malicious}` },
    });
    const wrong = await changeOwnPassword(input);
    expect(wrong).toEqual({ kind: "conflict", reason: "wrong_current_password" });
    expect(JSON.stringify(wrong)).not.toContain(malicious);

    // Thrown transport error containing a password-like string must not leak either.
    mocks.signInWithPassword.mockRejectedValueOnce(new Error(`network failed for ${malicious}`));
    const thrown = await changeOwnPassword({
      ...input,
      currentPassword: malicious,
    });
    expect(thrown.kind).toBe("temporarily_unavailable");
    expect(JSON.stringify(thrown)).not.toContain(malicious);

    expect(JSON.stringify(logs.mock.calls)).not.toContain(malicious);
    logs.mockRestore();
  });

  it("an update failure after successful verification is reported generically, not raw", async () => {
    mocks.updateUser.mockResolvedValue({ error: { message: "db offline: secret detail" } });
    const result = await changeOwnPassword(input);
    expect(result.kind).toBe("temporarily_unavailable");
    expect(JSON.stringify(result)).not.toContain("secret detail");
  });

  it("an unresolvable session email is reported generically rather than guessed", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: {} } });
    const result = await changeOwnPassword(input);
    expect(result.kind).toBe("temporarily_unavailable");
    expect(mocks.createPublicClient).not.toHaveBeenCalled();
  });

  describe("SH-06-R6: other sessions end after a successful change", () => {
    it("[SH-06-R6] signs out other sessions on the caller's own cookie-bound client, keeping the current one", async () => {
      const result = await changeOwnPassword(input);
      expect(result).toEqual({ kind: "success", otherSessionsEnded: true });
      expect(mocks.signOutOthers).toHaveBeenCalledWith({ scope: "others" });
      // Called on the session (cookie) client, never the throwaway verifier.
      expect(mocks.signOut).not.toHaveBeenCalledWith({ scope: "others" });
      expect(mocks.updateUser.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.signOutOthers.mock.invocationCallOrder[0],
      );
    });

    it("[SH-06-R6] stays honest when the best-effort sign-out itself fails: the password change still succeeds", async () => {
      mocks.signOutOthers.mockResolvedValue({ error: { message: "network blip" } });
      const result = await changeOwnPassword(input);
      expect(result).toEqual({ kind: "success", otherSessionsEnded: false });
      expect(mocks.updateUser).toHaveBeenCalledWith({ password: input.newPassword });
    });
  });

  describe("SH-06-R7: wrong current-password attempt rate limit", () => {
    function attemptsEndingNow(count: number, oldestAgeMs: number) {
      const now = Date.now();
      return Array.from({ length: count }, (_, index) => ({
        created_at: new Date(now - oldestAgeMs + index).toISOString(),
      }));
    }

    it("[SH-06-AC9] a 6th attempt within the window is refused as rate_limited, with a positive retry-after, before any Supabase Auth call", async () => {
      // 5 prior failures plus the row just claimed for this attempt = 6, over the limit.
      mocks.order.mockResolvedValue({
        data: attemptsEndingNow(6, 5 * 60_000),
        error: null,
      });
      const result = await changeOwnPassword(input);
      expect(result.kind).toBe("rate_limited");
      if (result.kind === "rate_limited") expect(result.retryAfterSeconds).toBeGreaterThan(0);
      expect(mocks.createPublicClient).not.toHaveBeenCalled();
      expect(mocks.signInWithPassword).not.toHaveBeenCalled();
      expect(mocks.updateUser).not.toHaveBeenCalled();
    });

    it("[SH-06-AC9] exactly 5 attempts in the window is still allowed (the limit is 'more than 5', not 'at least 5')", async () => {
      mocks.order.mockResolvedValue({ data: attemptsEndingNow(5, 5 * 60_000), error: null });
      const result = await changeOwnPassword(input);
      expect(result.kind).toBe("success");
      expect(mocks.createPublicClient).toHaveBeenCalled();
    });

    it("[SH-06-R7] a rate-limited attempt's own claimed row is deleted (it never counts as a kept failure)", async () => {
      mocks.order.mockResolvedValue({ data: attemptsEndingNow(6, 5 * 60_000), error: null });
      await changeOwnPassword(input);
      expect(mocks.deleteEq).toHaveBeenCalled();
    });

    it("[SH-06-R7] fails closed as temporarily_unavailable if the attempt cannot even be claimed, and never verifies", async () => {
      mocks.single.mockResolvedValue({ data: null, error: { message: "insert failed" } });
      const result = await changeOwnPassword(input);
      expect(result.kind).toBe("temporarily_unavailable");
      expect(mocks.createPublicClient).not.toHaveBeenCalled();
    });

    it("[SH-06-R7] fails closed as temporarily_unavailable if the counting query errors, and never verifies", async () => {
      mocks.order.mockResolvedValue({ data: null, error: { message: "count query failed" } });
      const result = await changeOwnPassword(input);
      expect(result.kind).toBe("temporarily_unavailable");
      expect(mocks.createPublicClient).not.toHaveBeenCalled();
    });

    it("[SH-06-AC11] clears the claimed row on a successful verification before updating the password, so a later legitimate attempt is not blocked by earlier failures", async () => {
      // 3 prior failures still in the window, plus this attempt's own claim = 4: allowed.
      mocks.order.mockResolvedValue({ data: attemptsEndingNow(4, 5 * 60_000), error: null });
      const result = await changeOwnPassword(input);
      expect(result.kind).toBe("success");
      expect(mocks.deleteEq.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.updateUser.mock.invocationCallOrder[0],
      );
    });
  });
});
