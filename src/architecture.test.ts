import { readdirSync, readFileSync, statSync } from "node:fs";
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
});
