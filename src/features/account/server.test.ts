import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  cookieClient: vi.fn(),
  getClaims: vi.fn(),
  updateUser: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  createPublicClient: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cookieClient }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createPublicClient }));

import { changeOwnPassword } from "./server";

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
      id: "40000000-0000-4000-8000-000000000001",
      fullName: "Demo User",
      role: "student",
    });
    mocks.cookieClient.mockResolvedValue({
      auth: { getClaims: mocks.getClaims, updateUser: mocks.updateUser },
    });
    mocks.getClaims.mockResolvedValue({ data: { claims: { email } } });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: "throwaway" } },
      error: null,
    });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.createPublicClient.mockReturnValue({
      auth: { signInWithPassword: mocks.signInWithPassword, signOut: mocks.signOut },
    });
  });

  it("[SH-06-R2] [SH-06-R5] authorizes via requireUser() before any Supabase work", async () => {
    expect(await changeOwnPassword(input)).toEqual({ kind: "success" });
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
  });

  it("rejects forged, duplicate and unknown FormData fields before any Supabase call", async () => {
    const forged = new FormData();
    for (const [key, value] of Object.entries(input)) forged.append(key, value);
    forged.append("targetUserId", "11111111-1111-4111-8111-111111111111");
    expect(await changeOwnPassword(forged)).toMatchObject({ kind: "validation_error" });
    expect(mocks.getClaims).not.toHaveBeenCalled();
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
});
