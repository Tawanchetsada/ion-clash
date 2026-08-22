import type { ErrorCode, ErrorTally } from "../chemistry/types";

/**
 * รูปร่าง state ของการเล่นหนึ่งด่าน
 *
 * **กฎเหล็ก:** สถานะของเกมอยู่ในฟิลด์ `phase` ฟิลด์เดียว ห้ามเพิ่ม boolean
 * แยกอย่าง isGold / isDone / showResult เพราะจะเกิดสถานะที่เป็นไปไม่ได้
 * เช่นทั้งทองและผิดพร้อมกัน (ข้อห้ามตรง ๆ ในสเปก)
 *
 * ทุกอย่างที่คำนวณจาก `phase` กับข้อมูลด่านได้ ห้ามเก็บซ้ำใน state —
 * การ์ดไอออน ช่องผลิตภัณฑ์ และคำใบ้ที่เปิดแล้ว ล้วน derive ได้ทั้งหมด
 */

export const GAME_PHASES = [
  "levelSelect",
  "levelIntro",
  "dissociateReactants",
  "arrangeProductIons",
  "balanceEquation",
  "validateProducts",
  "cancelSpectatorIons",
  "netIonicResult",
  "levelComplete",
] as const;

export type GamePhase = (typeof GAME_PHASES)[number];

/** ช่องผลิตภัณฑ์หนึ่งช่อง — รูปร่างเดียวกับที่ checkpoint เก็บ จะได้แปลงตรง ๆ */
export type SlotAssignment = {
  slotId: string;
  ionInstanceId: string | null;
};

export type CanceledPair = {
  leftInstanceId: string;
  rightInstanceId: string;
};

/** [สารตั้งต้น A, สารตั้งต้น B, ผลิตภัณฑ์คู่ที่ 1, ผลิตภัณฑ์คู่ที่ 2] */
export type CoefficientInputs = readonly [
  number | null,
  number | null,
  number | null,
  number | null,
];

export type Selection = {
  side: "left" | "right";
  instanceId: string;
} | null;

export type Feedback = {
  kind: "success" | "error";
  /** null เมื่อเป็นข้อความสำเร็จ */
  code: ErrorCode | null;
  messageTh: string;
};

export type GameState = {
  phase: GamePhase;
  levelId: number;
  slots: readonly SlotAssignment[];
  coefficients: CoefficientInputs;
  canceledPairs: readonly CanceledPair[];
  selection: Selection;
  /** เพดานคือ `level.hints.length` ไม่ใช่เลข 3 ที่ตายตัว — ดู hints.ts */
  hintsUsed: number;
  wrongAttempts: number;
  /**
   * แยกตามรหัสเพื่อให้งานวิจัยตอบได้ว่านักเรียนพลาดเรื่องอะไรบ่อย
   * ต้องเก็บตั้งแต่แรก เพราะย้อนกลับมาเก็บทีหลังไม่ได้
   */
  errorsByCode: ErrorTally;
  /** เวลาเริ่มจับรอบปัจจุบัน — null แปลว่านาฬิกาหยุดอยู่ */
  startedAt: number | null;
  /** เวลาสะสมของรอบที่ปิดไปแล้ว ไม่รวมรอบที่กำลังเดิน */
  elapsedMs: number;
  lastFeedback: Feedback | null;
};
