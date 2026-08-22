import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // ชั้นโดเมนต้องเป็นตรรกะบริสุทธิ์ ไม่พึ่ง React หรือ Next
    // ถ้าวันไหนต้อง import แปลว่าออกแบบผิด — ให้ CI จับได้เองแทนการพึ่งวินัยคน
    files: ["src/domain/**/*.ts", "src/domain/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "ชั้นโดเมนต้องไม่พึ่ง React" },
            { name: "react-dom", message: "ชั้นโดเมนต้องไม่พึ่ง React" },
            { name: "next", message: "ชั้นโดเมนต้องไม่พึ่ง Next" },
          ],
          patterns: [
            { group: ["next/*"], message: "ชั้นโดเมนต้องไม่พึ่ง Next" },
            { group: ["@/components/*"], message: "ชั้นโดเมนต้องไม่พึ่ง UI" },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
