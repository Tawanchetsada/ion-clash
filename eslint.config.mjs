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
  {
    // ที่เก็บข้อมูลต้องผ่าน GameSaveRepository เท่านั้น
    // นอกจากเรื่องสถาปัตยกรรมแล้ว การอ่าน localStorage ตอน server render
    // ทำให้ Next.js พังทันทีเพราะไม่มี window บนเซิร์ฟเวอร์
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/storage/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message: "ใช้ GameSaveRepository แทน — ดู src/storage/",
        },
        {
          name: "sessionStorage",
          message: "ใช้ GameSaveRepository แทน — ดู src/storage/",
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "localStorage",
          message: "ใช้ GameSaveRepository แทน — ดู src/storage/",
        },
        {
          object: "window",
          property: "sessionStorage",
          message: "ใช้ GameSaveRepository แทน — ดู src/storage/",
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
