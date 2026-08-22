import { starsForScore } from "../../config/scoring";
import {
  isArrangementComplete,
  isBalanceComplete,
  isCancellationComplete,
} from "./guards";
import { computeScore } from "./scoring";
import { readElapsed } from "./timer";
import type { Stars } from "../../config/scoring";
import type { BuiltLevel } from "../../data/buildLevel";
import type { GamePhase, GameState } from "./types";

/**
 * ค่าที่อ่านออกมาจาก state ได้ — ไม่มีอะไรในนี้ที่ถูกเก็บซ้ำใน state
 */

/** ขั้นบน progress bar ที่ UI แสดง — null เมื่ออยู่นอกวงจรการเล่น */
export type ProgressStep = 1 | 2 | 3 | 4 | 5;

/**
 * 9 สถานะของเครื่อง → 5 ขั้นบนแถบ ตัวเลขสองชุดนี้ต่างกันโดยตั้งใจ
 *
 * สเปกมี 9 สถานะเพื่อให้ตรรกะไม่ปนกัน ส่วน UI มี 5 หน้าตามที่ออกแบบไว้
 * ยืนยันการจับคู่จาก UI PDF หน้า 06-11 ซึ่งแถบ 1-5 อยู่บนหัวทุกหน้า
 * และหน้าดุลสมการ (หน้า 08) ชี้ขั้น 2 เหมือนหน้าลากวาง ตาม D-04
 */
const STEP_BY_PHASE: Readonly<Record<GamePhase, ProgressStep | null>> = {
  levelSelect: null,
  levelIntro: 1,
  dissociateReactants: 1,
  arrangeProductIons: 2,
  balanceEquation: 2,
  validateProducts: 3,
  cancelSpectatorIons: 4,
  netIonicResult: 5,
  levelComplete: 5,
};

export function progressStep(phase: GamePhase): ProgressStep | null {
  return STEP_BY_PHASE[phase];
}

export function scoreOf(state: GameState): number {
  return computeScore(state);
}

export function starsOf(state: GameState): Stars {
  return starsForScore(scoreOf(state));
}

export function elapsedOf(state: GameState, at: number): number {
  return readElapsed(state, at);
}

/** ผลของด่านในรูปที่ `recordLevelResult` ของชั้นบันทึกรับได้ตรง ๆ */
export function levelResultOf(
  state: GameState,
  at: number,
): { levelId: number; score: number; timeMs: number } {
  return {
    levelId: state.levelId,
    score: scoreOf(state),
    timeMs: elapsedOf(state, at),
  };
}

// ───────────────────────────────────────── เงื่อนไขเปิด/ปิดปุ่มใน UI

export function canCheckArrangement(state: GameState): boolean {
  return state.phase === "arrangeProductIons" && isArrangementComplete(state);
}

export function canCheckBalance(state: GameState): boolean {
  return state.phase === "balanceEquation" && isBalanceComplete(state);
}

export function canConfirmCancellation(
  state: GameState,
  level: BuiltLevel,
): boolean {
  return (
    state.phase === "cancelSpectatorIons" && isCancellationComplete(state, level)
  );
}

/**
 * ตะกอนแสดงเป็นการ์ดสีทองได้หรือยัง
 *
 * สีทองคือสัญญาณรางวัลของคำตอบที่ผ่านการตรวจครบทุกข้อ — สูตร ประจุ สถานะ
 * และการดุล ห้ามทาสีก่อนหน้านั้นเด็ดขาด ดังนั้นเงื่อนไขคือผ่านขั้นตรวจผลิตภัณฑ์
 * ไปแล้วเท่านั้น ไม่ใช่แค่วางไอออนครบ
 */
export function isPrecipitateRevealed(state: GameState): boolean {
  const step = progressStep(state.phase);
  return step !== null && step >= 3;
}
