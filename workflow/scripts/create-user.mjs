#!/usr/bin/env node
// Creates a confirmed user in the dev or prod Supabase project and sets their role.
//
//   node workflow/scripts/create-user.mjs <dev|prod> <email> <student|lecturer|admin> [full name]
//
// Reads <DEV|PROD>_SUPABASE_URL and <DEV|PROD>_SUPABASE_SECRET_KEY from .env.secrets
// (override with SECRETS_FILE). A random password is generated and appended to
// .env.test-accounts (gitignored); it is never printed.

import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const ENVIRONMENTS = { dev: "DEV", prod: "PROD" };
const ROLES = ["student", "lecturer", "admin"];
const ACCOUNTS_FILE = ".env.test-accounts";

/** Reads KEY=value lines, ignoring comments and surrounding whitespace. */
function readSecrets(file) {
  const entries = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()]);
  return Object.fromEntries(entries);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const [environment, email, role, fullName = ""] = process.argv.slice(2);
const prefix = ENVIRONMENTS[environment];
if (!prefix || !email || !ROLES.includes(role)) {
  fail("usage: create-user.mjs <dev|prod> <email> <student|lecturer|admin> [full name]");
}

const secrets = readSecrets(process.env.SECRETS_FILE ?? ".env.secrets");
const url = secrets[`${prefix}_SUPABASE_URL`];
const secretKey = secrets[`${prefix}_SUPABASE_SECRET_KEY`];
if (!url || !secretKey)
  fail(`${prefix}_SUPABASE_URL and ${prefix}_SUPABASE_SECRET_KEY are required`);

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const password = randomBytes(12).toString("base64url");

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});
if (error) fail(`could not create ${email}: ${error.message}`);

// New users are always students (see the handle_new_user trigger); other roles are set here.
if (role !== "student") {
  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", data.user.id);
  if (roleError) fail(`created ${email} but could not set role: ${roleError.message}`);
}

appendFileSync(ACCOUNTS_FILE, `${environment}\t${role}\t${email}\t${password}\n`);
console.log(`created ${email} as ${role} in ${environment}; password saved to ${ACCOUNTS_FILE}`);
