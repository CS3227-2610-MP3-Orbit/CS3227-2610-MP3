import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/student-request-concurrency.test.ts"],
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});
