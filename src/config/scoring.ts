/**
 * ค่าคะแนนทั้งหมดของเกมอยู่ในไฟล์นี้ไฟล์เดียว
 *
 * ผู้วิจัยต้องปรับค่าเหล่านี้ได้หลังการทดลองนำร่องโดยไม่ต้องแตะ component
 * หรือตรรกะเกม จึงห้าม hard-code ตัวเลขคะแนนที่อื่นเด็ดขาด
 *
 * หมายเหตุสำคัญ: เพราะค่าพวกนี้เปลี่ยนได้ ชั้นบันทึกข้อมูลจึงต้อง **คำนวณ
 * ดาวใหม่** จากคะแนนตอนโหลดเซฟ ไม่ใช่ปฏิเสธเซฟที่ดาวไม่ตรงเกณฑ์ปัจจุบัน
 * ไม่งั้นวันที่ปรับเกณฑ์ ไฟล์เซฟของนักเรียนทุกคนจะกลายเป็นไฟล์เสียทันที
 */

export const SCORING = {
  startScore: 100,
  penaltyPerWrong: 5,
  maxWrongPenalty: 30,
  penaltyPerHint: 10,
  maxHintPenalty: 30,
  minPassScore: 40,
  starThresholds: { three: 90, two: 70, one: 40 },
} as const;

export type Stars = 0 | 1 | 2 | 3;

/** จำนวนดาวจากคะแนน — 3 ดาวที่ 90-100 · 2 ดาวที่ 70-89 · 1 ดาวที่ 40-69 */
export function starsForScore(score: number): Stars {
  if (score >= SCORING.starThresholds.three) return 3;
  if (score >= SCORING.starThresholds.two) return 2;
  if (score >= SCORING.starThresholds.one) return 1;
  return 0;
}
