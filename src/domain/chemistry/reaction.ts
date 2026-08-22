import { balanceDoubleDisplacement } from "./balance";
import { buildCompound } from "./compounds";
import { getIon } from "./ions";
import { resolvePhase } from "./solubility";
import type {
  CompoundDef,
  Phase,
  ReactionModel,
  ValidationResult,
} from "./types";

/**
 * แลกคู่ไอออน — ไอออนบวกจาก A จับกับไอออนลบจาก B และสลับกัน
 * ลำดับผลลัพธ์คงที่เสมอ: [cationA+anionB, cationB+anionA]
 */
export function crossExchange(
  a: CompoundDef,
  b: CompoundDef,
): [CompoundDef, CompoundDef] {
  return [
    buildCompound(getIon(a.cationId), getIon(b.anionId)),
    buildCompound(getIon(b.cationId), getIon(a.anionId)),
  ];
}

/**
 * สร้างแบบจำลองปฏิกิริยาครบชุดจากสารตั้งต้นสองตัว
 * Phase 2 เอาไปห่อเป็น buildLevel โดยเติมแค่ id ระดับความยาก และคำใบ้
 */
export function buildReaction(
  reactantA: CompoundDef,
  reactantB: CompoundDef,
): ReactionModel {
  const [productA, productB] = crossExchange(reactantA, reactantB);
  const coefficients = balanceDoubleDisplacement(
    reactantA,
    reactantB,
    productA,
    productB,
  );
  return { reactantA, reactantB, productA, productB, coefficients };
}

export type ProductSlot = {
  ionId: string | null;
  /** สถานะที่ผู้เล่นระบุ ถ้า UI ให้เลือกเอง */
  claimedPhase?: Phase | undefined;
};

export type FilledSlot = ProductSlot & { ionId: string };

/** ช่องผลิตภัณฑ์ครบ 4 ช่อง — เป็น tuple เพื่อให้เข้าถึง index ได้โดยไม่ต้อง narrow ซ้ำ */
export type CompleteSlots = readonly [
  FilledSlot,
  FilledSlot,
  FilledSlot,
  FilledSlot,
];

/** ช่องผลิตภัณฑ์ต้องครบ 4 ช่องก่อนจึงเปิดปุ่มตรวจได้ */
export function isPairingComplete(
  slots: readonly ProductSlot[],
): slots is CompleteSlots {
  return slots.length === 4 && slots.every((slot) => slot.ionId !== null);
}

/**
 * ตรวจการจับคู่ผลิตภัณฑ์ตาม D-03
 *
 * ช่อง 4 ช่อง = 2 คู่ คือ [0,1] และ [2,3]
 * บังคับ cation ก่อน anion ภายในคู่ แต่ไม่บังคับว่าคู่ตะกอนต้องอยู่คู่ไหน
 *
 * ไม่เฉลยคำตอบ — คืนแค่รหัสหลักการที่ถูกละเมิด ตามข้อห้ามใน spec
 */
export function validateProductPairing(
  slots: readonly ProductSlot[],
  model: ReactionModel,
): ValidationResult {
  if (!isPairingComplete(slots)) {
    throw new Error(
      "ตรวจการจับคู่ได้เมื่อวางไอออนครบ 4 ช่องแล้วเท่านั้น — ปุ่มตรวจต้อง disabled ก่อนหน้านั้น",
    );
  }

  const available = [
    model.reactantA.cationId,
    model.reactantA.anionId,
    model.reactantB.cationId,
    model.reactantB.anionId,
  ];
  const placed = slots.map((slot) => slot.ionId);

  if ([...placed].sort().join("|") !== [...available].sort().join("|")) {
    return { ok: false, code: "E-PAIR" };
  }

  const sourceOf = (ionId: string): "A" | "B" =>
    ionId === model.reactantA.cationId || ionId === model.reactantA.anionId
      ? "A"
      : "B";

  for (const [first, second] of [
    [slots[0], slots[1]],
    [slots[2], slots[3]],
  ] as const) {
    const firstIon = getIon(first.ionId);
    const secondIon = getIon(second.ionId);

    // ไอออนประจุเดียวกันสองตัวในคู่เดียว ประจุรวมเป็นศูนย์ไม่ได้แน่นอน
    if (Math.sign(firstIon.charge) === Math.sign(secondIon.charge)) {
      return { ok: false, code: "E-CHARGE" };
    }

    // ชนิดถูกแต่สลับลำดับ — D-03 บังคับ cation ก่อน anion
    if (firstIon.charge < 0) {
      return { ok: false, code: "E-PAIR" };
    }

    // จับคู่ไอออนจากสารตั้งต้นเดียวกัน แปลว่าไม่ได้แลกคู่
    if (sourceOf(first.ionId) === sourceOf(second.ionId)) {
      return { ok: false, code: "E-PAIR" };
    }

    if (
      second.claimedPhase !== undefined &&
      second.claimedPhase !== resolvePhase(first.ionId, second.ionId)
    ) {
      return { ok: false, code: "E-PHASE" };
    }
    if (
      first.claimedPhase !== undefined &&
      first.claimedPhase !== resolvePhase(first.ionId, second.ionId)
    ) {
      return { ok: false, code: "E-PHASE" };
    }
  }

  return { ok: true };
}

/**
 * ตะกอนของปฏิกิริยา — MVP กำหนดให้มีตัวเดียวเท่านั้น
 * โยน error ถ้าข้อมูลด่านให้ 0 หรือ 2 ตัว ไม่ปล่อยผ่านเงียบ ๆ
 */
export function precipitateOf(model: ReactionModel): CompoundDef {
  const solids = [model.productA, model.productB].filter(
    (product) => product.phase === "s",
  );

  if (solids.length !== 1) {
    throw new Error(
      `ปฏิกิริยานี้ให้ตะกอน ${solids.length} ตัว แต่ MVP รองรับ 1 ตัวเท่านั้น: ` +
        `${model.productA.compoundId} (${model.productA.phase}) และ ` +
        `${model.productB.compoundId} (${model.productB.phase})`,
    );
  }

  const [precipitate] = solids;
  if (!precipitate) {
    throw new Error("หาตะกอนไม่พบ");
  }
  return precipitate;
}

export function aqueousProductOf(model: ReactionModel): CompoundDef {
  const precipitate = precipitateOf(model);
  return model.productA === precipitate ? model.productB : model.productA;
}
