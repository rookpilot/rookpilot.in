import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests cover plain logic (templates, reducers, selectors), so no DOM is needed.
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    alias: {
      "@/": new URL("./", import.meta.url).pathname,
    },
  },
});
