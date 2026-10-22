// Prints `export` lines for the running local Supabase stack, for CI shell steps:
//   eval "$(supabase status -o json | node tests/integration/local-supabase-env.mjs)"
// The keys belong to a disposable local stack. Never echo this script's output to a log.
import { readFileSync } from "node:fs";

const status = JSON.parse(readFileSync(0, "utf8"));
const vars = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY ?? status.ANON_KEY,
  SUPABASE_SECRET_KEY: status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
};
for (const [name, value] of Object.entries(vars)) {
  if (!value) throw new Error(`Local Supabase status is missing ${name}`);
  console.log(`export ${name}=${JSON.stringify(value)}`);
}
