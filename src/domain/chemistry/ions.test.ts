import { describe, expect, it } from "vitest";
import { ALL_IONS, ANIONS, CATIONS, getIon, isAnion, isCation } from "./ions";

describe("ทะเบียนไอออน", () => {
  it("มีไอออนบวก 12 ตัวและไอออนลบ 10 ตัว", () => {
    expect(CATIONS).toHaveLength(12);
    expect(ANIONS).toHaveLength(10);
    expect(ALL_IONS).toHaveLength(22);
  });

  it("ionId ไม่ซ้ำกัน", () => {
    const ids = ALL_IONS.map((ion) => ion.ionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ไอออนบวกมีประจุเป็นบวก ไอออนลบมีประจุเป็นลบ", () => {
    expect(CATIONS.every(isCation)).toBe(true);
    expect(ANIONS.every(isAnion)).toBe(true);
  });

  it("ทุกตัวมีชื่อไทย ชื่อประกอบ และจำนวนอะตอมครบ", () => {
    for (const ion of ALL_IONS) {
      expect(ion.nameTh.length).toBeGreaterThan(0);
      expect(ion.nameStemTh.length).toBeGreaterThan(0);
      expect(ion.core.length).toBeGreaterThan(0);
      expect(Object.keys(ion.atoms).length).toBeGreaterThan(0);
      for (const count of Object.values(ion.atoms)) {
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  it("แยก Fe²⁺ กับ Fe³⁺ ด้วยประจุ ไม่ใช่สูตร", () => {
    const ironTwo = getIon("iron-2plus");
    const ironThree = getIon("iron-3plus");

    expect(ironTwo.core).toBe(ironThree.core);
    expect(ironTwo.charge).not.toBe(ironThree.charge);
  });

  it("ไม่มีไอออนที่ตัดออกตาม D-02 หลงเหลืออยู่", () => {
    const ids = ALL_IONS.map((ion) => ion.ionId);
    expect(ids).not.toContain("oxide");
    expect(ids).not.toContain("manganate");
    expect(ids).not.toContain("cyanide");
  });

  it("getIon โยน error เมื่อไม่พบไอออน", () => {
    expect(() => getIon("unobtainium")).toThrow(/unobtainium/);
  });
});
