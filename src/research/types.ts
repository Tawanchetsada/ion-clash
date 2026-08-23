import type { ErrorTally } from "../domain/chemistry/types";

/**
 * ข้อมูลเหตุการณ์การเรียนรู้ระดับด่านสำหรับงานวิจัย (Phase 9)
 *
 * บันทึกเมื่อผู้เรียนเล่นจบแต่ละด่าน (D-13)
 * ข้อมูลชุดนี้ไม่มีข้อมูลระบุตัวบุคคล (PII) เช่น ชื่อจริงเต็ม โรงเรียน อีเมล
 * ตามนโยบายความเป็นส่วนตัวของโครงการ (D-06, D-14)
 */
export type ResearchEvent = {
  playerName: string;
  installId: string;
  levelId: number;
  attemptNo: number;
  startedAt: string;
  finishedAt: string | null;
  elapsedMs: number;
  completed: boolean;
  score: number;
  stars: 0 | 1 | 2 | 3;
  hintsUsed: number;
  wrongAttempts: number;
  errorsByCode: ErrorTally;
};
