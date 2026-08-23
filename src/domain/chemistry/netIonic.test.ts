import { describe, expect, it } from "vitest";
import { buildCompoundById } from "./compounds";
import { buildNetIonic, termsCharge, termsToAtoms } from "./netIonic";
import { buildReaction } from "./reaction";
import { buildCompleteIonic, findSpectators } from "./spectators";
import type { EquationTerm, ReactionModel } from "./types";

const c = buildCompoundById;

const reaction = (
  a: [string, string],
  b: [string, string],
): ReactionModel => buildReaction(c(...a), c(...b));

/** ย่อสมการเป็นสตริงอ่านง่ายสำหรับ assertion เช่น 'Ag+ + Cl- -> AgCl' */
function describeTerms(terms: readonly EquationTerm[]): string {
  return terms
    .map((term) => {
      const label =
        term.kind === "ion" ? term.ionId : term.compound.compoundId;
      return term.count === 1 ? label : `${term.count}${label}`;
    })
    .join(" + ");
}

const LEVEL_01 = reaction(
  ["silver-plus", "nitrate"],
  ["sodium-plus", "chloride"],
);
const LEVEL_35 = reaction(
  ["iron-3plus", "sulfate"],
  ["sodium-plus", "hydroxide"],
);
const LEVEL_40 = reaction(
  ["aluminium-3plus", "sulfate"],
  ["barium-2plus", "chloride"],
);
const LEVEL_42 = reaction(
  ["calcium-2plus", "chloride"],
  ["sodium-plus", "phosphate"],
);
const LEVEL_50 = reaction(
  ["iron-3plus", "sulfate"],
  ["sodium-plus", "phosphate"],
);

describe("สมการไอออนิกสมบูรณ์", () => {
  it("สารที่ละลายน้ำแตกตัว ตะกอนคงเป็นสารประกอบ", () => {
    const equation = buildCompleteIonic(LEVEL_01);

    expect(describeTerms(equation.reactants)).toBe(
      "silver-plus + nitrate + sodium-plus + chloride",
    );
    expect(equation.products.some((term) => term.kind === "compound")).toBe(
      true,
    );
  });

  it("คูณจำนวนไอออนตามสัมประสิทธิ์ที่ดุลแล้ว", () => {
    // Al₂(SO₄)₃ + 3BaCl₂ → 2Al³⁺ + 3SO₄²⁻ + 3Ba²⁺ + 6Cl⁻
    expect(describeTerms(buildCompleteIonic(LEVEL_40).reactants)).toBe(
      "2aluminium-3plus + 3sulfate + 3barium-2plus + 6chloride",
    );
  });
});

describe("ไอออนตัวประกอบ", () => {
  it("ด่าน 01 — ตัวประกอบคือ Na⁺ กับ NO₃⁻", () => {
    expect(findSpectators(LEVEL_01).map((s) => s.ionId).sort()).toEqual([
      "nitrate",
      "sodium-plus",
    ]);
  });

  it("ด่าน 40 — ตัวประกอบคือ Al³⁺ กับ Cl⁻ ไม่ใช่ Na⁺", () => {
    expect(findSpectators(LEVEL_40).map((s) => s.ionId).sort()).toEqual([
      "aluminium-3plus",
      "chloride",
    ]);
  });

  it("ตัวประกอบปรากฏสองข้างในจำนวนเท่ากันเสมอ", () => {
    for (const model of [LEVEL_01, LEVEL_35, LEVEL_40, LEVEL_42, LEVEL_50]) {
      const equation = buildCompleteIonic(model);
      for (const spectator of findSpectators(model)) {
        const left = equation.reactants.find(
          (t) => t.kind === "ion" && t.ionId === spectator.ionId,
        );
        const right = equation.products.find(
          (t) => t.kind === "ion" && t.ionId === spectator.ionId,
        );
        expect(left?.count).toBe(spectator.count);
        expect(right?.count).toBe(spectator.count);
      }
    }
  });

  it("ไอออนที่กลายเป็นตะกอนไม่ใช่ตัวประกอบ", () => {
    const ids = findSpectators(LEVEL_01).map((s) => s.ionId);
    expect(ids).not.toContain("silver-plus");
    expect(ids).not.toContain("chloride");
  });

  it("แยก Fe²⁺ กับ Fe³⁺ ด้วยประจุ ไม่ใช่สูตร", () => {
    const spectators = findSpectators(LEVEL_35);
    expect(spectators.map((s) => s.ionId)).not.toContain("iron-2plus");
    expect(spectators.map((s) => s.ionId)).not.toContain("iron-3plus");
  });
});

describe("สมการไอออนิกสุทธิ", () => {
  it("ด่าน 01 — Ag⁺ + Cl⁻ → AgCl(s)", () => {
    const net = buildNetIonic(LEVEL_01);
    expect(describeTerms(net.reactants)).toBe("silver-plus + chloride");
    expect(describeTerms(net.products)).toBe("silver-plus__chloride");
  });

  // กฎข้อ 12 — สมการสุทธิลดอัตราส่วนแยกจากสมการโมเลกุล
  describe("ลดอัตราส่วนขั้นที่สอง", () => {
    it("ด่าน 40 — 3Ba²⁺ + 3SO₄²⁻ → 3BaSO₄ ต้องลดเหลือ 1:1:1", () => {
      const net = buildNetIonic(LEVEL_40);
      expect(describeTerms(net.reactants)).toBe("sulfate + barium-2plus");
      expect(describeTerms(net.products)).toBe("barium-2plus__sulfate");
    });

    it("ด่าน 35 — 2Fe³⁺ + 6OH⁻ → 2Fe(OH)₃ ต้องลดเหลือ 1:3:1", () => {
      const net = buildNetIonic(LEVEL_35);
      expect(describeTerms(net.reactants)).toBe("iron-3plus + 3hydroxide");
      expect(describeTerms(net.products)).toBe("iron-3plus__hydroxide");
    });

    it("ด่าน 50 — 2Fe³⁺ + 2PO₄³⁻ → 2FePO₄ ต้องลดเหลือ 1:1:1", () => {
      const net = buildNetIonic(LEVEL_50);
      expect(describeTerms(net.reactants)).toBe("iron-3plus + phosphate");
      expect(describeTerms(net.products)).toBe("iron-3plus__phosphate");
    });

    it("ด่าน 42 — 3Ca²⁺ + 2PO₄³⁻ → Ca₃(PO₄)₂ ลดต่อไม่ได้แล้ว", () => {
      const net = buildNetIonic(LEVEL_42);
      expect(describeTerms(net.reactants)).toBe("3calcium-2plus + 2phosphate");
      expect(describeTerms(net.products)).toBe("calcium-2plus__phosphate");
    });
  });

  it("อนุรักษ์อะตอมและประจุทุกด่านที่ทดสอบ", () => {
    for (const model of [LEVEL_01, LEVEL_35, LEVEL_40, LEVEL_42, LEVEL_50]) {
      const net = buildNetIonic(model);
      expect(termsToAtoms(net.reactants)).toEqual(termsToAtoms(net.products));
      expect(termsCharge(net.reactants)).toBe(termsCharge(net.products));
    }
  });

  it("ตะกอนคงเป็นสารประกอบ (s) ไม่แตกเป็นไอออน", () => {
    const net = buildNetIonic(LEVEL_01);
    const product = net.products[0];
    expect(product?.kind).toBe("compound");
    if (product?.kind === "compound") {
      expect(product.compound.phase).toBe("s");
    }
  });

  it("โยน error เมื่อไม่เกิดตะกอน", () => {
    const noReaction = reaction(
      ["sodium-plus", "chloride"],
      ["potassium-plus", "nitrate"],
    );
    expect(() => buildNetIonic(noReaction)).toThrow();
  });
});
