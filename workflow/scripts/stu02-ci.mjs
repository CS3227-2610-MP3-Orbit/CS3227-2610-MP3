import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Fresh hosted-runner infrastructure only. Never point fixture writers at the normal project.
if (process.env.GITHUB_ACTIONS !== "true" || process.env.CI !== "true") {
  throw new Error("This runner requires an ephemeral GitHub Actions CI job.");
}
const workdir = mkdtempSync(join(tmpdir(), "stu02-ci-"));
const project = `stu02-ci-${workdir.split("stu02-ci-").at(-1).toLowerCase()}`;
const directory = join(workdir, "supabase");
mkdirSync(directory);
const config = readFileSync("supabase/config.toml", "utf8");
if (!/^project_id = "[^"]+"$/m.test(config)) throw new Error("Missing Supabase project ID");
writeFileSync(
  join(directory, "config.toml"),
  config.replace(/^project_id = "[^"]+"$/m, `project_id = "${project}"`),
);
cpSync("supabase/migrations", join(directory, "migrations"), { recursive: true });
cpSync("supabase/seed.sql", join(directory, "seed.sql"));

function run(command, args, env = process.env, capture = false) {
  const result = spawnSync(command, args, {
    env,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.error || result.status !== 0)
    throw new Error(`${command} ${args[0]} failed (exit ${result.status ?? "unavailable"})`);
  return result.stdout;
}

// Supabase startup/status can print local credentials. Capture them; never echo raw output/errors.
run("supabase", ["start", "--workdir", workdir], process.env, true);
const status = JSON.parse(
  run("supabase", ["status", "--workdir", workdir, "-o", "json"], process.env, true),
);
const key = status.ANON_KEY ?? status.PUBLISHABLE_KEY;
if (typeof key !== "string" || !key) throw new Error("Local public auth key unavailable");
const api = "http://127.0.0.1:54321";
if (status.API_URL !== api) throw new Error("Unexpected disposable API endpoint");
const env = {
  ...process.env,
  STU02_TEST_DB_CONTAINER: `supabase_db_${project}`,
  STU02_TEST_SUPABASE_WORKDIR: workdir,
  STU02_TEST_API_URL: api,
  STU02_TEST_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: api,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
};
// Run first: real races also establish fictional eligible slots for browser fixtures.
run("npx", ["vitest", "run", "--config", "tests/integration/stu02.vitest.config.mts"], env);
run("npm", ["run", "test:e2e"], env);
// The ephemeral hosted runner owns container cleanup; no broad local destructive cleanup.
