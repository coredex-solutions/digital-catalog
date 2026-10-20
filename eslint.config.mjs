import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // PM2 reads CommonJS config files
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Print templates embed the QR as a data: URL and must print exactly as previewed;
    // next/image would add lazy loading and resizing that print and data: URLs don't need
    files: ["src/app/c/[[]slug]/admin/qr/page.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  globalIgnores([".next/**", "out/**", "node_modules/**", "next-env.d.ts"]),
]);
