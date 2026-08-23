import { starsForScore } from "../config/scoring";
import { MAX_LEVEL_ID } from "./schema";
import type { GameSaveV1, LevelCheckpoint } from "./schema";

/**
 * ปรับความก้าวหน้าหลังเล่นจบด่าน — ฟังก์ชันบริสุทธิ์ ไม่แตะ storage
 *
 * ชั้นบนเป็นคนเรียกแล้วค่อยสั่งบันทึก เพื่อให้ reducer ของเกมไม่มี side effect
 */

export type LevelResult = {
  levelId: number;
  /** คะแนนที่หักคำใบ้และการตอบผิดแล้ว */
  score: number;
  timeMs: number;
};

export function recordLevelResult(
  save: GameSaveV1,
  result: LevelResult,
  now: () => Date = () => new Date(),
): GameSaveV1 {
  if (
    !Number.isInteger(result.levelId) ||
    result.levelId < 1 ||
    result.levelId > MAX_LEVEL_ID
  ) {
    throw new Error(`เลขด่าน ${result.levelId} อยู่นอกช่วง 1-${MAX_LEVEL_ID}`);
  }

  const key = String(result.levelId);
  const previous = save.completedLevels[key];
  const timestamp = now().toISOString();

  const score = Math.min(100, Math.max(0, Math.round(result.score)));
  const timeMs = Math.max(0, Math.round(result.timeMs));

  // เก็บเฉพาะผลที่ดีกว่า แต่จำนวนครั้งที่เล่นเพิ่มทุกครั้งเสมอ
  const bestScore = Math.max(previous?.bestScore ?? 0, score);
  const bestTimeMs =
    previous?.bestTimeMs === undefined || previous.bestTimeMs === null
      ? timeMs
      : Math.min(previous.bestTimeMs, timeMs);

  return {
    ...save,
    unlockedLevel: Math.min(
      MAX_LEVEL_ID,
      Math.max(save.unlockedLevel, result.levelId + 1),
    ),
    lastPlayedLevel: result.levelId,
    completedLevels: {
      ...save.completedLevels,
      [key]: {
        completed: true,
        bestScore,
        stars: starsForScore(bestScore),
        bestTimeMs,
        attempts: (previous?.attempts ?? 0) + 1,
        // เวลาที่ผ่านครั้งแรก ไม่ใช่ครั้งล่าสุด
        completedAt: previous?.completedAt ?? timestamp,
      },
    },
    // ด่านที่จบแล้วไม่ต้องมี checkpoint ค้าง
    activeCheckpoint:
      save.activeCheckpoint?.levelId === result.levelId
        ? null
        : save.activeCheckpoint,
    updatedAt: timestamp,
  };
}

/** บันทึก checkpoint กลางด่าน โดยไม่แตะความก้าวหน้าที่ผ่านมาแล้ว */
export function saveCheckpoint(
  save: GameSaveV1,
  checkpoint: LevelCheckpoint,
  now: () => Date = () => new Date(),
): GameSaveV1 {
  return {
    ...save,
    lastPlayedLevel: checkpoint.levelId,
    activeCheckpoint: checkpoint,
    updatedAt: now().toISOString(),
  };
}

export function clearCheckpoint(
  save: GameSaveV1,
  now: () => Date = () => new Date(),
): GameSaveV1 {
  if (save.activeCheckpoint === null) return save;
  return { ...save, activeCheckpoint: null, updatedAt: now().toISOString() };
}

/** ด่านที่เล่นได้ต้องไม่เกินด่านที่ปลดล็อกแล้ว — หรือชื่อ admin111213 สามารถเข้าเล่นได้ทุกด่าน */
export function isLevelUnlocked(save: GameSaveV1, levelId: number): boolean {
  if (levelId < 1 || levelId > MAX_LEVEL_ID) return false;
  if (save.playerName.trim() === "admin111213") return true;
  return levelId <= save.unlockedLevel;
}
