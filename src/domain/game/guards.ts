import { checkCoefficients } from "../chemistry/balance";
import { buildCompound } from "../chemistry/compounds";
import { getIon } from "../chemistry/ions";
import { validateProductPairing } from "../chemistry/reaction";
import { completeIonicCards, reactantIonCards } from "./instances";
import type { BuiltLevel } from "../../data/buildLevel";
import type { CompoundDef, ValidationResult } from "../chemistry/types";
import type { EquationCard } from "./instances";
import type { CanceledPair, GameState } from "./types";

/**
 * เงื่อนไขออกของแต่ละสถานะ
 *
 * ไฟล์นี้เป็นตัวห่อ validator ของ Phase 1 ให้รับ state ของเกมได้ **ไม่ตัดสิน
 * เคมีเอง** — ทุกคำตอบว่าถูกหรือผิดยังมาจาก `domain/chemistry/` ที่เดียว
 */

// ─────────────────────────────────────────────── ขั้นวางไอออนและขั้นดุล

/**
 * ด่านนี้ต้องดุลหรือไม่ — อ่านจากสัมประสิทธิ์จริงของด่าน ไม่ใช่จากเลขด่าน
 *
 * เอกสารแผนเขียนว่า "ด่าน 01-10 ข้ามขั้นดุล" แต่ข้อมูลจริงมี 13 ด่านที่เป็น
 * 1:1:1:1 คือด่าน 1-10 บวกด่าน 18, 19 และ 38 ถ้า hard-code ตามเลขด่าน
 * สามด่านนั้นจะโผล่ช่องกรอกที่ทุกช่องตอบ 1 ซึ่งไม่มีอะไรให้เรียนรู้ และขัด
 * D-04 ที่ให้ซ่อนช่องสัมประสิทธิ์เมื่อโจทย์ไม่ต้องดุล
 */
export function needsBalancing(level: BuiltLevel): boolean {
  const { a, b, c, d } = level.coefficients;
  return !(a === 1 && b === 1 && c === 1 && d === 1);
}

export function isArrangementComplete(state: GameState): boolean {
  return (
    state.slots.length === 4 &&
    state.slots.every((slot) => slot.ionInstanceId !== null)
  );
}

/** ionId ที่ผู้เล่นวางไว้ในแต่ละช่อง — null เมื่อช่องว่างหรือ id ไม่รู้จัก */
export function slotIonIds(
  state: GameState,
  level: BuiltLevel,
): readonly (string | null)[] {
  const byInstance = new Map(
    reactantIonCards(level).map((card) => [card.instanceId, card.ionId]),
  );

  return state.slots.map((slot) =>
    slot.ionInstanceId === null
      ? null
      : (byInstance.get(slot.ionInstanceId) ?? null),
  );
}

export function checkArrangement(
  state: GameState,
  level: BuiltLevel,
): ValidationResult {
  const ionIds = slotIonIds(state, level);
  const filled = ionIds.filter((ionId): ionId is string => ionId !== null);
  if (ionIds.length !== 4 || filled.length !== 4) {
    // ปุ่มตรวจต้อง disabled ก่อนวางครบ — reducer กันไว้อีกชั้นก่อนถึงตรงนี้
    return { ok: false, code: "E-PAIR" };
  }

  return validateProductPairing(
    filled.map((ionId) => ({ ionId })),
    level,
  );
}

/**
 * สารประกอบผลิตภัณฑ์ที่ผู้เล่นประกอบขึ้นเอง เรียงตามคู่ที่ผู้เล่นวาง
 *
 * ต้องใช้ลำดับของผู้เล่น ไม่ใช่ `level.productA/productB` เพราะ D-03 อนุญาต
 * ให้วางคู่ตะกอนไว้คู่ที่ 1 หรือคู่ที่ 2 ก็ได้ ถ้าใช้ลำดับของด่านมาตรวจ
 * สัมประสิทธิ์ ผู้เล่นที่วางสลับคู่จะถูกตัดสินว่าผิดทั้งที่ตอบถูก
 */
export function playerProducts(
  state: GameState,
  level: BuiltLevel,
): readonly [CompoundDef, CompoundDef] | null {
  const ionIds = slotIonIds(state, level);
  const [first, second, third, fourth] = ionIds;
  if (!first || !second || !third || !fourth) return null;

  const pair = (cationId: string, anionId: string): CompoundDef | null => {
    const cation = getIon(cationId);
    const anion = getIon(anionId);
    if (cation.charge <= 0 || anion.charge >= 0) return null;
    return buildCompound(cation, anion);
  };

  const productA = pair(first, second);
  const productB = pair(third, fourth);
  if (!productA || !productB) return null;

  return [productA, productB];
}

export function isBalanceComplete(state: GameState): boolean {
  return state.coefficients.every((value) => value !== null);
}

export function checkBalance(
  state: GameState,
  level: BuiltLevel,
): ValidationResult {
  const products = playerProducts(state, level);
  if (!products) return { ok: false, code: "E-PAIR" };

  const [a, b, c, d] = state.coefficients;
  if (a === null || b === null || c === null || d === null) {
    return { ok: false, code: "E-BALANCE" };
  }

  return checkCoefficients(level.reactantA, level.reactantB, products[0], products[1], {
    a,
    b,
    c,
    d,
  });
}

// ───────────────────────────────────────────────── ขั้นตัดไอออนผู้ชม

export function findEquationCard(
  level: BuiltLevel,
  instanceId: string,
): EquationCard | null {
  const cards = completeIonicCards(level);
  return (
    [...cards.left, ...cards.right].find(
      (card) => card.instanceId === instanceId,
    ) ?? null
  );
}

export function isCardCanceled(state: GameState, instanceId: string): boolean {
  return state.canceledPairs.some(
    (pair) =>
      pair.leftInstanceId === instanceId || pair.rightInstanceId === instanceId,
  );
}

/**
 * ตรวจคู่ที่ผู้เล่นเลือกตัด
 *
 * จับคู่ด้วย ionId + ประจุ + สถานะ + จำนวน ตามสเปก ไม่เทียบข้อความสูตร
 * เพราะ Fe²⁺ กับ Fe³⁺ เขียนด้วยสัญลักษณ์ Fe เหมือนกัน แยกได้ด้วยประจุเท่านั้น
 */
export function checkCancelPair(
  level: BuiltLevel,
  leftInstanceId: string,
  rightInstanceId: string,
): ValidationResult {
  const left = findEquationCard(level, leftInstanceId);
  const right = findEquationCard(level, rightInstanceId);

  if (!left || !right || left.side !== "left" || right.side !== "right") {
    return { ok: false, code: "E-SPECTATOR" };
  }

  const leftTerm = left.term;
  const rightTerm = right.term;

  // ตะกอนไม่ได้แตกตัวเป็นไอออนอิสระ จึงตัดไม่ได้
  if (leftTerm.kind !== "ion" || rightTerm.kind !== "ion") {
    return { ok: false, code: "E-SPECTATOR" };
  }

  if (
    leftTerm.ionId !== rightTerm.ionId ||
    leftTerm.count !== rightTerm.count ||
    leftTerm.phase !== rightTerm.phase ||
    getIon(leftTerm.ionId).charge !== getIon(rightTerm.ionId).charge
  ) {
    return { ok: false, code: "E-SPECTATOR" };
  }

  const spectator = level.spectators.find(
    (candidate) => candidate.ionId === leftTerm.ionId,
  );
  if (!spectator || spectator.count !== leftTerm.count) {
    return { ok: false, code: "E-SPECTATOR" };
  }

  return { ok: true };
}

/** คู่ที่ถูกต้องทั้งหมดของด่านนี้ — ใช้นับว่าตัดครบหรือยัง */
export function correctSpectatorPairs(level: BuiltLevel): readonly CanceledPair[] {
  const cards = completeIonicCards(level);

  return level.spectators.flatMap((spectator): CanceledPair[] => {
    const left = cards.left.find(
      (card) => card.term.kind === "ion" && card.term.ionId === spectator.ionId,
    );
    const right = cards.right.find(
      (card) => card.term.kind === "ion" && card.term.ionId === spectator.ionId,
    );
    if (!left || !right) return [];
    return [{ leftInstanceId: left.instanceId, rightInstanceId: right.instanceId }];
  });
}

export function isCancellationComplete(
  state: GameState,
  level: BuiltLevel,
): boolean {
  const required = correctSpectatorPairs(level);
  if (state.canceledPairs.length !== required.length) return false;

  return required.every((expected) =>
    state.canceledPairs.some(
      (actual) =>
        actual.leftInstanceId === expected.leftInstanceId &&
        actual.rightInstanceId === expected.rightInstanceId,
    ),
  );
}
