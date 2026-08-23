import { combineAtoms, gcdAll } from "./formula";
import { getIon } from "./ions";
import { buildCompleteIonic, findSpectators } from "./spectators";
import type {
  AtomCounts,
  EquationTerm,
  NetIonicEquation,
  ReactionModel,
} from "./types";

export function termsToAtoms(terms: readonly EquationTerm[]): AtomCounts {
  return combineAtoms(
    terms.map((term) =>
      term.kind === "ion"
        ? { atoms: getIon(term.ionId).atoms, multiplier: term.count }
        : { atoms: term.compound.atoms, multiplier: term.count },
    ),
  );
}

export function termsCharge(terms: readonly EquationTerm[]): number {
  return terms.reduce(
    (sum, term) =>
      // สารประกอบเป็นกลาง จึงไม่ต้องบวกประจุ
      term.kind === "ion" ? sum + getIon(term.ionId).charge * term.count : sum,
    0,
  );
}

function atomsEqual(left: AtomCounts, right: AtomCounts): boolean {
  const elements = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...elements].every(
    (element) => (left[element] ?? 0) === (right[element] ?? 0),
  );
}

function divideCounts(
  terms: readonly EquationTerm[],
  divisor: number,
): EquationTerm[] {
  return terms.map((term) => ({ ...term, count: term.count / divisor }));
}

/**
 * สร้างสมการไอออนิกสุทธิ
 *
 * มี **สองขั้นการลดทอน** ซึ่งเป็นจุดที่พลาดกันบ่อย
 *   1. ตัดไอออนตัวประกอบออกจากทั้งสองข้าง
 *   2. หาร gcd ของสัมประสิทธิ์ที่เหลืออีกชั้น
 *
 * ขั้นที่ 2 จำเป็นเพราะสมการโมเลกุลกับสมการสุทธิลดอัตราส่วนแยกกัน เช่น
 *
 *   โมเลกุล  Al₂(SO₄)₃ + 3BaCl₂ → 3BaSO₄ + 2AlCl₃   (ต่ำสุดแล้ว)
 *   ตัดตัวประกอบ  3Ba²⁺ + 3SO₄²⁻ → 3BaSO₄(s)
 *   สุทธิ     Ba²⁺ + SO₄²⁻ → BaSO₄(s)                (ต้องหารด้วย 3 อีกชั้น)
 *
 * ถ้าลืมขั้นที่ 2 ผู้เรียนจะเห็นสมการสุทธิผิดรูปแบบที่ตำราสอน
 */
export function buildNetIonic(model: ReactionModel): NetIonicEquation {
  const complete = buildCompleteIonic(model);
  const spectatorIds = new Set(
    findSpectators(model).map((spectator) => spectator.ionId),
  );

  const strip = (terms: readonly EquationTerm[]): EquationTerm[] =>
    terms.filter(
      (term) => term.kind !== "ion" || !spectatorIds.has(term.ionId),
    );

  let reactants = strip(complete.reactants);
  let products = strip(complete.products);

  if (reactants.length === 0 || products.length === 0) {
    throw new Error(
      "ตัดไอออนตัวประกอบแล้วไม่เหลือสมการสุทธิ — ปฏิกิริยานี้ไม่เกิดตะกอน",
    );
  }

  const divisor = gcdAll([...reactants, ...products].map((term) => term.count));
  if (divisor > 1) {
    reactants = divideCounts(reactants, divisor);
    products = divideCounts(products, divisor);
  }

  assertNetIonicValid(reactants, products);
  return { reactants, products };
}

/**
 * สมการสุทธิต้องผ่านสามข้อ — อะตอมทุกธาตุเท่ากัน ประจุรวมสองข้างเท่ากัน
 * และตะกอนคงเป็นสารประกอบ (s) ไม่แตกเป็นไอออน
 */
export function assertNetIonicValid(
  reactants: readonly EquationTerm[],
  products: readonly EquationTerm[],
): void {
  const leftAtoms = termsToAtoms(reactants);
  const rightAtoms = termsToAtoms(products);
  if (!atomsEqual(leftAtoms, rightAtoms)) {
    throw new Error(
      `สมการสุทธิไม่อนุรักษ์อะตอม: ${JSON.stringify(leftAtoms)} vs ${JSON.stringify(rightAtoms)}`,
    );
  }

  const leftCharge = termsCharge(reactants);
  const rightCharge = termsCharge(products);
  if (leftCharge !== rightCharge) {
    throw new Error(
      `สมการสุทธิไม่อนุรักษ์ประจุ: ${leftCharge} กับ ${rightCharge}`,
    );
  }

  for (const term of products) {
    if (term.kind === "compound" && term.compound.phase !== "s") {
      throw new Error(
        `ผลิตภัณฑ์ '${term.compound.compoundId}' ที่ละลายน้ำต้องแตกเป็นไอออน ไม่ใช่คงเป็นสารประกอบ`,
      );
    }
  }

  if (gcdAll([...reactants, ...products].map((term) => term.count)) !== 1) {
    throw new Error("สมการสุทธิยังไม่ใช่อัตราส่วนต่ำสุด");
  }
}
