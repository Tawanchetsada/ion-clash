import { buildLevel } from "./buildLevel";
import { LEVEL_SEEDS } from "./levelSeeds";
import type { BuiltLevel } from "./buildLevel";
import type { Difficulty } from "./levelSeeds";

/**
 * ระดับความยากที่คาดหวังจากช่วงเลขด่าน — id 1-10 = easy, 11-20 = basic ...
 * ตรงกับตาราง "ระดับความยาก คะแนน ดาว และการปลดล็อก" ในสเปกเพราะหน้าเลือก
 * ด่านจัดกลุ่มตามช่วงเลขด่านกลุ่มละ 10 เป๊ะ ไม่ใช่ตามความซับซ้อนของสูตร
 */
export function expectedDifficulty(id: number): Difficulty {
  if (id <= 10) return "easy";
  if (id <= 20) return "basic";
  if (id <= 30) return "medium";
  if (id <= 40) return "hard";
  return "challenge";
}

/**
 * ด่านทั้ง 50 ผ่านการคำนวณและตรวจสอบเคมีแล้ว — import ไฟล์นี้เท่ากับรัน
 * build-time validation ในตัว เพราะ buildLevel throw ทันทีถ้าด่านใดผิด
 */
export const LEVELS: readonly BuiltLevel[] = LEVEL_SEEDS.map(buildLevel);

const LEVEL_BY_ID: ReadonlyMap<number, BuiltLevel> = new Map(
  LEVELS.map((level) => [level.id, level]),
);

export function getLevel(id: number): BuiltLevel {
  const level = LEVEL_BY_ID.get(id);
  if (!level) {
    throw new Error(`ไม่พบด่าน id ${id}`);
  }
  return level;
}
