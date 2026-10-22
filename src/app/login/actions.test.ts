import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  from: vi.fn(),
  single: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { signIn } from "./actions";

const userId = "22222222-2222-4222-8222-222222222222";

function credentials() {
  const formData = new FormData();
  formData.set("email", "someone@example.com");
  formData.set("password", "correct-password");
  return formData;
}

describe("ADM-01-R11 sign-in for a deactivated account", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.client.mockResolvedValue({
      auth: { signInWithPassword: mocks.signInWithPassword, signOut: mocks.signOut },
      from: mocks.from,
    });
    mocks.signInWithPassword.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    const query = { select: () => query, eq: () => query, single: mocks.single };
    mocks.from.mockReturnValue(query);
  });

  it("[ADM-01-AC26] signs a deactivated user out again and explains why, without redirecting", async () => {
    mocks.single.mockResolvedValue({ data: { is_active: false }, error: null });

    const result = await signIn({ error: null }, credentials());

    expect(result).toEqual({
      error: "This account has been deactivated. Contact an administrator.",
    });
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("[ADM-01-AC26] still redirects an active user to their home route", async () => {
    mocks.single.mockResolvedValue({ data: { is_active: true }, error: null });

    await signIn({ error: null }, credentials());

    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("[ADM-01-AC26] keeps the generic message for a wrong password", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { user: null }, error: new Error("bad") });

    const result = await signIn({ error: null }, credentials());

    expect(result).toEqual({ error: "Incorrect email or password." });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
