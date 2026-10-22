import { readFileSync } from "node:fs";
import test from "node:test";

test("[LEC-06-AC6] approved security spec has explicit human approval evidence", () => {
  const spec = readFileSync("workflow/specs/lecturer/LEC-06-authorization-ai-security.md", "utf8");

  if (!/^status: approved$/m.test(spec)) {
    throw new Error("LEC-06 must remain unapproved until human approval is recorded");
  }
  if (!/Human approval: recorded on 2026-10-22 by the Lecturer feature owner/.test(spec)) {
    throw new Error("LEC-06 is approved without the required human approval record");
  }
});
