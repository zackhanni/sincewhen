import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path alias in tsconfig.json so tests import the same way app code does.
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
  test: {
    // Core logic is pure functions with no DOM, so the fast node environment is enough.
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
