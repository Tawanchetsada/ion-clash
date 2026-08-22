import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { formulaToPlainText, renderIon } from "../src/domain/chemistry/formula";
import { getIon } from "../src/domain/chemistry/ions";
import { explainPhase, SOLUBILITY_RULES } from "../src/domain/chemistry/solubility";
import type { CompoundDef, EquationTerm } from "../src/domain/chemistry/types";
import { LEVELS } from "../src/data/levels";

/**
 * สร้าง docs/chemistry-review.md จากข้อมูลด่านจริงใน src/data/levels.ts
 * ตาม development-plan/03-phase-2-level-data.md ข้อ 2.4 — ต้อง generate
 * ไม่พิมพ์มือ เพื่อให้สิ่งที่อาจารย์เซ็นตรงกับสิ่งที่โปรแกรมใช้จริง 100%
 */

function compoundText(compound: CompoundDef, coefficient: number): string {
  const prefix = coefficient > 1 ? String(coefficient) : "";
  return `${prefix}${formulaToPlainText(compound.formula)}(${compound.phase})`;
}

function termText(term: EquationTerm): string {
  if (term.kind === "compound") {
    return compoundText(term.compound, term.count);
  }
  return formulaToPlainText(renderIon(getIon(term.ionId), term.count)) + "(aq)";
}

function equationText(reactants: readonly EquationTerm[], products: readonly EquationTerm[]): string {
  return `${reactants.map(termText).join(" + ")} -> ${products.map(termText).join(" + ")}`;
}

function molecularEquationText(level: (typeof LEVELS)[number]): string {
  const { a, b, c, d } = level.coefficients;
  return [
    compoundText(level.reactantA, a),
    " + ",
    compoundText(level.reactantB, b),
    " -> ",
    compoundText(level.productA, c),
    " + ",
    compoundText(level.productB, d),
  ].join("");
}

function levelSection(level: (typeof LEVELS)[number]): string {
  const { rule } = explainPhase(level.precipitate.cationId, level.precipitate.anionId);
  const spectatorText = level.spectators
    .map((spectator) => `${formulaToPlainText(renderIon(getIon(spectator.ionId), spectator.count))}(aq)`)
    .join(", ");

  return [
    `### ด่าน ${String(level.id).padStart(2, "0")} · ${level.difficulty}`,
    "",
    `1. **สมการโมเลกุลที่ดุลแล้ว:** ${molecularEquationText(level)}`,
    `2. **สมการไอออนิกสมบูรณ์:** ${equationText(level.completeIonic.reactants, level.completeIonic.products)}`,
    `3. **สมการไอออนิกสุทธิ:** ${equationText(level.netIonic.reactants, level.netIonic.products)}`,
    `4. **ตะกอน:** ${formulaToPlainText(level.precipitate.formula)}(s) — เข้ากฎข้อ ${rule.index}: ${rule.descriptionTh}`,
    `5. **ไอออนผู้ชม:** ${spectatorText}`,
    `6. **คำใบ้ระดับ 1:** ${level.hints[0]}`,
    `   **คำใบ้ระดับ 2:** ${level.hints[1]}`,
    `   **คำใบ้ระดับ 3:** ${level.hints[2]}`,
    `7. **ผลตรวจ:** [ ] ผ่าน · [ ] แก้ไข (ระบุ: ______________________) · [ ] ตัดออก`,
    "",
  ].join("\n");
}

function solubilityRuleTable(): string {
  const header = "| ข้อ | รายละเอียด | สถานะ |\n|---|---|---|";
  const rows = SOLUBILITY_RULES.map(
    (rule) => `| ${rule.index} | ${rule.descriptionTh} | ${rule.phase === "s" ? "ตกตะกอน" : "ละลายน้ำ"} |`,
  );
  return [header, ...rows].join("\n");
}

function buildDocument(): string {
  return [
    "# เอกสารตรวจสอบสมการเคมี 50 ด่าน — Ion Clash",
    "",
    "> สร้างอัตโนมัติจาก `src/data/levels.ts` ด้วย `npm run gen:review`",
    "> ห้ามแก้ไขไฟล์นี้ตรง ๆ — แก้ที่ข้อมูลด่านหรือกฎการละลายแล้วรันคำสั่งใหม่",
    ">",
    "> ตาม D-01: ร่างจากกฎการละลายมาตรฐาน ม.4 ยังไม่ผ่านการรับรอง ต้องได้ลายเซ็น",
    "> ผู้เชี่ยวชาญก่อนใช้ในการทดลองจริง",
    "",
    "## จุดที่ต้องให้อาจารย์ตัดสินเป็นพิเศษ (ดู D-15 และ development-plan/03-phase-2-level-data.md ข้อ 2.3)",
    "",
    "PbCl2 (ด่าน 14), PbSO4 (ด่าน 20), MgCO3 (ด่าน 18), FeS/CuS (ด่าน 19, 38), Fe(OH)2 (ด่าน 26, 27) — ",
    "ถูกต้องตามกฎการละลายมาตรฐาน ม.4 แต่มีตำราบางเล่มจัดต่างกัน โปรดตรวจเป็นพิเศษ",
    "",
    "---",
    "",
    ...LEVELS.map(levelSection),
    "---",
    "",
    "## ตารางกฎการละลาย 11 ข้อ (ลำดับมีผล — ข้อบนสุดที่ตรงเงื่อนไขชนะ)",
    "",
    solubilityRuleTable(),
    "",
    "---",
    "",
    "## ลงชื่อผู้ตรวจ",
    "",
    "ชื่อ-สกุล: ________________________________  ตำแหน่ง: ________________________________",
    "",
    "ลายเซ็น: ________________________________  วันที่: ________________________________",
    "",
  ].join("\n");
}

function main(): void {
  const outputPath = join(import.meta.dirname, "..", "docs", "chemistry-review.md");
  writeFileSync(outputPath, buildDocument(), "utf8");
  console.log(`เขียนเอกสารแล้ว: ${outputPath}`);
  console.log(`จำนวนด่าน: ${LEVELS.length}`);
}

main();
