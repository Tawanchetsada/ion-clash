/**
 * Type ร่วมของโดเมนเคมีทั้งหมด
 *
 * หลักการเหล็ก: ทุกการตัดสินใจทางเคมีต้องอ่านจากฟิลด์ที่มีโครงสร้าง
 * (ionId, charge, atoms, count) เท่านั้น — `formula` เป็น presentation
 * ล้วน ๆ ห้ามนำไป parse เพื่อตัดสินอะไรทั้งสิ้น
 */

export type Phase = "aq" | "s";

/**
 * รหัสข้อผิดพลาดทั้งหมด — เป็นค่าคงที่ตอนรันไทม์ ไม่ใช่แค่ type
 * เพราะทั้ง save schema และ reducer ต้องสร้าง record ที่มีครบทุกรหัส
 * ถ้าเป็น union เขียนมืออย่างเดียว วันที่เพิ่มรหัสใหม่จะมีที่ที่ลืมเติม
 */
export const ERROR_CODES = [
  "E-CHARGE",
  "E-PAIR",
  "E-PHASE",
  "E-BALANCE",
  "E-RATIO",
  "E-SPECTATOR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** จำนวนครั้งที่ผิดแยกตามรหัส — มีครบทุกรหัสเสมอ ป้อนสถิติงานวิจัย Phase 9 */
export type ErrorTally = Readonly<Record<ErrorCode, number>>;

/** tally เปล่าที่มีครบทุกรหัส — ค่าเริ่มต้นที่ถูกต้องเพียงค่าเดียว */
export function emptyErrorTally(): ErrorTally {
  const tally = {} as Record<ErrorCode, number>;
  for (const code of ERROR_CODES) {
    tally[code] = 0;
  }
  return tally;
}

export type ValidationResult = { ok: true } | { ok: false; code: ErrorCode };

export type Coefficients = { a: number; b: number; c: number; d: number };

/** จำนวนอะตอมแยกตามสัญลักษณ์ธาตุ เช่น { N: 1, O: 3 } */
export type AtomCounts = Readonly<Record<string, number>>;

export type IonDef = {
  ionId: string;
  /** สูตรที่ยังไม่มีประจุ เช่น 'Ag', 'NO3' */
  core: string;
  charge: number;
  /** ชื่อเรียกไอออน เช่น 'ซิลเวอร์(I) ไอออน' */
  nameTh: string;
  /** ส่วนที่ใช้ประกอบชื่อสารประกอบ เช่น 'ซิลเวอร์' + 'คลอไรด์' */
  nameStemTh: string;
  /** ต้องใส่วงเล็บเมื่อ subscript > 1 */
  polyatomic: boolean;
  atoms: AtomCounts;
};

export type FormulaPart =
  | { kind: "text"; value: string }
  | { kind: "sub"; value: string }
  | { kind: "sup"; value: string };

export type FormulaAst = readonly FormulaPart[];

export type CompoundDef = {
  compoundId: string;
  cationId: string;
  anionId: string;
  cationCount: number;
  anionCount: number;
  phase: Phase;
  /** presentation เท่านั้น */
  formula: FormulaAst;
  nameTh: string;
  atoms: AtomCounts;
};

/**
 * ไอออนพร้อมจำนวนหน่วยในสมการไอออนิก
 *
 * ชั้นโดเมนใช้ term ไม่ใช่ instance เพราะ instanceId มีไว้ให้ UI แยกการ์ด
 * ที่ซ้ำกัน ซึ่งเป็นเรื่อง presentation — Phase 2/6 ค่อยขยาย term เป็น instance
 */
export type IonTerm = {
  ionId: string;
  count: number;
  phase: Phase;
};

export type ReactionModel = {
  reactantA: CompoundDef;
  reactantB: CompoundDef;
  productA: CompoundDef;
  productB: CompoundDef;
  coefficients: Coefficients;
};

export type SpectatorPair = {
  ionId: string;
  charge: number;
  phase: Phase;
  /** จำนวนที่ปรากฏ ต้องเท่ากันทั้งสองข้างเสมอ */
  count: number;
};

/** พจน์หนึ่งตัวในสมการไอออนิก — เป็นไอออนอิสระ หรือสารประกอบที่ไม่แตกตัว */
export type EquationTerm =
  | { kind: "ion"; ionId: string; count: number; phase: Phase }
  | { kind: "compound"; compound: CompoundDef; count: number };

export type IonicEquation = {
  reactants: readonly EquationTerm[];
  products: readonly EquationTerm[];
};

export type NetIonicEquation = IonicEquation;
