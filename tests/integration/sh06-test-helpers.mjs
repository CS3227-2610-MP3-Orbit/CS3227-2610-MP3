import { createClient } from "@supabase/supabase-js";

/** @param {string} name */
function requireEnv(name) {
  const value = process.env[name];
  if (!value)
    throw new Error(`SH-06 integration tests require ${name} (see tests/integration/README.md)`);
  return value;
}

/** @param {string} value */
function loopback(value) {
  const url = new URL(value);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.protocol !== "http:")
    throw new Error("SH-06 fixtures require local HTTP loopback only; never a hosted project");
  return url.origin;
}

export const apiUrl = loopback(requireEnv("NEXT_PUBLIC_SUPABASE_URL"));
const publishableKey = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const secretKey = requireEnv("SUPABASE_SECRET_KEY");

/** A throwaway, non-persisting client -- exactly like the one changeOwnPassword() builds. */
export function publicClient() {
  return createClient(apiUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Simulates the caller's own cookie-scoped session client (the real app uses
 * @supabase/ssr's cookie-backed client, which keeps a working in-memory session between
 * calls). persistSession here only controls in-memory retention across calls on this one
 * instance within the test process -- it never touches disk, a browser, or real cookies.
 */
export function sessionClient() {
  return createClient(apiUrl, publishableKey, { auth: { persistSession: true } });
}

/**
 * Local-only service-role client. Used solely by this test suite's setup/teardown to create,
 * promote the role of, deactivate, and delete throwaway fixture users -- never by app code,
 * and never against a hosted project (loopback-only `apiUrl` above enforces this).
 */
export function adminClient() {
  return createClient(apiUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Fictional local-only fixture password; never reused outside this disposable test user. */
export const FIXTURE_PASSWORD = "Sh06-Fixture-Only-291!";

/** Creates a confirmed throwaway user with the given role (default: student). */
export async function createFixtureUser(role = "student") {
  const admin = adminClient();
  const email = `sh06-${crypto.randomUUID()}@localhost.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: FIXTURE_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error("SH-06 fixture user creation failed");
  const id = data.user.id;
  if (role !== "student") {
    const { error: profileError } = await admin.from("profiles").update({ role }).eq("id", id);
    if (profileError) throw new Error("SH-06 fixture role promotion failed");
  }
  return { id, email };
}

/** Permanently deletes a throwaway fixture user created above. */
export async function deleteFixtureUser(id) {
  await adminClient().auth.admin.deleteUser(id);
}
