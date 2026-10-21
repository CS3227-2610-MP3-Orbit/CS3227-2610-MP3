import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

describe("verify.mjs app profile", () => {
  it("[SH-07-AC7] runs lint, typecheck, and build so npm run verify enforces them", () => {
    const source = readFileSync(path.join(here, "verify.mjs"), "utf8");
    const appProfileSource = source.slice(
      source.indexOf("const app = ["),
      source.indexOf("];") + 2,
    );
    expect(appProfileSource).toMatch(/\["lint", "npm", \["run", "lint"\]\]/);
    expect(appProfileSource).toMatch(/\["typecheck", "npm", \["run", "typecheck"\]\]/);
    expect(appProfileSource).toMatch(/\["application build", "npm", \["run", "build"\]\]/);
  });

  it("[SH-07-AC5] runs the colour check so npm run verify enforces no-raw-colours", () => {
    const source = readFileSync(path.join(here, "verify.mjs"), "utf8");
    expect(source).toMatch(/\["run", "check:colors"\]/);
  });
});

describe("CODEOWNERS ownership boundary", () => {
  it("[SH-07-AC11] student and lecturer app paths still require their owner's review", () => {
    const codeowners = readFileSync(path.join(repoRoot, ".github", "CODEOWNERS"), "utf8");
    const studentLine = codeowners
      .split("\n")
      .find((line) => line.trim().startsWith("/src/app/student/"));
    const lecturerLine = codeowners
      .split("\n")
      .find((line) => line.trim().startsWith("/src/app/lecturer/"));
    expect(studentLine).toMatch(/@josephkwok001/);
    expect(lecturerLine).toMatch(/@JordanGoh4/);
  });
});
