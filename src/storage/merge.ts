import { starsForScore } from "../config/scoring";
import { MAX_LEVEL_ID } from "./schema";
import type { GameSaveV1, LevelProgress } from "./schema";

/**
 * รวมเซฟสองชุด โดย**ความก้าวหน้าต้องไม่ลดลงไม่ว่ากรณีใด**
 *
 * ใช้สองที่ คือตอนนำเข้าไฟล์ที่ผู้ใช้เลือก และตอนซิงก์ระหว่างแท็บ
 * ถ้าเผลอให้ค่าฝั่งใดฝั่งหนึ่งชนะแบบตายตัว นักเรียนจะเสียความก้าวหน้า
 * โดยไม่รู้ตัว ซึ่งกู้คืนไม่ได้เลยถ้าไม่มีไฟล์ส่งออก
 */

function mergeTime(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}

function earlier(a: string, b: string): string {
  return Date.parse(a) <= Date.parse(b) ? a : b;
}

function later(a: string, b: string): string {
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

function mergeProgress(a: LevelProgress, b: LevelProgress): LevelProgress {
  const bestScore = Math.max(a.bestScore, b.bestScore);
  const completedAt =
    a.completedAt && b.completedAt
      ? earlier(a.completedAt, b.completedAt)
      : (a.completedAt ?? b.completedAt);

  return {
    completed: a.completed || b.completed,
    bestScore,
    // ดาวเป็นค่าที่คำนวณได้ ไม่ใช่ค่าที่ต้อง merge
    stars: starsForScore(bestScore),
    bestTimeMs: mergeTime(a.bestTimeMs, b.bestTimeMs),
    // ใช้ max ไม่ใช่ผลรวม เพราะสองฝั่งอาจมีประวัติร่วมกันอยู่แล้ว
    attempts: Math.max(a.attempts, b.attempts),
    completedAt,
  };
}

export function mergeSaves(local: GameSaveV1, incoming: GameSaveV1): GameSaveV1 {
  const newest = Date.parse(incoming.updatedAt) > Date.parse(local.updatedAt)
    ? incoming
    : local;

  const completedLevels: Record<string, LevelProgress> = {};
  const levelIds = new Set([
    ...Object.keys(local.completedLevels),
    ...Object.keys(incoming.completedLevels),
  ]);

  for (const id of levelIds) {
    const a = local.completedLevels[id];
    const b = incoming.completedLevels[id];
    if (a && b) {
      completedLevels[id] = mergeProgress(a, b);
    } else if (a ?? b) {
      completedLevels[id] = (a ?? b) as LevelProgress;
    }
  }

  const highestCompleted = Object.entries(completedLevels).reduce(
    (highest, [id, progress]) =>
      progress.completed ? Math.max(highest, Number(id)) : highest,
    0,
  );

  return {
    version: 1,
    // ตัวตนของเครื่องนี้ไม่เปลี่ยนเพราะการนำเข้าไฟล์ของคนอื่น
    installId: local.installId,
    playerName:
      newest.playerName.length > 0 ? newest.playerName : local.playerName,
    unlockedLevel: Math.min(
      MAX_LEVEL_ID,
      Math.max(local.unlockedLevel, incoming.unlockedLevel, highestCompleted + 1),
    ),
    completedLevels,
    lastPlayedLevel: newest.lastPlayedLevel,
    activeCheckpoint: newest.activeCheckpoint,
    settings: newest.settings,
    createdAt: earlier(local.createdAt, incoming.createdAt),
    updatedAt: later(local.updatedAt, incoming.updatedAt),
  };
}
