import { SOLUBILITY_RULES } from "../domain/chemistry/solubility";

export type SolubilityRuleView = {
  /** ลำดับที่ใช้ตัดสินจริง (1..11) — ลำดับเป็นสาระ ไม่ใช่แค่การเรียง */
  order: number;
  descriptionTh: string;
  phase: "aq" | "s";
  outcomeTh: "ละลาย" | "ไม่ละลาย";
};

/**
 * สร้าง view model ของตารางกฎการละลายจาก SOLUBILITY_RULES ในชั้น domain
 * ทุกกฎตามลำดับจริง ห้ามเรียงใหม่ ห้ามตัดข้อ
 */
export function solubilityTableView(): readonly SolubilityRuleView[] {
  return SOLUBILITY_RULES.map((rule) => ({
    order: rule.index,
    descriptionTh: rule.descriptionTh,
    phase: rule.phase,
    outcomeTh: rule.phase === "aq" ? "ละลาย" : "ไม่ละลาย",
  }));
}

export type SolubilityGuideRule = {
  id: number;
  title: string;
  general: string;
  exception?: string;
  normalStatus: string;
  exceptionStatus?: string;
  isNormalSoluble: boolean;
};

export const SOLUBILITY_7_RULES: readonly SolubilityGuideRule[] = [
  {
    id: 1,
    title: "ข้อ 1 — เกลือของ Na⁺, K⁺ และ NH₄⁺",
    general: "เกลือที่มี Na⁺, K⁺ หรือ NH₄⁺ ละลายน้ำได้เสมอ",
    normalStatus: "ละลาย (aq)",
    isNormalSoluble: true,
  },
  {
    id: 2,
    title: "ข้อ 2 — เกลือไนเตรต",
    general: "เกลือที่มีไอออน NO₃⁻ ละลายน้ำได้เสมอ",
    normalStatus: "ละลาย (aq)",
    isNormalSoluble: true,
  },
  {
    id: 3,
    title: "ข้อ 3 — เกลือคลอไรด์ โบรไมด์ และไอโอไดด์",
    general: "เกลือที่มี Cl⁻, Br⁻ หรือ I⁻ โดยทั่วไปละลายน้ำได้",
    exception: "เมื่อจับกับ Ag⁺ หรือ Pb²⁺ จะเกิดตะกอน",
    normalStatus: "ละลาย (aq)",
    exceptionStatus: "ตะกอน (s)",
    isNormalSoluble: true,
  },
  {
    id: 4,
    title: "ข้อ 4 — เกลือซัลเฟต",
    general: "เกลือที่มี SO₄²⁻ โดยทั่วไปละลายน้ำได้",
    exception: "เมื่อจับกับ Ba²⁺, Pb²⁺ หรือ Ca²⁺ ให้ถือว่าเกิดตะกอน",
    normalStatus: "ละลาย (aq)",
    exceptionStatus: "ตะกอน (s)",
    isNormalSoluble: true,
  },
  {
    id: 5,
    title: "ข้อ 5 — เกลือไฮดรอกไซด์",
    general: "เกลือที่มี OH⁻ โดยทั่วไปไม่ละลายน้ำและเกิดตะกอน",
    exception: "เมื่อจับกับ Na⁺, K⁺, NH₄⁺ หรือ Ba²⁺ จะละลายน้ำ",
    normalStatus: "ตะกอน (s)",
    exceptionStatus: "ละลาย (aq)",
    isNormalSoluble: false,
  },
  {
    id: 6,
    title: "ข้อ 6 — เกลือคาร์บอเนต ฟอสเฟต และซัลไฟด์",
    general: "เกลือที่มี CO₃²⁻, PO₄³⁻ หรือ S²⁻ โดยทั่วไปไม่ละลายน้ำและเกิดตะกอน",
    exception: "เมื่อจับกับ Na⁺, K⁺ หรือ NH₄⁺ จะละลายน้ำ",
    normalStatus: "ตะกอน (s)",
    exceptionStatus: "ละลาย (aq)",
    isNormalSoluble: false,
  },
  {
    id: 7,
    title: "ข้อ 7 — เกลือไทโอไซยาเนต",
    general: "เกลือที่มี SCN⁻ โดยทั่วไปละลายน้ำได้",
    exception: "เมื่อจับกับ Ag⁺ หรือ Pb²⁺ จะเกิดตะกอน",
    normalStatus: "ละลาย (aq)",
    exceptionStatus: "ตะกอน (s)",
    isNormalSoluble: true,
  },
];

