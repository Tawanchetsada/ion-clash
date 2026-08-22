import { describe, expect, it } from "vitest";
import { ANIONS, CATIONS } from "./ions";
import { SOLUBILITY_RULES, explainPhase, resolvePhase } from "./solubility";

describe("กฎการละลาย", () => {
  it("มีกฎครบ 11 ข้อ เรียงเลขต่อเนื่อง", () => {
    expect(SOLUBILITY_RULES).toHaveLength(11);
    expect(SOLUBILITY_RULES.map((rule) => rule.index)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it("ครอบคลุมคู่ไอออนครบทั้ง 120 คู่", () => {
    let pairs = 0;
    for (const cation of CATIONS) {
      for (const anion of ANIONS) {
        const { phase } = explainPhase(cation.ionId, anion.ionId);
        expect(phase === "aq" || phase === "s").toBe(true);
        pairs += 1;
      }
    }
    expect(pairs).toBe(120);
  });

  // ลำดับกฎคือหัวใจ — เคสเหล่านี้จะพังทันทีถ้ามีคนสลับลำดับกฎ
  describe("ลำดับกฎ", () => {
    it("ข้อ 1 มาก่อนข้อ 9: เกลือของ Na⁺ ละลายแม้จับกับ PO₄³⁻ หรือ CO₃²⁻", () => {
      expect(resolvePhase("sodium-plus", "phosphate")).toBe("aq");
      expect(resolvePhase("sodium-plus", "carbonate")).toBe("aq");
      expect(resolvePhase("sodium-plus", "sulfide")).toBe("aq");
      expect(resolvePhase("potassium-plus", "phosphate")).toBe("aq");
    });

    it("ข้อ 3 มาก่อนข้อ 4: AgCl กับ PbI₂ ตกตะกอน แต่ BaCl₂ ละลาย", () => {
      expect(resolvePhase("silver-plus", "chloride")).toBe("s");
      expect(resolvePhase("lead-2plus", "iodide")).toBe("s");
      expect(resolvePhase("barium-2plus", "chloride")).toBe("aq");
      expect(resolvePhase("calcium-2plus", "chloride")).toBe("aq");
      expect(resolvePhase("magnesium-2plus", "chloride")).toBe("aq");
    });

    it("ข้อ 7 มาก่อนข้อ 8: Ba(OH)₂ ละลาย แต่ไฮดรอกไซด์อื่นตกตะกอน", () => {
      expect(resolvePhase("barium-2plus", "hydroxide")).toBe("aq");
      expect(resolvePhase("magnesium-2plus", "hydroxide")).toBe("s");
      expect(resolvePhase("copper-2plus", "hydroxide")).toBe("s");
      expect(resolvePhase("iron-3plus", "hydroxide")).toBe("s");
    });

    it("ข้อ 5 มาก่อนข้อ 6: BaSO₄ ตกตะกอน แต่ MgSO₄ ละลาย", () => {
      expect(resolvePhase("barium-2plus", "sulfate")).toBe("s");
      expect(resolvePhase("lead-2plus", "sulfate")).toBe("s");
      expect(resolvePhase("magnesium-2plus", "sulfate")).toBe("aq");
      expect(resolvePhase("copper-2plus", "sulfate")).toBe("aq");
      expect(resolvePhase("iron-2plus", "sulfate")).toBe("aq");
    });

    it("ข้อ 10 มาก่อนข้อ 11: AgSCN ตกตะกอน แต่ NaSCN ละลาย", () => {
      expect(resolvePhase("silver-plus", "thiocyanate")).toBe("s");
      expect(resolvePhase("sodium-plus", "thiocyanate")).toBe("aq");
    });

    it("ไนเตรตละลายเสมอ", () => {
      for (const cation of CATIONS) {
        expect(resolvePhase(cation.ionId, "nitrate")).toBe("aq");
      }
    });
  });

  it("บอกได้ว่าตัดสินด้วยกฎข้อไหน สำหรับเอกสารให้อาจารย์ตรวจ", () => {
    expect(explainPhase("silver-plus", "chloride").rule.index).toBe(3);
    expect(explainPhase("sodium-plus", "phosphate").rule.index).toBe(1);
    expect(explainPhase("barium-2plus", "sulfate").rule.index).toBe(5);
    expect(explainPhase("magnesium-2plus", "carbonate").rule.index).toBe(9);
  });
});
