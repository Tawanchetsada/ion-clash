import { describe, expect, it } from "vitest";
import { buildCompound, buildCompoundById, compoundNetCharge } from "./compounds";
import { formulaToPlainText, renderIon } from "./formula";
import { ANIONS, CATIONS, getIon } from "./ions";

const plain = (cationId: string, anionId: string): string =>
  formulaToPlainText(buildCompoundById(cationId, anionId).formula);

describe("สร้างสารประกอบด้วยการไขว้ประจุ", () => {
  it("ทั้ง 120 คู่ได้ประจุรวมเป็นศูนย์", () => {
    let pairs = 0;
    for (const cation of CATIONS) {
      for (const anion of ANIONS) {
        const compound = buildCompound(cation, anion);
        expect(compoundNetCharge(compound)).toBe(0);
        expect(compound.cationCount).toBeGreaterThan(0);
        expect(compound.anionCount).toBeGreaterThan(0);
        pairs += 1;
      }
    }
    expect(pairs).toBe(120);
  });

  it("ใส่วงเล็บให้ไอออนหลายอะตอมเมื่อจำนวนมากกว่า 1", () => {
    expect(plain("calcium-2plus", "nitrate")).toBe("Ca(NO3)2");
    expect(plain("aluminium-3plus", "sulfate")).toBe("Al2(SO4)3");
    expect(plain("calcium-2plus", "phosphate")).toBe("Ca3(PO4)2");
    expect(plain("magnesium-2plus", "hydroxide")).toBe("Mg(OH)2");
    expect(plain("ammonium", "sulfate")).toBe("(NH4)2SO4");
  });

  it("ไม่ใส่วงเล็บให้ไอออนอะตอมเดี่ยว", () => {
    expect(plain("lead-2plus", "chloride")).toBe("PbCl2");
    expect(plain("iron-3plus", "chloride")).toBe("FeCl3");
    expect(plain("silver-plus", "sulfide")).toBe("Ag2S");
  });

  it("ลดอัตราส่วนด้วย gcd — MgCO₃ ไม่ใช่ Mg₂(CO₃)₂", () => {
    expect(plain("magnesium-2plus", "carbonate")).toBe("MgCO3");
    expect(plain("barium-2plus", "sulfate")).toBe("BaSO4");
    expect(plain("iron-3plus", "phosphate")).toBe("FePO4");
    expect(plain("calcium-2plus", "sulfide")).toBe("CaS");
  });

  it("สร้างสูตร 1:1 ที่ไม่ต้องลดอัตราส่วน", () => {
    expect(plain("silver-plus", "chloride")).toBe("AgCl");
    expect(plain("sodium-plus", "nitrate")).toBe("NaNO3");
  });

  it("อ่านสถานะจากกฎการละลาย ไม่ใช่จากสูตร", () => {
    expect(buildCompoundById("silver-plus", "chloride").phase).toBe("s");
    expect(buildCompoundById("sodium-plus", "nitrate").phase).toBe("aq");
  });

  it("รวมจำนวนอะตอมตามจำนวนหน่วยไอออน", () => {
    expect(buildCompoundById("calcium-2plus", "nitrate").atoms).toEqual({
      Ca: 1,
      N: 2,
      O: 6,
    });
    expect(buildCompoundById("aluminium-3plus", "sulfate").atoms).toEqual({
      Al: 2,
      S: 3,
      O: 12,
    });
    expect(buildCompoundById("calcium-2plus", "phosphate").atoms).toEqual({
      Ca: 3,
      P: 2,
      O: 8,
    });
  });

  it("ตั้งชื่อไทยของสารประกอบจากชื่อประกอบของไอออน", () => {
    expect(buildCompoundById("silver-plus", "chloride").nameTh).toBe(
      "ซิลเวอร์คลอไรด์",
    );
    expect(buildCompoundById("copper-2plus", "hydroxide").nameTh).toBe(
      "คอปเปอร์(II)ไฮดรอกไซด์",
    );
  });

  it("ปฏิเสธการสลับบวกลบ", () => {
    const chloride = getIon("chloride");
    const silver = getIon("silver-plus");
    expect(() => buildCompound(chloride, silver)).toThrow();
  });
});

describe("สูตรของไอออนเดี่ยว", () => {
  it("แสดงประจุเป็นตัวยก", () => {
    expect(formulaToPlainText(renderIon(getIon("silver-plus")))).toBe("Ag+");
    expect(formulaToPlainText(renderIon(getIon("sulfate")))).toBe("SO42-");
    expect(formulaToPlainText(renderIon(getIon("phosphate")))).toBe("PO43-");
  });

  it("ขึ้นต้นด้วยจำนวนเมื่อมากกว่า 1", () => {
    expect(formulaToPlainText(renderIon(getIon("nitrate"), 2))).toBe("2NO3-");
    expect(formulaToPlainText(renderIon(getIon("chloride"), 6))).toBe("6Cl-");
  });

  it("แยกตัวห้อยกับตัวยกออกจากกันใน AST", () => {
    const ast = renderIon(getIon("sulfate"), 3);
    expect(ast).toEqual([
      { kind: "text", value: "3" },
      { kind: "text", value: "SO" },
      { kind: "sub", value: "4" },
      { kind: "sup", value: "2-" },
    ]);
  });

  it("ปฏิเสธจำนวนที่ไม่ใช่จำนวนเต็มบวก", () => {
    expect(() => renderIon(getIon("chloride"), 0)).toThrow();
    expect(() => renderIon(getIon("chloride"), 1.5)).toThrow();
  });
});
