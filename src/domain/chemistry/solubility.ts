import { getIon } from "./ions";
import type { IonDef, Phase } from "./types";

/**
 * กฎการละลาย 11 ข้อ เรียงตามลำดับความสำคัญ — ข้อที่อยู่บนสุดที่ตรงเงื่อนไขชนะ
 *
 * ไฟล์นี้คือ source of truth เดียวของ (aq) กับ (s) ทั้งเกม
 * ห้ามมีที่อื่นตัดสินเรื่องนี้อีก
 *
 * ลำดับสำคัญมาก:
 *  - ข้อ 1 ต้องมาก่อนข้อ 9 ไม่งั้น Na3PO4 กับ Na2CO3 ซึ่งเป็นสารตั้งต้น
 *    จะกลายเป็นตะกอน แล้วด่านฟอสเฟตพังทั้งหมด
 *  - ข้อ 3 ก่อนข้อ 4 ทำให้ AgCl/PbCl2 ตกตะกอน แต่ BaCl2/CaCl2 ละลาย
 *  - ข้อ 7 ก่อนข้อ 8 ทำให้ Ba(OH)2 ละลาย แต่ Mg(OH)2/Cu(OH)2 ตกตะกอน
 */

export type SolubilityRule = {
  /** เลขข้อ 1..11 ใช้อ้างอิงในเอกสารให้อาจารย์ตรวจและในคำใบ้ */
  index: number;
  descriptionTh: string;
  matches: (cation: IonDef, anion: IonDef) => boolean;
  phase: Phase;
};

const ALWAYS_SOLUBLE_CATIONS = new Set([
  "sodium-plus",
  "potassium-plus",
  "ammonium",
]);

const HALIDES = new Set(["chloride", "bromide", "iodide"]);

const HALIDE_PRECIPITATING_CATIONS = new Set(["silver-plus", "lead-2plus"]);

const SULFATE_PRECIPITATING_CATIONS = new Set([
  "barium-2plus",
  "lead-2plus",
  "calcium-2plus",
  "silver-plus",
]);

const THIOCYANATE_PRECIPITATING_CATIONS = new Set([
  "silver-plus",
  "lead-2plus",
]);

const INSOLUBLE_ANIONS = new Set(["carbonate", "phosphate", "sulfide"]);

export const SOLUBILITY_RULES: readonly SolubilityRule[] = [
  {
    index: 1,
    descriptionTh: "เกลือของ Na⁺, K⁺ และ NH₄⁺ ละลายน้ำได้ทั้งหมด",
    matches: (cation) => ALWAYS_SOLUBLE_CATIONS.has(cation.ionId),
    phase: "aq",
  },
  {
    index: 2,
    descriptionTh: "เกลือไนเตรต (NO₃⁻) ละลายน้ำได้ทั้งหมด",
    matches: (_cation, anion) => anion.ionId === "nitrate",
    phase: "aq",
  },
  {
    index: 3,
    descriptionTh:
      "เกลือคลอไรด์ โบรไมด์ และไอโอไดด์ ไม่ละลายเมื่อจับกับ Ag⁺ หรือ Pb²⁺",
    matches: (cation, anion) =>
      HALIDES.has(anion.ionId) && HALIDE_PRECIPITATING_CATIONS.has(cation.ionId),
    phase: "s",
  },
  {
    index: 4,
    descriptionTh: "เกลือคลอไรด์ โบรไมด์ และไอโอไดด์ อื่น ๆ ละลายน้ำได้",
    matches: (_cation, anion) => HALIDES.has(anion.ionId),
    phase: "aq",
  },
  {
    index: 5,
    descriptionTh:
      "เกลือซัลเฟต (SO₄²⁻) ไม่ละลายเมื่อจับกับ Ba²⁺, Pb²⁺, Ca²⁺ หรือ Ag⁺",
    matches: (cation, anion) =>
      anion.ionId === "sulfate" &&
      SULFATE_PRECIPITATING_CATIONS.has(cation.ionId),
    phase: "s",
  },
  {
    index: 6,
    descriptionTh: "เกลือซัลเฟตอื่น ๆ ละลายน้ำได้",
    matches: (_cation, anion) => anion.ionId === "sulfate",
    phase: "aq",
  },
  {
    index: 7,
    descriptionTh: "ไฮดรอกไซด์ของ Ba²⁺ ละลายน้ำได้",
    matches: (cation, anion) =>
      anion.ionId === "hydroxide" && cation.ionId === "barium-2plus",
    phase: "aq",
  },
  {
    index: 8,
    descriptionTh: "ไฮดรอกไซด์ (OH⁻) อื่น ๆ ไม่ละลายน้ำ",
    matches: (_cation, anion) => anion.ionId === "hydroxide",
    phase: "s",
  },
  {
    index: 9,
    descriptionTh:
      "เกลือคาร์บอเนต (CO₃²⁻) ฟอสเฟต (PO₄³⁻) และซัลไฟด์ (S²⁻) ไม่ละลายน้ำ ยกเว้นที่เข้าข้อ 1",
    matches: (_cation, anion) => INSOLUBLE_ANIONS.has(anion.ionId),
    phase: "s",
  },
  {
    index: 10,
    descriptionTh: "เกลือไทโอไซยาเนต (SCN⁻) ไม่ละลายเมื่อจับกับ Ag⁺ หรือ Pb²⁺",
    matches: (cation, anion) =>
      anion.ionId === "thiocyanate" &&
      THIOCYANATE_PRECIPITATING_CATIONS.has(cation.ionId),
    phase: "s",
  },
  {
    index: 11,
    descriptionTh: "เกลือไทโอไซยาเนตอื่น ๆ ละลายน้ำได้",
    matches: (_cation, anion) => anion.ionId === "thiocyanate",
    phase: "aq",
  },
];

/**
 * หากฎข้อแรกที่ตรงเงื่อนไข พร้อมสถานะที่ได้
 *
 * ใช้ตอน generate เอกสารให้อาจารย์ตรวจ เพราะต้องบอกได้ว่าแต่ละด่าน
 * ตัดสินด้วยกฎข้อไหน ไม่ใช่แค่บอกผลลัพธ์
 */
export function explainPhase(
  cationId: string,
  anionId: string,
): { phase: Phase; rule: SolubilityRule } {
  const cation = getIon(cationId);
  const anion = getIon(anionId);

  for (const rule of SOLUBILITY_RULES) {
    if (rule.matches(cation, anion)) {
      return { phase: rule.phase, rule };
    }
  }

  throw new Error(
    `ไม่มีกฎการละลายข้อใดครอบคลุมคู่ '${cationId}' กับ '${anionId}'`,
  );
}

export function resolvePhase(cationId: string, anionId: string): Phase {
  return explainPhase(cationId, anionId).phase;
}
