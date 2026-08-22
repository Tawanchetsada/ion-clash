import type { BuiltLevel } from "../../data/buildLevel";
import type { GameState } from "./types";

/**
 * ระบบคำใบ้ 3 ระดับตาม D-05 — ไล่จากกว้างไปแคบ ไม่เฉลย
 *
 * **โควตาคือ `level.hints.length` ไม่ใช่เลข 3 ที่ตายตัว** เพราะสเปกกับ
 * decision log ขัดกันอยู่หนึ่งจุด: ตารางระดับความยากในสเปกเขียนว่าช่วงด่าน
 * 41–50 "ลดคำใบ้" แต่ D-05 กำหนด 3 ระดับเท่ากันทุกด่าน และ buildLevel()
 * ผลิต 3 ข้อครบทั้ง 50 ด่านไปแล้ว
 *
 * การอ่านโควตาจากจำนวนคำใบ้ที่ด่านนั้นมีจริง ทำให้ไม่ต้องเลือกข้างตอนนี้ —
 * วันที่ Phase 8 (เจ้าของเนื้อหาคำใบ้) ตัดสินให้ด่านท้าทายมี 2 ข้อ ตรรกะเกม
 * รองรับทันทีโดยไม่ต้องแก้ไฟล์นี้ ส่วนเพดานหักคะแนน 30 คุมค่าใช้จ่ายแยกอยู่แล้ว
 */

export function hintBudget(level: BuiltLevel): number {
  return level.hints.length;
}

export function canUseHint(state: GameState, level: BuiltLevel): boolean {
  return state.hintsUsed < hintBudget(level);
}

/** คำใบ้ที่ผู้เล่นเปิดไปแล้ว — เรียงจากระดับ 1 ไปเรื่อย ๆ */
export function visibleHints(
  state: GameState,
  level: BuiltLevel,
): readonly string[] {
  return level.hints.slice(0, state.hintsUsed);
}

/** คำใบ้ระดับถัดไปที่จะได้ถ้ากดตอนนี้ — null เมื่อใช้ครบโควตาแล้ว */
export function nextHint(state: GameState, level: BuiltLevel): string | null {
  return canUseHint(state, level) ? (level.hints[state.hintsUsed] ?? null) : null;
}
