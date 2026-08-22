import { describe, expect, it } from "vitest";
import { formulaToPlainText, gcdAll } from "../domain/chemistry/formula";
import { getIon } from "../domain/chemistry/ions";
import { termsCharge, termsToAtoms } from "../domain/chemistry/netIonic";
import { expectedDifficulty, LEVELS } from "./levels";

function atomsEqual(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
): boolean {
  const elements = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...elements].every(
    (element) => (left[element] ?? 0) === (right[element] ?? 0),
  );
}

describe("ข้อมูล 50 ด่าน", () => {
  it("กฎ 1 · มี id ครบ 1 ถึง 50 ไม่ซ้ำ ไม่ขาด", () => {
    const ids = LEVELS.map((level) => level.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));
  });

  it.each(LEVELS)("ด่าน $id — กฎ 2 · สารตั้งต้นทั้งสองตัวเป็น (aq)", (level) => {
    expect(level.reactantA.phase).toBe("aq");
    expect(level.reactantB.phase).toBe("aq");
  });

  it.each(LEVELS)("ด่าน $id — กฎ 3 · ผลิตภัณฑ์เป็นตะกอนตรง 1 ตัว", (level) => {
    const solidCount = [level.productA, level.productB].filter(
      (product) => product.phase === "s",
    ).length;
    expect(solidCount).toBe(1);
    expect(level.precipitate.phase).toBe("s");
  });

  it.each(LEVELS)("ด่าน $id — กฎ 4 · ผลิตภัณฑ์อีกตัวละลายน้ำและแตกตัวในสมการสมบูรณ์", (level) => {
    expect(level.aqueousProduct.phase).toBe("aq");
    const dissolvedIonIds = level.completeIonic.products
      .filter((term) => term.kind === "ion")
      .map((term) => term.ionId);
    expect(dissolvedIonIds).toContain(level.aqueousProduct.cationId);
    expect(dissolvedIonIds).toContain(level.aqueousProduct.anionId);
  });

  it.each(LEVELS)("ด่าน $id — กฎ 5 · สมการดุลแล้วเป็นอัตราส่วนต่ำสุด", (level) => {
    const { a, b, c, d } = level.coefficients;
    expect(gcdAll([a, b, c, d])).toBe(1);
  });

  it.each(LEVELS)("ด่าน $id — กฎ 6 · จำนวนอะตอมทุกธาตุเท่ากันสองข้าง", (level) => {
    const { a, b, c, d } = level.coefficients;
    const left: Record<string, number> = {};
    const right: Record<string, number> = {};
    for (const [atoms, count] of [
      [level.reactantA.atoms, a],
      [level.reactantB.atoms, b],
    ] as const) {
      for (const [element, n] of Object.entries(atoms)) {
        left[element] = (left[element] ?? 0) + n * count;
      }
    }
    for (const [atoms, count] of [
      [level.productA.atoms, c],
      [level.productB.atoms, d],
    ] as const) {
      for (const [element, n] of Object.entries(atoms)) {
        right[element] = (right[element] ?? 0) + n * count;
      }
    }
    expect(atomsEqual(left, right)).toBe(true);
  });

  it.each(LEVELS)("ด่าน $id — กฎ 7 · ประจุรวมสองข้างเท่ากันทั้งสมการสมบูรณ์และสุทธิ", (level) => {
    expect(termsCharge(level.completeIonic.reactants)).toBe(
      termsCharge(level.completeIonic.products),
    );
    expect(termsCharge(level.netIonic.reactants)).toBe(
      termsCharge(level.netIonic.products),
    );
    expect(atomsEqual(termsToAtoms(level.netIonic.reactants), termsToAtoms(level.netIonic.products))).toBe(
      true,
    );
  });

  it.each(LEVELS)("ด่าน $id — กฎ 8 · ไอออนผู้ชมปรากฏสองข้างจำนวนเท่ากัน", (level) => {
    expect(level.spectators.length).toBeGreaterThan(0);
    const left = new Map(
      level.completeIonic.reactants
        .filter((term) => term.kind === "ion")
        .map((term) => [term.ionId, term.count]),
    );
    const right = new Map(
      level.completeIonic.products
        .filter((term) => term.kind === "ion")
        .map((term) => [term.ionId, term.count]),
    );
    for (const spectator of level.spectators) {
      expect(left.get(spectator.ionId)).toBe(spectator.count);
      expect(right.get(spectator.ionId)).toBe(spectator.count);
    }
  });

  it.each(LEVELS)("ด่าน $id — กฎ 9 · ระดับความยากตรงกับช่วงเลขด่าน", (level) => {
    expect(level.difficulty).toBe(expectedDifficulty(level.id));
  });

  it("กฎ 9 (ต่อ) · ด่าน 01-10 ประจุ ±1 ทุกไอออนและสัมประสิทธิ์เป็น 1 ทั้งหมด", () => {
    for (const level of LEVELS.filter((candidate) => candidate.id <= 10)) {
      for (const ionId of [
        level.reactantA.cationId,
        level.reactantA.anionId,
        level.reactantB.cationId,
        level.reactantB.anionId,
      ]) {
        expect(Math.abs(getIon(ionId).charge)).toBe(1);
      }
      expect(level.coefficients).toEqual({ a: 1, b: 1, c: 1, d: 1 });
    }
  });

  it.each(LEVELS)("ด่าน $id — กฎ 10 · มีคำใบ้ครบ 3 ระดับ ไม่มีข้อความว่าง", (level) => {
    expect(level.hints).toHaveLength(3);
    for (const hint of level.hints) {
      expect(hint.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(LEVELS)("ด่าน $id — กฎ 11 · คำใบ้ไม่มีสูตรของผลิตภัณฑ์ตะกอนอยู่ในข้อความ", (level) => {
    const precipitateFormula = formulaToPlainText(level.precipitate.formula);
    for (const hint of level.hints) {
      expect(hint).not.toContain(precipitateFormula);
    }
  });

  it.each(LEVELS)("ด่าน $id — กฎ 12 · สมการสุทธิลดเป็นอัตราส่วนต่ำสุดแยกจากสมการโมเลกุล", (level) => {
    const counts = [...level.netIonic.reactants, ...level.netIonic.products].map(
      (term) => term.count,
    );
    expect(gcdAll(counts)).toBe(1);
  });
});
