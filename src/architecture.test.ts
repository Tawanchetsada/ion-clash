import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * ข้อจำกัดเชิงสถาปัตยกรรมที่บังคับด้วยเครื่องมือ ไม่ใช่วินัยคน
 *
 * กฎในไฟล์นี้ข้ามชั้นทั้งหมด จึงวางไว้ที่รากของ src ไม่ใช่ในโฟลเดอร์ใด
 * โฟลเดอร์หนึ่ง เพื่อให้คนที่เข้ามาใหม่หาเจอ
 */

const srcDir = dirname(fileURLToPath(import.meta.url));

/** ไฟล์นี้เองมีคำที่กำลังตรวจอยู่ในโค้ด จึงต้องข้ามตัวเอง */
const SELF = "architecture.test.ts";

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

/**
 * ตัดคอมเมนต์ออกก่อนสแกน
 *
 * กฎในไฟล์นี้ห้าม "โค้ด" ที่ทำสิ่งต้องห้าม ไม่ได้ห้าม "เอกสาร" ที่พูดถึงมัน
 * ถ้าไม่ตัดคอมเมนต์ทิ้ง คอมเมนต์ที่อธิบายว่าทำไมห้ามแตะ localStorage
 * จะกลายเป็นตัวละเมิดกฎเสียเอง แล้วคนเขียนก็จะเลี่ยงไปเขียนคำอธิบายที่คลุมเครือ
 * ซึ่งแย่กว่าเดิม
 *
 * ข้อจำกัดที่ยอมรับได้: สตริงที่มี `//` อยู่ข้างใน (เช่น URL) จะทำให้ส่วนที่เหลือ
 * ของบรรทัดนั้นถูกตัดไปด้วย — ไม่เป็นไรเพราะกฎ ESLint อ่าน AST จริง
 * และจับการใช้งานจริงได้แม่นกว่าอยู่แล้ว การสแกนไฟล์เป็นแค่ชั้นสำรอง
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

function findOffenders(
  pattern: RegExp,
  isAllowed: (relativePath: string) => boolean,
): string[] {
  const offenders: string[] = [];

  for (const file of collectTsFiles(srcDir)) {
    const relativePath = asPosix(relative(srcDir, file));
    if (relativePath === SELF || isAllowed(relativePath)) continue;
    if (pattern.test(stripComments(readFileSync(file, "utf8")))) {
      offenders.push(relativePath);
    }
  }

  return offenders;
}

describe("ข้อจำกัดเชิงสถาปัตยกรรม", () => {
  it("ชั้นโดเมนไม่ import React หรือ Next", () => {
    const offenders: string[] = [];

    for (const file of collectTsFiles(join(srcDir, "domain"))) {
      const source = stripComments(readFileSync(file, "utf8"));
      if (/from\s+["'](react|react-dom|next)(\/[^"']*)?["']/.test(source)) {
        offenders.push(asPosix(relative(srcDir, file)));
      }
    }

    expect(offenders).toEqual([]);
  });

  it("มีแต่ solubility.ts เท่านั้นที่กำหนดสถานะ (s) ได้", () => {
    // 'aq' ของไอออนอิสระเป็นเรื่องโครงสร้าง (ไอออนที่แตกตัวย่อมอยู่ในน้ำ)
    // แต่ 's' คือการตัดสินการละลายเสมอ จึงต้องมาจากตารางกฎที่เดียว
    const offenders = findOffenders(
      /phase:\s*["']s["']/,
      (path) =>
        path === "domain/chemistry/solubility.ts" || path.endsWith(".test.ts"),
    );

    expect(offenders).toEqual([]);
  });

  it("มีแต่โฟลเดอร์ storage เท่านั้นที่แตะ localStorage ได้", () => {
    // ทั้งเกมต้องคุยกับที่เก็บข้อมูลผ่าน GameSaveRepository อย่างเดียว
    // ไม่งั้นวันที่เพิ่ม Cloud Save จะต้องไล่แก้ทุก component
    // และการอ่าน storage ตอน server render จะทำให้ Next.js พังทันที
    const offenders = findOffenders(
      /\b(localStorage|sessionStorage)\b/,
      (path) => path.startsWith("storage/"),
    );

    expect(offenders).toEqual([]);
  });

  it("การตัดคอมเมนต์ไม่ได้ทำให้กฎอ่อนลง", () => {
    // ถ้า stripComments เผลอกินโค้ดจริงไปด้วย กฎทั้งสามข้อข้างบนจะผ่านฟรี
    // โดยไม่มีใครรู้ เทสต์นี้จึงพิสูจน์ว่ามันยังจับของจริงได้
    const pattern = /\b(localStorage|sessionStorage)\b/;

    expect(pattern.test(stripComments("// อย่าใช้ localStorage"))).toBe(false);
    expect(pattern.test(stripComments("/* ห้ามแตะ localStorage */"))).toBe(false);
    expect(pattern.test(stripComments("const x = localStorage.getItem('k');"))).toBe(
      true,
    );
    expect(
      pattern.test(stripComments("window.localStorage.setItem('k', v); // เซฟ")),
    ).toBe(true);
  });

  it("component ห้าม import ค่าจาก domain/data ตรง ๆ — import type เท่านั้นที่ผ่านได้", () => {
    // ESLint (@typescript-eslint/no-restricted-imports) เป็นตัวบังคับจริง
    // อันนี้เป็นชั้นสำรองแบบเดียวกับกฎ localStorage ข้างบน
    const offenders: string[] = [];

    for (const file of collectTsFiles(join(srcDir, "components"))) {
      const relativePath = asPosix(relative(srcDir, file));
      if (relativePath.endsWith(".test.ts") || relativePath.endsWith(".test.tsx")) continue;
      const source = stripComments(readFileSync(file, "utf8"));
      const importLines = source.match(/^import[^\n]*from\s+["'][^"']+["'];?/gm) ?? [];

      for (const line of importLines) {
        if (/^import\s+type\b/.test(line.trim())) continue; // import type ผ่านได้
        const fromPath = line.match(/from\s+["']([^"']+)["']/)?.[1] ?? "";
        if (/(^|\/)(domain|data)\//.test(fromPath)) {
          offenders.push(`${relativePath}: ${line.trim()}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("ไม่มี dangerouslySetInnerHTML ที่ไหนใน src/ เลย", () => {
    // สูตรเคมี render จาก FormulaAst เท่านั้น ตามข้อห้ามตรง ๆ ในสเปก
    const offenders = findOffenders(/dangerouslySetInnerHTML/, () => false);
    expect(offenders).toEqual([]);
  });

  it("ไม่มีอิโมจิใน src/ — ไอคอนต้องมาจาก components/ui/Icon.tsx เท่านั้น", () => {
    // อิโมจิเรนเดอร์ต่างกันคนละระบบปฏิบัติการ ปรับสีตามโทเค็นไม่ได้ และ
    // screen reader อ่านชื่ออิโมจิออกมาเป็นคำที่ไม่เกี่ยวกับบริบท (เช่น "หยดน้ำ"
    // แทนที่จะเป็น "ยังคงอยู่ในสารละลาย") — ทั้งสามข้อขัดข้อบังคับ a11y ของสเปก
    const emoji =
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2705}\u{274C}\u{2713}\u{2714}\u{2717}\u{2718}\u{2605}\u{2606}]/u;
    const offenders = findOffenders(emoji, () => false);
    expect(offenders).toEqual([]);
  });

  it("โทเค็นสี 6 ตัวใน globals.css ตรงกับตาราง Design System ในสเปกเป๊ะ", () => {
    const css = readFileSync(join(srcDir, "app", "globals.css"), "utf8");
    const expected: Readonly<Record<string, string>> = {
      navy: "#082541",
      blue: "#1f5faa",
      green: "#2b8846",
      gold: "#f1be2d",
      canvas: "#eaf4fb",
      error: "#c63c45",
    };

    for (const [name, hex] of Object.entries(expected)) {
      const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
      expect(match?.[1]?.toLowerCase(), `--color-${name}`).toBe(hex);
    }
  });

  it("ไฟล์เสียงครบ 5 ไฟล์และรวมกันไม่เกิน 100 KB ตามงบ performance", () => {
    const audioDir = join(srcDir, "..", "public", "audio");
    expect(existsSync(audioDir), "public/audio/ ต้องมีอยู่ — รัน npm run gen:audio ก่อน").toBe(
      true,
    );

    const files = readdirSync(audioDir).filter((entry) => entry.endsWith(".wav"));
    expect(files).toHaveLength(5);

    const totalBytes = files.reduce(
      (sum, file) => sum + statSync(join(audioDir, file)).size,
      0,
    );
    expect(totalBytes).toBeLessThanOrEqual(100 * 1024);
  });

  it("ไม่มีข้อความไทยฝังใน src/components/ — ต้องมาจาก prop หรือ src/config/messages.ts", () => {
    const thaiPattern = /[\u0E01-\u0E5B]/;
    const offenders: string[] = [];

    // Allowlist: ไม่มี (ทุกข้อความย้ายไป src/config/messages.ts หรือรับผ่าน view/prop แล้ว)
    const allowlist = new Set<string>();

    for (const file of collectTsFiles(join(srcDir, "components"))) {
      const relativePath = asPosix(relative(srcDir, file));
      if (relativePath.endsWith(".test.ts") || relativePath.endsWith(".test.tsx")) continue;
      if (allowlist.has(relativePath)) continue;

      const code = stripComments(readFileSync(file, "utf8"));
      if (thaiPattern.test(code)) {
        offenders.push(relativePath);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("ไม่มี URL ของ Google Apps Script (script.google.com) ฮาร์ดโค้ดอยู่ใน src/ เลย", () => {
    // D-10: ห้ามใส่ URL ของ Apps Script endpoint ลง repo สาธารณะ ต้องใช้ env var
    const offenders = findOffenders(/script\.google\.com/, () => false);
    expect(offenders).toEqual([]);
  });
});
