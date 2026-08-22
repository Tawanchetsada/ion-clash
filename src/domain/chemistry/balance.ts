import { combineAtoms, gcdAll } from "./formula";
import { getIon } from "./ions";
import type { AtomCounts, Coefficients, CompoundDef, ValidationResult } from "./types";

/**
 * ดุลสมการปฏิกิริยาแลกคู่
 *
 * ปฏิกิริยาแลกคู่ไม่มีการเปลี่ยนเลขออกซิเดชัน จำนวน "หน่วยไอออน" แต่ละชนิด
 * จึงคงที่ทั้งสองข้าง ใช้เป็นสมการอนุรักษ์แล้วค้นหาคำตอบจำนวนเต็มบวกที่น้อยที่สุด
 *
 * ค้นแบบ brute force ช่วง 1..12 (ประมาณสองหมื่นชุด) เร็วมากและพิสูจน์
 * ความถูกต้องได้ง่ายกว่าการแก้เมทริกซ์
 */

export const MAX_COEFFICIENT = 12;

/** จำนวนหน่วยไอออนแต่ละชนิดในสารประกอบ 1 หน่วยสูตร */
function ionCounts(compound: CompoundDef): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  counts.set(
    compound.cationId,
    (counts.get(compound.cationId) ?? 0) + compound.cationCount,
  );
  counts.set(
    compound.anionId,
    (counts.get(compound.anionId) ?? 0) + compound.anionCount,
  );
  return counts;
}

function atomsEqual(left: AtomCounts, right: AtomCounts): boolean {
  const elements = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const element of elements) {
    if ((left[element] ?? 0) !== (right[element] ?? 0)) {
      return false;
    }
  }
  return true;
}

function sideAtoms(
  first: CompoundDef,
  firstCoefficient: number,
  second: CompoundDef,
  secondCoefficient: number,
): AtomCounts {
  return combineAtoms([
    { atoms: first.atoms, multiplier: firstCoefficient },
    { atoms: second.atoms, multiplier: secondCoefficient },
  ]);
}

/** ประจุรวมของสารประกอบทั้งสองตัวรวมกัน — สารประกอบเป็นกลาง จึงต้องได้ศูนย์ */
function sideCharge(
  first: CompoundDef,
  firstCoefficient: number,
  second: CompoundDef,
  secondCoefficient: number,
): number {
  const charge = (compound: CompoundDef): number =>
    getIon(compound.cationId).charge * compound.cationCount +
    getIon(compound.anionId).charge * compound.anionCount;

  return charge(first) * firstCoefficient + charge(second) * secondCoefficient;
}

function conservesIonUnits(
  reactantA: CompoundDef,
  reactantB: CompoundDef,
  productA: CompoundDef,
  productB: CompoundDef,
  { a, b, c, d }: Coefficients,
): boolean {
  const left = [
    { counts: ionCounts(reactantA), coefficient: a },
    { counts: ionCounts(reactantB), coefficient: b },
  ];
  const right = [
    { counts: ionCounts(productA), coefficient: c },
    { counts: ionCounts(productB), coefficient: d },
  ];

  const ionIds = new Set<string>();
  for (const { counts } of [...left, ...right]) {
    for (const ionId of counts.keys()) {
      ionIds.add(ionId);
    }
  }

  const total = (
    side: ReadonlyArray<{
      counts: ReadonlyMap<string, number>;
      coefficient: number;
    }>,
    ionId: string,
  ): number =>
    side.reduce(
      (sum, { counts, coefficient }) =>
        sum + (counts.get(ionId) ?? 0) * coefficient,
      0,
    );

  for (const ionId of ionIds) {
    if (total(left, ionId) !== total(right, ionId)) {
      return false;
    }
  }

  return true;
}

/**
 * หาสัมประสิทธิ์ที่ดุลแล้วและเป็นอัตราส่วนต่ำสุด
 *
 * throw เมื่อหาคำตอบไม่เจอ — ห้ามคืนค่า default เงียบ ๆ เพราะจะกลายเป็น
 * ด่านที่ดุลไม่ได้จริงแต่เกมคิดว่าดุลแล้ว
 */
export function balanceDoubleDisplacement(
  reactantA: CompoundDef,
  reactantB: CompoundDef,
  productA: CompoundDef,
  productB: CompoundDef,
): Coefficients {
  let best: Coefficients | null = null;
  let bestSum = Number.POSITIVE_INFINITY;

  for (let a = 1; a <= MAX_COEFFICIENT; a += 1) {
    for (let b = 1; b <= MAX_COEFFICIENT; b += 1) {
      for (let c = 1; c <= MAX_COEFFICIENT; c += 1) {
        for (let d = 1; d <= MAX_COEFFICIENT; d += 1) {
          const sum = a + b + c + d;
          if (sum >= bestSum) {
            continue;
          }
          const candidate: Coefficients = { a, b, c, d };
          if (
            conservesIonUnits(
              reactantA,
              reactantB,
              productA,
              productB,
              candidate,
            )
          ) {
            best = candidate;
            bestSum = sum;
          }
        }
      }
    }
  }

  if (!best) {
    throw new Error(
      `ดุลสมการไม่ได้ในช่วงสัมประสิทธิ์ 1..${MAX_COEFFICIENT}: ` +
        `${reactantA.compoundId} + ${reactantB.compoundId} -> ` +
        `${productA.compoundId} + ${productB.compoundId}`,
    );
  }

  assertBalanced(reactantA, reactantB, productA, productB, best);
  return best;
}

/**
 * ตรวจซ้ำหลังได้คำตอบ — อะตอมทุกธาตุเท่ากัน ประจุรวมสองข้างเป็นศูนย์
 * และเป็นอัตราส่วนต่ำสุด
 */
export function assertBalanced(
  reactantA: CompoundDef,
  reactantB: CompoundDef,
  productA: CompoundDef,
  productB: CompoundDef,
  coefficients: Coefficients,
): void {
  const { a, b, c, d } = coefficients;

  const left = sideAtoms(reactantA, a, reactantB, b);
  const right = sideAtoms(productA, c, productB, d);
  if (!atomsEqual(left, right)) {
    throw new Error(
      `จำนวนอะตอมไม่เท่ากันสองข้าง: ${JSON.stringify(left)} vs ${JSON.stringify(right)}`,
    );
  }

  const leftCharge = sideCharge(reactantA, a, reactantB, b);
  const rightCharge = sideCharge(productA, c, productB, d);
  if (leftCharge !== 0 || rightCharge !== 0) {
    throw new Error(
      `ประจุรวมของสมการโมเลกุลต้องเป็นศูนย์ทั้งสองข้าง ได้ ${leftCharge} กับ ${rightCharge}`,
    );
  }

  if (gcdAll([a, b, c, d]) !== 1) {
    throw new Error(
      `สัมประสิทธิ์ ${a}:${b}:${c}:${d} ยังไม่ใช่อัตราส่วนต่ำสุด`,
    );
  }
}

/**
 * ตรวจสัมประสิทธิ์ที่ผู้เล่นกรอก
 *
 * แยก E-BALANCE กับ E-RATIO ตาม spec: 2:2:2:2 ดุลถูกแต่ยังลดได้
 * จึงต้องไม่ผ่านถ้าคำตอบมาตรฐานคือ 1:1:1:1
 */
export function checkCoefficients(
  reactantA: CompoundDef,
  reactantB: CompoundDef,
  productA: CompoundDef,
  productB: CompoundDef,
  coefficients: Coefficients,
): ValidationResult {
  const { a, b, c, d } = coefficients;

  if (![a, b, c, d].every((value) => Number.isInteger(value) && value >= 1)) {
    return { ok: false, code: "E-BALANCE" };
  }

  const left = sideAtoms(reactantA, a, reactantB, b);
  const right = sideAtoms(productA, c, productB, d);
  if (!atomsEqual(left, right)) {
    return { ok: false, code: "E-BALANCE" };
  }

  if (gcdAll([a, b, c, d]) !== 1) {
    return { ok: false, code: "E-RATIO" };
  }

  return { ok: true };
}
