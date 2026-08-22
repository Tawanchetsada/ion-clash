import { describe, expect, it } from "vitest";
import {
  balanceDoubleDisplacement,
  checkCoefficients,
  MAX_COEFFICIENT,
} from "./balance";
import { buildCompoundById } from "./compounds";
import type { Coefficients } from "./types";

const c = buildCompoundById;

/** ดุลสมการจากคู่ไอออนสี่ตัว แล้วคืนอัตราส่วนเป็นสตริงอ่านง่าย */
function ratioOf(
  reactantA: [string, string],
  reactantB: [string, string],
  productA: [string, string],
  productB: [string, string],
): string {
  const { a, b, d, c: coefC } = balanceDoubleDisplacement(
    c(...reactantA),
    c(...reactantB),
    c(...productA),
    c(...productB),
  );
  return `${a}:${b}:${coefC}:${d}`;
}

describe("ดุลสมการแลกคู่", () => {
  it("1:1:1:1 — AgNO₃ + NaCl → AgCl + NaNO₃ (ด่าน 01)", () => {
    expect(
      ratioOf(
        ["silver-plus", "nitrate"],
        ["sodium-plus", "chloride"],
        ["silver-plus", "chloride"],
        ["sodium-plus", "nitrate"],
      ),
    ).toBe("1:1:1:1");
  });

  it("1:2:1:2 — Pb(NO₃)₂ + 2KI → PbI₂ + 2KNO₃ (ด่าน 13)", () => {
    expect(
      ratioOf(
        ["lead-2plus", "nitrate"],
        ["potassium-plus", "iodide"],
        ["lead-2plus", "iodide"],
        ["potassium-plus", "nitrate"],
      ),
    ).toBe("1:2:1:2");
  });

  it("2:1:1:2 — 2AgNO₃ + Na₂S → Ag₂S + 2NaNO₃ (ด่าน 39)", () => {
    expect(
      ratioOf(
        ["silver-plus", "nitrate"],
        ["sodium-plus", "sulfide"],
        ["silver-plus", "sulfide"],
        ["sodium-plus", "nitrate"],
      ),
    ).toBe("2:1:1:2");
  });

  it("1:1:1:1 ที่ประจุ ±2 ทั้งคู่ — MgSO₄ + Na₂CO₃ → MgCO₃ + Na₂SO₄ (ด่าน 18)", () => {
    expect(
      ratioOf(
        ["magnesium-2plus", "sulfate"],
        ["sodium-plus", "carbonate"],
        ["magnesium-2plus", "carbonate"],
        ["sodium-plus", "sulfate"],
      ),
    ).toBe("1:1:1:1");
  });

  it("1:3:1:3 — FeCl₃ + 3NaOH → Fe(OH)₃ + 3NaCl (ด่าน 31)", () => {
    expect(
      ratioOf(
        ["iron-3plus", "chloride"],
        ["sodium-plus", "hydroxide"],
        ["iron-3plus", "hydroxide"],
        ["sodium-plus", "chloride"],
      ),
    ).toBe("1:3:1:3");
  });

  it("1:6:2:3 — Fe₂(SO₄)₃ + 6NaOH → 2Fe(OH)₃ + 3Na₂SO₄ (ด่าน 35)", () => {
    expect(
      ratioOf(
        ["iron-3plus", "sulfate"],
        ["sodium-plus", "hydroxide"],
        ["iron-3plus", "hydroxide"],
        ["sodium-plus", "sulfate"],
      ),
    ).toBe("1:6:2:3");
  });

  it("1:3:3:2 — Al₂(SO₄)₃ + 3BaCl₂ → 3BaSO₄ + 2AlCl₃ (ด่าน 40)", () => {
    expect(
      ratioOf(
        ["aluminium-3plus", "sulfate"],
        ["barium-2plus", "chloride"],
        ["barium-2plus", "sulfate"],
        ["aluminium-3plus", "chloride"],
      ),
    ).toBe("1:3:3:2");
  });

  it("3:2:1:6 — 3CaCl₂ + 2Na₃PO₄ → Ca₃(PO₄)₂ + 6NaCl (ด่าน 42)", () => {
    expect(
      ratioOf(
        ["calcium-2plus", "chloride"],
        ["sodium-plus", "phosphate"],
        ["calcium-2plus", "phosphate"],
        ["sodium-plus", "chloride"],
      ),
    ).toBe("3:2:1:6");
  });

  it("1:2:2:3 — Fe₂(SO₄)₃ + 2Na₃PO₄ → 2FePO₄ + 3Na₂SO₄ (ด่าน 50)", () => {
    expect(
      ratioOf(
        ["iron-3plus", "sulfate"],
        ["sodium-plus", "phosphate"],
        ["iron-3plus", "phosphate"],
        ["sodium-plus", "sulfate"],
      ),
    ).toBe("1:2:2:3");
  });

  it("คำตอบเป็นอัตราส่วนต่ำสุดเสมอ (gcd = 1) และไม่เกินช่วงที่ค้นหา", () => {
    const cases: Array<[[string, string], [string, string], [string, string], [string, string]]> = [
      [
        ["silver-plus", "nitrate"],
        ["sodium-plus", "chloride"],
        ["silver-plus", "chloride"],
        ["sodium-plus", "nitrate"],
      ],
      [
        ["aluminium-3plus", "sulfate"],
        ["barium-2plus", "chloride"],
        ["barium-2plus", "sulfate"],
        ["aluminium-3plus", "chloride"],
      ],
      [
        ["calcium-2plus", "chloride"],
        ["sodium-plus", "phosphate"],
        ["calcium-2plus", "phosphate"],
        ["sodium-plus", "chloride"],
      ],
    ];

    for (const [ra, rb, pa, pb] of cases) {
      const result = balanceDoubleDisplacement(
        c(...ra),
        c(...rb),
        c(...pa),
        c(...pb),
      );
      const values = [result.a, result.b, result.c, result.d];
      expect(Math.max(...values)).toBeLessThanOrEqual(MAX_COEFFICIENT);
      for (const divisor of [2, 3, 5, 7]) {
        expect(values.every((v) => v % divisor === 0)).toBe(false);
      }
    }
  });

  it("โยน error เมื่อดุลไม่ได้ ไม่คืนค่า default เงียบ ๆ", () => {
    // จับคู่ผลิตภัณฑ์ผิด — Ag กับ Na อยู่ฝั่งซ้ายแต่ผลิตภัณฑ์ไม่มี Na เลย
    expect(() =>
      balanceDoubleDisplacement(
        c("silver-plus", "nitrate"),
        c("sodium-plus", "chloride"),
        c("silver-plus", "chloride"),
        c("silver-plus", "nitrate"),
      ),
    ).toThrow(/ดุลสมการไม่ได้/);
  });
});

describe("ตรวจสัมประสิทธิ์ที่ผู้เล่นกรอก", () => {
  const level13 = [
    c("lead-2plus", "nitrate"),
    c("potassium-plus", "iodide"),
    c("lead-2plus", "iodide"),
    c("potassium-plus", "nitrate"),
  ] as const;

  const check = (coefficients: Coefficients) =>
    checkCoefficients(...level13, coefficients);

  it("ผ่านเมื่อดุลถูกและเป็นอัตราส่วนต่ำสุด", () => {
    expect(check({ a: 1, b: 2, c: 1, d: 2 })).toEqual({ ok: true });
  });

  it("E-BALANCE เมื่อจำนวนอะตอมไม่เท่ากัน", () => {
    expect(check({ a: 1, b: 1, c: 1, d: 1 })).toEqual({
      ok: false,
      code: "E-BALANCE",
    });
  });

  it("E-RATIO เมื่อดุลถูกแต่ยังลดอัตราส่วนได้ — 2:4:2:4", () => {
    expect(check({ a: 2, b: 4, c: 2, d: 4 })).toEqual({
      ok: false,
      code: "E-RATIO",
    });
  });

  it("E-BALANCE เมื่อกรอกค่าที่ไม่ใช่จำนวนเต็มบวก", () => {
    expect(check({ a: 0, b: 2, c: 1, d: 2 }).ok).toBe(false);
    expect(check({ a: 1.5, b: 2, c: 1, d: 2 }).ok).toBe(false);
    expect(check({ a: -1, b: 2, c: 1, d: 2 }).ok).toBe(false);
  });
});
