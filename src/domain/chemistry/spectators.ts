import { getIon } from "./ions";
import type {
  CompoundDef,
  EquationTerm,
  IonicEquation,
  ReactionModel,
  SpectatorPair,
} from "./types";

/**
 * สมการไอออนิกสมบูรณ์ — สารที่ละลายน้ำแตกตัวเป็นไอออน ตะกอนคงเป็นสารประกอบ
 */

function dissociate(compound: CompoundDef, coefficient: number): EquationTerm[] {
  if (compound.phase === "s") {
    return [{ kind: "compound", compound, count: coefficient }];
  }

  return [
    {
      kind: "ion",
      ionId: compound.cationId,
      count: compound.cationCount * coefficient,
      phase: "aq",
    },
    {
      kind: "ion",
      ionId: compound.anionId,
      count: compound.anionCount * coefficient,
      phase: "aq",
    },
  ];
}

/** รวมพจน์ไอออนชนิดเดียวกันเข้าด้วยกัน โดยคงลำดับที่พบครั้งแรก */
function mergeTerms(terms: readonly EquationTerm[]): EquationTerm[] {
  const merged: EquationTerm[] = [];

  for (const term of terms) {
    const existing = merged.find(
      (candidate) =>
        candidate.kind === term.kind &&
        (term.kind === "ion"
          ? candidate.kind === "ion" && candidate.ionId === term.ionId
          : candidate.kind === "compound" &&
            candidate.compound.compoundId === term.compound.compoundId),
    );

    if (existing) {
      existing.count += term.count;
    } else {
      merged.push({ ...term });
    }
  }

  return merged;
}

export function buildCompleteIonic(model: ReactionModel): IonicEquation {
  const { reactantA, reactantB, productA, productB, coefficients } = model;

  return {
    reactants: mergeTerms([
      ...dissociate(reactantA, coefficients.a),
      ...dissociate(reactantB, coefficients.b),
    ]),
    products: mergeTerms([
      ...dissociate(productA, coefficients.c),
      ...dissociate(productB, coefficients.d),
    ]),
  };
}

/** นับเฉพาะไอออนอิสระ แยกตาม ionId */
export function freeIonCounts(
  terms: readonly EquationTerm[],
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const term of terms) {
    if (term.kind === "ion") {
      counts.set(term.ionId, (counts.get(term.ionId) ?? 0) + term.count);
    }
  }
  return counts;
}

/**
 * หาไอออนผู้ชม — species เดียวกัน ประจุเท่ากัน สถานะ aq ทั้งคู่
 * และจำนวนเท่ากันทั้งสองข้าง
 *
 * จับคู่ด้วย ionId + charge + phase + count เท่านั้น ห้ามเทียบสตริงสูตร
 * เพราะ Fe²⁺ กับ Fe³⁺ มี core เป็น 'Fe' เหมือนกัน แยกได้ด้วยประจุ
 */
export function findSpectators(model: ReactionModel): SpectatorPair[] {
  const equation = buildCompleteIonic(model);
  const left = freeIonCounts(equation.reactants);
  const right = freeIonCounts(equation.products);

  const spectators: SpectatorPair[] = [];

  for (const [ionId, leftCount] of left) {
    const rightCount = right.get(ionId);
    if (rightCount === undefined) {
      continue;
    }

    // ในปฏิกิริยาแลกคู่ที่ดุลแล้ว ไอออนที่ปรากฏสองข้างต้องมีจำนวนเท่ากันเสมอ
    // ถ้าไม่เท่า แปลว่าข้อมูลด่านหรือสัมประสิทธิ์ผิด
    if (leftCount !== rightCount) {
      throw new Error(
        `ไอออน '${ionId}' ปรากฏสองข้างในจำนวนไม่เท่ากัน (${leftCount} กับ ${rightCount}) — ตรวจสัมประสิทธิ์`,
      );
    }

    spectators.push({
      ionId,
      charge: getIon(ionId).charge,
      phase: "aq",
      count: leftCount,
    });
  }

  return spectators;
}

/**
 * ตรวจว่าคู่ที่ผู้เล่นเลือกตัดเป็นไอออนผู้ชมจริงหรือไม่
 * ตะกอนตัดไม่ได้เพราะไม่ได้แตกตัวเป็นไอออนอิสระ
 */
export function isSpectator(model: ReactionModel, ionId: string): boolean {
  return findSpectators(model).some((pair) => pair.ionId === ionId);
}
