import { LEVELS } from "../data/levels";
import { isLevelUnlocked } from "../storage/progress";
import type { Stars } from "../config/scoring";
import type { Difficulty } from "../data/levelSeeds";
import type { GameSaveV1 } from "../storage/schema";

/** view model ของหน้าเลือกด่าน — LevelGrid/LevelTile/DifficultyGroup วาดจากนี้ตรง ๆ */

export type LevelStatus = "completed" | "current" | "locked";

export type LevelTileView = {
  levelId: number;
  status: LevelStatus;
  /** คู่กับสีเสมอ ตามกติกาห้ามสื่อสถานะด้วยสีอย่างเดียว */
  statusLabelTh: string;
  stars: Stars;
};

export type DifficultyGroupView = {
  difficulty: Difficulty;
  labelTh: string;
  levels: readonly LevelTileView[];
};

import { MESSAGES } from "../config/messages";

const DIFFICULTY_LABEL_TH = MESSAGES.ui.difficulty;
const STATUS_LABEL_TH = MESSAGES.ui.levelStatus;

/**
 * เลเวลที่ปลดล็อกแต่ยังไม่ผ่าน = ด่านปัจจุบัน
 *
 * `unlockedLevel` ขยับไปทีละหนึ่งเสมอเมื่อผ่านด่าน (ดู recordLevelResult)
 * ดังนั้นในสถานะปกติจะมีด่านแบบนี้อยู่ไม่เกินหนึ่งด่านเท่านั้น
 */
function levelTileView(levelId: number, save: GameSaveV1): LevelTileView {
  const progress = save.completedLevels[String(levelId)];
  const status: LevelStatus = progress?.completed
    ? "completed"
    : isLevelUnlocked(save, levelId)
      ? "current"
      : "locked";

  return {
    levelId,
    status,
    statusLabelTh: STATUS_LABEL_TH[status],
    stars: progress?.stars ?? 0,
  };
}

/** 50 ด่านจัดกลุ่มเป็น 5 ช่วงความยาก ช่วงละ 10 ด่าน ตามหน้าเลือกด่านใน UI PDF */
export function levelGridView(save: GameSaveV1): readonly DifficultyGroupView[] {
  const groups = new Map<Difficulty, LevelTileView[]>();

  for (const level of LEVELS) {
    const tiles = groups.get(level.difficulty) ?? [];
    tiles.push(levelTileView(level.id, save));
    groups.set(level.difficulty, tiles);
  }

  return [...groups.entries()].map(([difficulty, levels]) => ({
    difficulty,
    labelTh: DIFFICULTY_LABEL_TH[difficulty],
    levels,
  }));
}
