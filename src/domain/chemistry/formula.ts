import type { AtomCounts, FormulaAst, FormulaPart, IonDef } from "./types";

/**
 * สร้าง AST ของสูตรเคมี — presentation ล้วน ๆ
 *
 * คืนเป็น AST ไม่ใช่สตริง เพราะ spec ห้าม parse HTML เพื่อ render สูตร
 * และต้องสร้าง aria-label ภาษาไทยจากแหล่งข้อมูลเดียวกับภาพที่เห็น
 * ถ้าวันหนึ่งเปลี่ยนวิธี render ตรรกะเคมีต้องไม่พัง
 */

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

export function gcdAll(values: readonly number[]): number {
  return values.reduce((acc, value) => gcd(acc, value), 0);
}

/**
 * แยก core เป็นช่วงตัวอักษรกับช่วงตัวเลข เช่น 'NO3' -> [text 'NO', sub '3']
 *
 * เป็นการแปลงเพื่อการแสดงผลเท่านั้น ไม่ได้ใช้ตัดสินเคมีใด ๆ
 * จำนวนอะตอมจริงอ่านจากฟิลด์ `atoms` เสมอ
 */
function tokenizeCore(core: string): FormulaPart[] {
  const parts: FormulaPart[] = [];
  let buffer = "";
  let bufferIsDigit = false;

  for (const ch of core) {
    const isDigit = ch >= "0" && ch <= "9";
    if (buffer !== "" && isDigit !== bufferIsDigit) {
      parts.push({ kind: bufferIsDigit ? "sub" : "text", value: buffer });
      buffer = "";
    }
    buffer += ch;
    bufferIsDigit = isDigit;
  }

  if (buffer !== "") {
    parts.push({ kind: bufferIsDigit ? "sub" : "text", value: buffer });
  }

  return parts;
}

function chargeLabel(charge: number): string {
  const sign = charge > 0 ? "+" : "-";
  const magnitude = Math.abs(charge);
  return magnitude === 1 ? sign : `${magnitude}${sign}`;
}

/**
 * สูตรของไอออนเดี่ยว พร้อมประจุเป็นตัวยก
 * `count` มากกว่า 1 จะขึ้นต้นด้วยตัวเลข เช่น 2NO₃⁻
 */
export function renderIon(ion: IonDef, count = 1): FormulaAst {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`จำนวนไอออนต้องเป็นจำนวนเต็มบวก ได้รับ ${count}`);
  }

  const parts: FormulaPart[] = [];
  if (count > 1) {
    parts.push({ kind: "text", value: String(count) });
  }
  parts.push(...tokenizeCore(ion.core));
  parts.push({ kind: "sup", value: chargeLabel(ion.charge) });
  return parts;
}

/**
 * ส่วนของไอออนหนึ่งตัวภายในสูตรสารประกอบ (ไม่มีประจุ)
 * ใส่วงเล็บเมื่อเป็นไอออนหลายอะตอมและมีจำนวนมากกว่า 1
 */
function renderIonInCompound(ion: IonDef, count: number): FormulaPart[] {
  const core = tokenizeCore(ion.core);

  if (count === 1) {
    return core;
  }

  const parts: FormulaPart[] = ion.polyatomic
    ? [
        { kind: "text", value: "(" },
        ...core,
        { kind: "text", value: ")" },
      ]
    : [...core];

  parts.push({ kind: "sub", value: String(count) });
  return parts;
}

export function renderCompoundFormula(
  cation: IonDef,
  anion: IonDef,
  cationCount: number,
  anionCount: number,
): FormulaAst {
  return [
    ...renderIonInCompound(cation, cationCount),
    ...renderIonInCompound(anion, anionCount),
  ];
}

/**
 * แปลง AST เป็นข้อความล้วนสำหรับ test และเอกสารให้อาจารย์ตรวจ
 * เช่น 'Ca(NO3)2' — ตัวห้อยและตัวยกถูกทำให้แบน
 */
export function formulaToPlainText(ast: FormulaAst): string {
  return ast.map((part) => part.value).join("");
}

/**
 * รวมจำนวนอะตอมจากไอออนหลายตัว โดยคูณตามจำนวนหน่วย
 * ใช้ตรวจการอนุรักษ์อะตอมในการดุลสมการ
 */
export function combineAtoms(
  entries: ReadonlyArray<{ atoms: AtomCounts; multiplier: number }>,
): AtomCounts {
  const total: Record<string, number> = {};

  for (const { atoms, multiplier } of entries) {
    for (const [element, count] of Object.entries(atoms)) {
      total[element] = (total[element] ?? 0) + count * multiplier;
    }
  }

  return total;
}
