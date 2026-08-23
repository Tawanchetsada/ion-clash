import { buildCompoundById } from "../domain/chemistry/compounds";
import { renderIon, renderCompoundFormula } from "../domain/chemistry/formula";
import { getIon } from "../domain/chemistry/ions";
import { buildReaction, precipitateOf, aqueousProductOf } from "../domain/chemistry/reaction";
import { buildCompleteIonic, findSpectators } from "../domain/chemistry/spectators";
import { buildNetIonic } from "../domain/chemistry/netIonic";
import { LEVEL_SEEDS } from "../data/levelSeeds";
import type { FormulaAst } from "../domain/chemistry/types";

/**
 * View data สำหรับหน้า /knowledge
 * สูตรทั้งหมดสร้างจาก domain AST เพื่อให้ EquationView นำไปแสดงผลเป็น <sub>/<sup> จริง
 * ห้าม hardcode สตริง Unicode subscript
 */

export function getKnowledgeTopic1Examples() {
  const na = getIon("sodium-plus");
  const cl = getIon("chloride");
  const ca = getIon("calcium-2plus");
  const no3 = getIon("nitrate");

  return {
    naclCompound: renderCompoundFormula(na, cl, 1, 1),
    naIon: renderIon(na, 1),
    clIon: renderIon(cl, 1),

    cacl2Compound: renderCompoundFormula(ca, cl, 1, 2),
    caIon: renderIon(ca, 1),
    twoClIon: renderIon(cl, 2),

    no3Ion: renderIon(no3, 1),
  };
}

export function getKnowledgeTopic3Example() {
  // ใช้ CaCl2 + Na2SO4 -> CaSO4(s) + 2NaCl(aq)
  // ซึ่งไม่ใช่ด่านจริงใน 50 ด่าน
  const reactantA = buildCompoundById("calcium-2plus", "chloride");
  const reactantB = buildCompoundById("sodium-plus", "sulfate");
  const reaction = buildReaction(reactantA, reactantB);
  const precipitate = precipitateOf(reaction);
  const aqueousProduct = aqueousProductOf(reaction);
  const completeIonic = buildCompleteIonic(reaction);
  const netIonic = buildNetIonic(reaction);
  const spectators = findSpectators(reaction);

  return {
    reactantA,
    reactantB,
    reaction,
    precipitate,
    aqueousProduct,
    completeIonic,
    netIonic,
    spectators,
  };
}

export function getKnowledgeTopic4Examples() {
  const cl = getIon("chloride");
  const ag = getIon("silver-plus");

  return {
    agIon: renderIon(ag, 1),
    clIon: renderIon(cl, 1),
    agclCompound: renderCompoundFormula(ag, cl, 1, 1),
    twoAgIon: renderIon(ag, 2),
    twoClIon: renderIon(cl, 2),
    twoAgclCompound: [
      { kind: "text" as const, value: "2" },
      ...renderCompoundFormula(ag, cl, 1, 1),
    ] as FormulaAst,
  };
}

/** ตรวจสอบว่าคู่สารตัวอย่างใน /knowledge ไม่ตรงกับด่านใดใน 50 ด่าน */
export function isExampleInLevelSeeds(
  catA: string,
  aniA: string,
  catB: string,
  aniB: string,
): boolean {
  return LEVEL_SEEDS.some(
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
