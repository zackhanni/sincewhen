import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path alias in tsconfig.json so tests import the same way app code does.
    // fileURLToPath rather than import.meta.dirname: the latter needs Node 20.11, and Next.js
    // only requires 20.9.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "") },
  },
  test: {
    // Core logic is pure functions with no DOM, so the fast node environment is enough.
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
