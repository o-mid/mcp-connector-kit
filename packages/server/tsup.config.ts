import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/e2e/fixture-stdio-entry.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node22",
});
