import { combineAtoms, gcd, renderCompoundFormula } from "./formula";
import { getIon } from "./ions";
import { resolvePhase } from "./solubility";
import type { CompoundDef, IonDef } from "./types";

/**
 * สร้างสารประกอบจากคู่ไอออนด้วยวิธีไขว้ประจุ
 *
 *   g          = gcd(|ประจุบวก|, |ประจุลบ|)
 *   จำนวนบวก   = |ประจุลบ| / g
 *   จำนวนลบ    = |ประจุบวก| / g
 *
 * การหารด้วย gcd สำคัญมาก ไม่งั้น Mg²⁺ กับ CO₃²⁻ จะได้ Mg₂(CO₃)₂
 * แทนที่จะเป็น MgCO₃
 */
export function buildCompound(cation: IonDef, anion: IonDef): CompoundDef {
  if (cation.charge <= 0) {
    throw new Error(
      `'${cation.ionId}' ไม่ใช่ไอออนบวก (ประจุ ${cation.charge})`,
    );
  }
  if (anion.charge >= 0) {
    throw new Error(`'${anion.ionId}' ไม่ใช่ไอออนลบ (ประจุ ${anion.charge})`);
  }

  const g = gcd(cation.charge, anion.charge);
  const cationCount = Math.abs(anion.charge) / g;
  const anionCount = Math.abs(cation.charge) / g;

  const netCharge = cation.charge * cationCount + anion.charge * anionCount;
  if (netCharge !== 0) {
    throw new Error(
      `ประจุรวมของ '${cation.ionId}' กับ '${anion.ionId}' ไม่เป็นศูนย์ (${netCharge})`,
    );
  }

  return {
    compoundId: `${cation.ionId}__${anion.ionId}`,
    cationId: cation.ionId,
    anionId: anion.ionId,
    cationCount,
    anionCount,
    phase: resolvePhase(cation.ionId, anion.ionId),
    formula: renderCompoundFormula(cation, anion, cationCount, anionCount),
    nameTh: `${cation.nameStemTh}${anion.nameStemTh}`,
    atoms: combineAtoms([
      { atoms: cation.atoms, multiplier: cationCount },
      { atoms: anion.atoms, multiplier: anionCount },
    ]),
  };
}

export function buildCompoundById(
  cationId: string,
  anionId: string,
): CompoundDef {
  return buildCompound(getIon(cationId), getIon(anionId));
}

/** ประจุรวมของสารประกอบ ต้องเป็นศูนย์เสมอ */
export function compoundNetCharge(compound: CompoundDef): number {
  return (
    getIon(compound.cationId).charge * compound.cationCount +
    getIon(compound.anionId).charge * compound.anionCount
  );
}

export function isPrecipitate(compound: CompoundDef): boolean {
  return compound.phase === "s";
}
