import { getIon } from "../chemistry/ions";
import type { BuiltLevel } from "../../data/buildLevel";
import type { CompoundDef, EquationTerm, Phase } from "../chemistry/types";

/**
 * การ์ดแต่ละใบในด่าน พร้อม instanceId ที่ **คำนวณซ้ำได้เสมอ** ตาม D-21
 *
 * checkpoint กลางด่านเก็บว่า "ช่องไหนมีการ์ด id อะไร" และ "ตัดคู่ id ไหนไปแล้ว"
 * ลง localStorage ถ้า id ถูกสร้างตอน render หรือสุ่มด้วย crypto.randomUUID()
 * การเปิดแท็บใหม่จะได้ id คนละชุด แล้วการกู้ checkpoint จะหาการ์ดไม่เจอ —
 * ช่องว่างเปล่าโดยไม่มี error ให้เห็น ซึ่งเป็นบั๊กที่ไล่หาสาเหตุยากมาก
 *
 * id จึงประกอบจากข้อมูลด่านล้วน ๆ และมี `levelId` นำหน้าเสมอ เพื่อให้
 * checkpoint ของด่านอื่นจับคู่ไม่ติด แทนที่จะวางการ์ดผิดด่านแบบเงียบ ๆ
 * ผลพลอยได้คือ id อ่านออกด้วยตา ทำให้ดีบักเซฟในเครื่องนักเรียนได้
 */

export type IonCard = {
  instanceId: string;
  ionId: string;
  charge: number;
  /**
   * ตัวห้อยของไอออนนี้ในสารตั้งต้นที่มันมา เช่น Pb(NO₃)₂ ให้ NO₃⁻ count = 2
   * ใช้แสดงผลในขั้นแยกไอออนเท่านั้น — ตัวห้อยของผลิตภัณฑ์มาจากการไขว้ประจุ
   * ตอนประกอบสารประกอบใหม่ ไม่ได้มาจากค่านี้
   */
  count: number;
  phase: Phase;
  sourceCompoundId: string;
  order: number;
};

/** การ์ดหนึ่งใบในสมการไอออนิกสมบูรณ์ — เป็นไอออนอิสระหรือตะกอนที่ไม่แตกตัว */
export type EquationCard = {
  instanceId: string;
  term: EquationTerm;
  side: "left" | "right";
  order: number;
};

export const SLOT_COUNT = 4;

function ionCard(
  levelId: number,
  compound: CompoundDef,
  role: "a" | "b",
  part: "cat" | "an",
  order: number,
): IonCard {
  const ionId = part === "cat" ? compound.cationId : compound.anionId;
  const count = part === "cat" ? compound.cationCount : compound.anionCount;

  return {
    instanceId: `L${levelId}:react:${role}:${part}`,
    ionId,
    charge: getIon(ionId).charge,
    count,
    // สารตั้งต้นเป็น (aq) ทั้งคู่เสมอ ไอออนที่แตกตัวจึงอยู่ในน้ำ
    phase: "aq",
    sourceCompoundId: compound.compoundId,
    order,
  };
}

/**
 * การ์ดไอออนของสารตั้งต้น — 4 ใบเสมอทุกด่านตาม D-03
 *
 * ไม่แสดงไอออนซ้ำตามสัมประสิทธิ์ เพราะด่านอย่าง Al₂(SO₄)₃ + 3BaCl₂
 * จะกลายเป็นการ์ด 12 ใบซึ่งใช้บนมือถือไม่ได้ จำนวนสื่อด้วยช่องสัมประสิทธิ์แทน
 */
export function reactantIonCards(level: BuiltLevel): readonly IonCard[] {
  return [
    ionCard(level.id, level.reactantA, "a", "cat", 0),
    ionCard(level.id, level.reactantA, "a", "an", 1),
    ionCard(level.id, level.reactantB, "b", "cat", 2),
    ionCard(level.id, level.reactantB, "b", "an", 3),
  ];
}

/** id ของช่องผลิตภัณฑ์ 4 ช่อง — ช่อง 0,1 เป็นคู่แรก และ 2,3 เป็นคู่ที่สอง */
export function productSlotIds(
  level: BuiltLevel,
): readonly [string, string, string, string] {
  return [
    `L${level.id}:slot:0`,
    `L${level.id}:slot:1`,
    `L${level.id}:slot:2`,
    `L${level.id}:slot:3`,
  ];
}

function equationCard(
  levelId: number,
  term: EquationTerm,
  side: "left" | "right",
  order: number,
): EquationCard {
  const key =
    term.kind === "ion" ? `ion:${term.ionId}` : `cpd:${term.compound.compoundId}`;

  return {
    instanceId: `L${levelId}:ci:${side === "left" ? "l" : "r"}:${key}`,
    term,
    side,
    order,
  };
}

/**
 * การ์ดของสมการไอออนิกสมบูรณ์ — หนึ่งพจน์ต่อหนึ่งใบ
 *
 * `buildCompleteIonic` รวมพจน์ชนิดเดียวกันไว้แล้ว จึงไม่มี ionId ซ้ำในข้างเดียวกัน
 * และการตัดไอออนตัวประกอบจึงตัดทั้งใบครั้งเดียว (เช่น `2NO₃⁻`) ตาม D-03 ซึ่งถูกต้อง
 * เพราะในปฏิกิริยาแลกคู่ที่ดุลแล้ว ไอออนตัวประกอบมีจำนวนเท่ากันสองข้างเสมอ
 */
export function completeIonicCards(level: BuiltLevel): {
  readonly left: readonly EquationCard[];
  readonly right: readonly EquationCard[];
} {
  return {
    left: level.completeIonic.reactants.map((term, index) =>
      equationCard(level.id, term, "left", index),
    ),
    right: level.completeIonic.products.map((term, index) =>
      equationCard(level.id, term, "right", index),
    ),
  };
}

/** id ทุกใบของด่านนี้ ใช้กรอง checkpoint ที่อ้างการ์ดที่ไม่มีอยู่จริง */
export function allInstanceIds(level: BuiltLevel): ReadonlySet<string> {
  const cards = completeIonicCards(level);
  return new Set([
    ...reactantIonCards(level).map((card) => card.instanceId),
    ...productSlotIds(level),
    ...cards.left.map((card) => card.instanceId),
    ...cards.right.map((card) => card.instanceId),
  ]);
}
