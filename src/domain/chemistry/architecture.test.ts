import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const chemistryDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(chemistryDir, "..", "..");

function collectTsFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...collectTsFiles(full));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      found.push(full);
    }
  }
  return found;
}

const asPosix = (path: string): string => path.split(sep).join("/");

describe("ข้อจำกัดเชิงสถาปัตยกรรม", () => {
  it("ชั้นโดเมนไม่ import React หรือ Next", () => {
    const offenders: string[] = [];

    for (const file of collectTsFiles(join(srcDir, "domain"))) {
      const source = readFileSync(file, "utf8");
      if (/from\s+["'](react|react-dom|next)(\/[^"']*)?["']/.test(source)) {
        offenders.push(asPosix(relative(srcDir, file)));
      }
    }

    expect(offenders).toEqual([]);
  });

  it("มีแต่ solubility.ts เท่านั้นที่กำหนดสถานะ (s) ได้", () => {
    // 'aq' ของไอออนอิสระเป็นเรื่องโครงสร้าง (ไอออนที่แตกตัวย่อมอยู่ในน้ำ)
    // แต่ 's' คือการตัดสินการละลายเสมอ จึงต้องมาจากตารางกฎที่เดียว
    const offenders: string[] = [];

    for (const file of collectTsFiles(srcDir)) {
      const relativePath = asPosix(relative(srcDir, file));
      if (
        relativePath === "domain/chemistry/solubility.ts" ||
        relativePath.endsWith(".test.ts")
      ) {
        continue;
      }

      if (/phase:\s*["']s["']/.test(readFileSync(file, "utf8"))) {
        offenders.push(relativePath);
      }
    }

    expect(offenders).toEqual([]);
  });
});
