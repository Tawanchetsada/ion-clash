import { describe, expect, it } from "vitest";
import { ALL_IONS } from "../domain/chemistry/ions";
import { chargeLabelTh, compoundSpeechTh, countLabelTh, ionSpeechTh, phaseLabelTh } from "./speech";
import type { CompoundDef } from "../domain/chemistry/types";

describe("ป้ายเสียงประจุและสถานะ", () => {
  it("ประจุบวก/ลบ อ่านเป็นคำไทยไม่ใช่ตัวเลขดิบ", () => {
    expect(chargeLabelTh(1)).toBe("ประจุบวกหนึ่ง");
    expect(chargeLabelTh(-1)).toBe("ประจุลบหนึ่ง");
    expect(chargeLabelTh(2)).toBe("ประจุบวกสอง");
    expect(chargeLabelTh(-3)).toBe("ประจุลบสาม");
  });

  it("สถานะ aq/s อ่านเป็นคำไทยเต็ม", () => {
    expect(phaseLabelTh("aq")).toBe("สถานะสารละลาย");
    expect(phaseLabelTh("s")).toBe("สถานะของแข็ง");
  });

  it("จำนวนหน่วยว่างเปล่าเมื่อมีหนึ่งหน่วย ไม่พูดซ้ำ", () => {
    expect(countLabelTh(1)).toBe("");
    expect(countLabelTh(2)).toBe("จำนวน 2 หน่วย");
  });
});

describe("ป้ายเสียงไอออน — ครบ 22 ตัวในทะเบียน", () => {
  it.each(ALL_IONS)("$ionId อ่านครบชื่อ ประจุ และสถานะ ไม่มี undefined หลุด", (ion) => {
    const label = ionSpeechTh(ion, "aq");
    expect(label).toContain(ion.nameTh);
    expect(label).not.toContain("undefined");
    expect(label).not.toContain("NaN");
    expect(label.length).toBeGreaterThan(0);
  });

  it("มีมากกว่าหนึ่งหน่วยแล้วบอกจำนวนด้วย", () => {
    const nitrate = ALL_IONS.find((ion) => ion.ionId === "nitrate");
    if (!nitrate) throw new Error("fixture ผิด");
    expect(ionSpeechTh(nitrate, "aq", 2)).toBe(
      "ไนเตรตไอออน จำนวน 2 หน่วย ประจุลบหนึ่ง สถานะสารละลาย",
    );
  });
});

describe("ป้ายเสียงสารประกอบ", () => {
  it("ไม่มีคำว่าประจุ เพราะประจุรวมของสารประกอบเป็นศูนย์เสมอ", () => {
    const compound: CompoundDef = {
      compoundId: "silver-plus__chloride",
      cationId: "silver-plus",
      anionId: "chloride",
      cationCount: 1,
      anionCount: 1,
      phase: "s",
      formula: [],
      nameTh: "ซิลเวอร์คลอไรด์",
      atoms: { Ag: 1, Cl: 1 },
    };
    const label = compoundSpeechTh(compound);
    expect(label).toBe("ซิลเวอร์คลอไรด์ สถานะของแข็ง");
    expect(label).not.toContain("ประจุ");
  });
});
