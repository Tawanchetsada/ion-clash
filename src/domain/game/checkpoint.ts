import { emptyErrorTally } from "../chemistry/types";
import { allInstanceIds, productSlotIds } from "./instances";
import { readElapsed } from "./timer";
import type { BuiltLevel } from "../../data/buildLevel";
import type { ErrorCode, ErrorTally } from "../chemistry/types";
import type { CheckpointState, LevelCheckpoint } from "../../storage/schema";
import type { GameState } from "./types";

/**
 * สะพานระหว่าง state ของเกมกับ checkpoint ที่บันทึกลงเครื่อง
 *
 * เก็บเฉพาะ**ความหมาย** ไม่เก็บพิกัดการลาก ไม่เก็บ DOM id ไม่เก็บสถานะ
 * อนิเมชัน — ของพวกนั้นสร้างใหม่ได้และทำให้ migration ยากโดยไม่จำเป็น
 *
 * ไฟล์นี้ import type จาก `storage/schema` อย่างเดียว (ถูกลบทิ้งตอน build
 * ไม่เหลือการพึ่งพาตอนรัน) เพื่อไม่ให้มีนิยามรูปร่าง checkpoint สองที่แล้วเพี้ยนกัน
 */

/** 4 สถานะที่บันทึกกลางด่านได้ — ตรงกับ CHECKPOINT_STATES ในชั้นบันทึก */
const CHECKPOINTABLE: Readonly<Record<string, CheckpointState | undefined>> = {
  arrangeProductIons: "arrangeProductIons",
  balanceEquation: "balanceEquation",
  validateProducts: "validateProducts",
  cancelSpectatorIons: "cancelSpectatorIons",
};

/**
 * แปลง state เป็น checkpoint — คืน null เมื่ออยู่ในสถานะที่ไม่ต้องบันทึก
 *
 * รับ `at` เข้ามาเพราะเวลาที่กำลังเดินอยู่ยังไม่ถูกพับเข้า `elapsedMs`
 * ถ้าบันทึกค่าดิบไป เวลาของช่วงที่เล่นก่อน autosave ครั้งล่าสุดจะหายทุกครั้ง
 */
export function toCheckpoint(
  state: GameState,
  options: { at: number; savedAt: string },
): LevelCheckpoint | null {
  const checkpointState = CHECKPOINTABLE[state.phase];
  if (!checkpointState) return null;

  return {
    levelId: state.levelId,
    state: checkpointState,
    slotAssignments: state.slots.map((slot) => ({ ...slot })),
    coefficients: [...state.coefficients],
    canceledPairs: state.canceledPairs.map((pair) => ({ ...pair })),
    hintsUsed: state.hintsUsed,
    wrongAttempts: state.wrongAttempts,
    errorsByCode: { ...state.errorsByCode },
    elapsedMs: readElapsed(state, options.at),
    savedAt: options.savedAt,
  };
}

function restoreTally(raw: ErrorTally): ErrorTally {
  const tally = emptyErrorTally() as Record<ErrorCode, number>;
  for (const [code, count] of Object.entries(raw)) {
    if (code in tally && typeof count === "number" && count >= 0) {
      tally[code as ErrorCode] = Math.round(count);
    }
  }
  return tally;
}

/**
 * กู้ state จาก checkpoint — คืน null เมื่อ checkpoint ไม่ใช่ของด่านนี้
 *
 * **กรอง id ที่ไม่รู้จักทิ้ง ไม่ throw** ถ้าวันหน้าข้อมูลด่านถูกแก้จนการ์ดเปลี่ยน
 * นักเรียนควรได้เริ่มด่านนั้นใหม่ ไม่ใช่เปิดเว็บไม่ได้ทั้งเว็บ
 *
 * **ไม่แตะ attempts** — จำนวนครั้งที่เล่นเพิ่มตอนจบด่านเท่านั้น ถ้าเพิ่มตอน
 * กู้ checkpoint ด้วย นักเรียนที่รีเฟรชบ่อยจะดูเหมือนพยายามเยอะเกินจริง
 * แล้วสถิติงานวิจัยเพี้ยนทั้งชุด
 */
export function applyCheckpoint(
  checkpoint: LevelCheckpoint,
  level: BuiltLevel,
  at: number,
): GameState | null {
  if (checkpoint.levelId !== level.id) return null;

  const known = allInstanceIds(level);
  const slotIds = productSlotIds(level);
  const saved = new Map(
    checkpoint.slotAssignments.map((slot) => [slot.slotId, slot.ionInstanceId]),
  );

  const slots = slotIds.map((slotId) => {
    const ionInstanceId = saved.get(slotId) ?? null;
    return {
      slotId,
      ionInstanceId:
        ionInstanceId !== null && known.has(ionInstanceId)
          ? ionInstanceId
          : null,
    };
  });

  const canceledPairs = checkpoint.canceledPairs.filter(
    (pair) => known.has(pair.leftInstanceId) && known.has(pair.rightInstanceId),
  );

  return {
    phase: checkpoint.state,
    levelId: level.id,
    slots,
    coefficients: checkpoint.coefficients,
    canceledPairs,
    selection: null,
    hintsUsed: Math.min(checkpoint.hintsUsed, level.hints.length),
    wrongAttempts: checkpoint.wrongAttempts,
    errorsByCode: restoreTally(checkpoint.errorsByCode),
    // เดินนาฬิกาต่อทันที เพราะผู้เล่นกลับมาอยู่กลางด่านแล้ว
    startedAt: at,
    elapsedMs: checkpoint.elapsedMs,
    lastFeedback: null,
  };
}
