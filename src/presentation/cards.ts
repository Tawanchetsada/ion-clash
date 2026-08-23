import { renderIon } from "../domain/chemistry/formula";
import { getIon } from "../domain/chemistry/ions";
import { compoundSpeechTh, ionSpeechTh } from "./speech";
import type { CompoundDef, FormulaAst, Phase } from "../domain/chemistry/types";
import type { EquationCard, IonCard } from "../domain/game/instances";

/**
 * แปลงข้อมูลด่าน (โดเมน) เป็น view model ที่ component วาดได้ตรง ๆ
 *
 * component ใน `src/components/` ห้าม import จาก `src/domain/chemistry/`
 * (บังคับด้วย ESLint + architecture.test.ts) แต่การ์ดไอออนต้องแสดงสูตรและ
 * aria-label ที่มาจากที่นั่น ชั้นนี้จึงเป็นคนเดียวที่เรียก `getIon()`/`renderIon()`
 * แล้วส่งต่อเป็นข้อมูลแบนราบให้ component วาดอย่างเดียว
 */

export type CardTone = "cation" | "anion" | "gold" | "neutral";

export type IonCardView = {
  instanceId: string;
  formula: FormulaAst;
  nameTh: string;
  /** "aq" หรือ "s" — ป้ายสถานะบนหน้าการ์ด ตามเอกสาร UI หน้า 07-11 */
  phaseTh: string;
  ariaLabel: string;
  tone: "cation" | "anion";
};

export function ionCardView(card: IonCard): IonCardView {
  const ion = getIon(card.ionId);
  return {
    instanceId: card.instanceId,
    formula: renderIon(ion, 1),
    nameTh: ion.nameTh,
    phaseTh: card.phase,
    ariaLabel: ionSpeechTh(ion, card.phase, 1),
    tone: ion.charge > 0 ? "cation" : "anion",
  };
}

/**
 * การ์ดไอออนอิสระที่ไม่ได้มาจากการ์ดสารตั้งต้น — ใช้กับกล่อง "ยังคงอยู่ใน
 * สารละลาย" ในขั้นที่ 3 ซึ่งต้องแสดงไอออนแยกกันคนละใบ ไม่ใช่รวมเป็นสูตร
 * สารประกอบ เพราะสารที่ละลายน้ำไม่ได้เกิดขึ้นจริงเป็นก้อน มันอยู่ในรูปไอออน
 * อิสระเสมอ (เอกสาร UI หน้า 09 วาดไว้แบบนี้)
 */
export function freeIonView(
  ionId: string,
  options: { count: number; phase: Phase; instanceId: string },
): IonCardView {
  const ion = getIon(ionId);
  return {
    instanceId: options.instanceId,
    formula: renderIon(ion, 1),
    nameTh: ion.nameTh,
    phaseTh: options.phase,
    ariaLabel: ionSpeechTh(ion, options.phase, 1),
    tone: ion.charge > 0 ? "cation" : "anion",
  };
}

export type CompoundCardView = {
  compoundId: string;
  formula: FormulaAst;
  nameTh: string;
  phaseTh: string;
  ariaLabel: string;
  tone: CardTone;
};

/**
 * `revealed` ไม่มีค่า default โดยตั้งใจ — บังคับให้ทุกจุดที่เรียกต้องตอบคำถามนี้
 * เอง TypeScript จะฟ้องทันทีถ้ามีที่ไหนลืมส่ง prop นี้ กันไม่ให้การ์ดตะกอน
 * กลายเป็นสีทองก่อนผ่านการตรวจ ซึ่งเป็นการเฉลยคำตอบล่วงหน้า
 */
export function compoundCardView(
  compound: CompoundDef,
  options: { revealed: boolean },
): CompoundCardView {
  const isGold = options.revealed && compound.phase === "s";
  return {
    compoundId: compound.compoundId,
    formula: compound.formula,
    nameTh: compound.nameTh,
    phaseTh: compound.phase,
    ariaLabel: compoundSpeechTh(compound),
    tone: isGold ? "gold" : "neutral",
  };
}

export type EquationCardView = {
  instanceId: string;
  formula: FormulaAst;
  nameTh: string;
  phaseTh: string;
  ariaLabel: string;
  tone: CardTone;
  side: "left" | "right";
};

/** การ์ดของสมการไอออนิกสมบูรณ์ — เป็นไอออนอิสระหรือตะกอนที่ยังไม่แตกตัว */
export function equationCardView(
  card: EquationCard,
  options: { revealed: boolean },
): EquationCardView {
  const { term } = card;

  if (term.kind === "ion") {
    const ion = getIon(term.ionId);
    return {
      instanceId: card.instanceId,
      formula: renderIon(ion, term.count),
      nameTh: ion.nameTh,
      phaseTh: term.phase,
      ariaLabel: ionSpeechTh(ion, term.phase, term.count),
      tone: ion.charge > 0 ? "cation" : "anion",
      side: card.side,
    };
  }

  const isGold = options.revealed && term.compound.phase === "s";
  return {
    instanceId: card.instanceId,
    formula: term.compound.formula,
    nameTh: term.compound.nameTh,
    phaseTh: term.compound.phase,
    ariaLabel: compoundSpeechTh(term.compound, term.count),
    tone: isGold ? "gold" : "neutral",
    side: card.side,
  };
}
