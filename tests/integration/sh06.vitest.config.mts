import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/sh06-change-password.test.ts"],
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
