import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // SH-07: the dev-server e2e configs (tests/e2e/admin.playwright.config.ts) browse
  // `http://127.0.0.1:<port>`, which Next 16's dev-only cross-origin guard does not treat as
  // the same origin as "localhost" by default -- without this, it silently blocks the dev
  // client JS bundle/HMR requests, so no client component ever hydrates (forms/links still
  // "work" via plain HTML/Server Action progressive enhancement, masking the breakage). Dev
  // only; has no effect on `next build`/`next start`.
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
