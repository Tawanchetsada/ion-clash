import { describe, expect, it } from "vitest";
import { SOLUBILITY_RULES } from "../domain/chemistry/solubility";
import { solubilityTableView } from "./solubility";

describe("solubilityTableView", () => {
  it("มีจำนวนแถวเท่ากับ SOLUBILITY_RULES.length (11 ข้อ)", () => {
    const table = solubilityTableView();
    expect(table).toHaveLength(SOLUBILITY_RULES.length);
    expect(table).toHaveLength(11);
  });

  it("ลำดับและข้อความตรงกับ SOLUBILITY_RULES ทุกข้อ", () => {
    const table = solubilityTableView();
    table.forEach((row, index) => {
      const originalRule = SOLUBILITY_RULES[index];
      expect(originalRule).toBeDefined();
      if (!originalRule) return;
      expect(row.order).toBe(originalRule.index);
      expect(row.descriptionTh).toBe(originalRule.descriptionTh);
      expect(row.outcomeTh).toBe(originalRule.phase === "aq" ? "ละลาย" : "ไม่ละลาย");
    });
  });
});
