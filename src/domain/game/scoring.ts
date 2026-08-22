import { SCORING } from "../../config/scoring";

/**
 * คะแนนของด่าน
 *
 * ตัวเลขทั้งหมดมาจาก `src/config/scoring.ts` ไฟล์เดียว ห้าม hard-code ที่นี่
 * เพราะผู้วิจัยต้องปรับได้หลังทดลองนำร่องโดยไม่ต้องแตะตรรกะเกม (D-12)
 *
 *   คะแนน = 100 − min(ผิด × 5, 30) − min(คำใบ้ × 10, 30)  แล้วไม่ต่ำกว่า 40
 *
 * พื้น 40 คะแนนมีไว้ให้ผู้เรียนที่ต้องลองผิดลองถูกหลายรอบยังผ่านด่านได้
 * ไม่ใช่ติดลบจนท้อ — เป็นสื่อการเรียนรู้ ไม่ใช่ข้อสอบวัดผล
 */
export function computeScore(input: {
  wrongAttempts: number;
  hintsUsed: number;
}): number {
  const wrongPenalty = Math.min(
    Math.max(0, input.wrongAttempts) * SCORING.penaltyPerWrong,
    SCORING.maxWrongPenalty,
  );
  const hintPenalty = Math.min(
    Math.max(0, input.hintsUsed) * SCORING.penaltyPerHint,
    SCORING.maxHintPenalty,
  );

  const raw = SCORING.startScore - wrongPenalty - hintPenalty;
  return Math.min(SCORING.startScore, Math.max(SCORING.minPassScore, raw));
}
