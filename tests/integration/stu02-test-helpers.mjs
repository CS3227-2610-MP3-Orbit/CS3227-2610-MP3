import { spawn } from "node:child_process";

// Explicit disposable target. Never falls back to the project's persistent DB.
const container = process.env.STU02_TEST_DB_CONTAINER ?? "supabase_db_stu02-disposable-u65dd8";
if (!container.startsWith("supabase_db_stu02-"))
  throw new Error("STU02 requires an explicitly disposable stu02 database container");
export const workdir = process.env.STU02_TEST_SUPABASE_WORKDIR ?? "/tmp/stu02-verify.U65dd8";
/** @param {string} value */
function loopback(value) {
  const url = new URL(value);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.protocol !== "http:")
    throw new Error("STU02 fixtures require local HTTP loopback only");
  return url.origin;
}
export const apiUrl = loopback(process.env.STU02_TEST_API_URL ?? "http://127.0.0.1:55321");
export const appUrl = loopback(process.env.STU02_TEST_APP_URL ?? "http://localhost:3102");
/** @param {string} statement @returns {Promise<string[]>} */
export function sql(statement) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "exec",
        "-i",
        container,
        "psql",
        "-X",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-At",
        "-v",
        "ON_ERROR_STOP=1",
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let output = "";
    let errors = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      errors += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(output.trim().split("\n").filter(Boolean)) : reject(new Error(errors)),
    );
    child.stdin.end(statement);
  });
}
/** @param {unknown} value */
export const quote = (value) => "'" + String(value).replaceAll("'", "''") + "'";
/** @param {string} id @param {string} expression @param {string} start */
export async function asStudent(id, expression, start = "") {
  const lines = await sql(
    `begin; set local role authenticated; set local request.jwt.claim.sub = ${quote(id)}; ${start} select (${expression})::text; commit;`,
  );
  const result = lines.findLast((line) => line.startsWith("{"));
  if (!result) throw new Error("Expected JSON result from authenticated database operation");
  return JSON.parse(result);
}
