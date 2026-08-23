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
