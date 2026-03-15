import nextTs from "eslint-config-next/typescript";
import importSort from "./eslint-plugins/import-sort.mjs";
import nextVitals from "eslint-config-next/core-web-vitals";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
    "src/types/prisma-runtime.d.ts",
  ]),
  {
    plugins: {
      "import-sort": importSort,
    },
    rules: {
      "import-sort/order": "warn",
    },
  },
]);

export default eslintConfig;
