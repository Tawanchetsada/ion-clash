import { buildCompoundById } from "../domain/chemistry/compounds";
import { buildReaction, precipitateOf, aqueousProductOf } from "../domain/chemistry/reaction";
import { buildCompleteIonic, findSpectators } from "../domain/chemistry/spectators";
import { buildNetIonic } from "../domain/chemistry/netIonic";
import { LEVEL_SEEDS } from "../data/levelSeeds";
import type { BuiltLevel } from "../data/buildLevel";

/**
 * สร้าง Level จำลองสำหรับหน้า /how-to-play
 * ใช้ CaCl2 + Na2SO4 -> CaSO4(s) + 2NaCl(aq)
 * ยืนยันว่าไม่อยู่ใน 50 ด่านจริงของ LEVEL_SEEDS
 */
export function getTutorialLevel(): BuiltLevel {
  const reactantA = buildCompoundById("calcium-2plus", "chloride");
  const reactantB = buildCompoundById("sodium-plus", "sulfate");
  const reaction = buildReaction(reactantA, reactantB);
  const precipitate = precipitateOf(reaction);
  const aqueousProduct = aqueousProductOf(reaction);
  const completeIonic = buildCompleteIonic(reaction);
  const netIonic = buildNetIonic(reaction);
  const spectators = findSpectators(reaction);

  return {
    id: 0,
    difficulty: "basic",
    reactantA: reaction.reactantA,
    reactantB: reaction.reactantB,
    productA: reaction.productA,
    productB: reaction.productB,
    coefficients: reaction.coefficients,
    precipitate,
    aqueousProduct,
    completeIonic,
    netIonic,
    spectators,
    hints: [
      "ปฏิกิริยานี้เกิดจากการแลกคู่ระหว่างไอออนบวกกับไอออนลบจากคนละสาร",
      "ลองพิจารณาว่าแคลเซียมไอออนจับกับไอออนลบตัวใดแล้วไม่ละลายน้ำ",
      "กฎ: เกลือซัลเฟตไม่ละลายเมื่อจับกับ Ba²⁺, Pb²⁺, Ca²⁺ หรือ Ag⁺",
    ],
  };
}

/** ตรวจสอบว่าด่านตัวอย่างไม่อยู่ใน 50 ด่านจริง */
export function verifyTutorialLevelNotInSeeds(): boolean {
  const tutorial = getTutorialLevel();
  const catA = tutorial.reactantA.cationId;
  const aniA = tutorial.reactantA.anionId;
  const catB = tutorial.reactantB.cationId;
  const aniB = tutorial.reactantB.anionId;

  return !LEVEL_SEEDS.some(
    (seed) =>
      (seed.reactantA.cation === catA &&
        seed.reactantA.anion === aniA &&
        seed.reactantB.cation === catB &&
        seed.reactantB.anion === aniB) ||
      (seed.reactantA.cation === catB &&
        seed.reactantA.anion === aniB &&
        seed.reactantB.cation === catA &&
        seed.reactantB.anion === aniA),
  );
}
