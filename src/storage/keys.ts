/**
 * ชื่อคีย์ทั้งหมดที่เกมใช้ใน localStorage รวมไว้ที่เดียว
 *
 * คีย์มีเลขเวอร์ชันอยู่ในตัว เพื่อให้เพิ่ม v2 ได้โดยไม่ทับข้อมูลเดิม
 * และกู้ของเก่าได้ถ้า migration พลาด
 */

export const SAVE_KEY = "ion-clash:save:v1";

/** สำเนาก่อนเขียนทับ อย่างน้อย 1 ชุดเสมอ */
export const BACKUP_KEY = "ion-clash:save:backup:v1";

/** คำนำหน้าของคีย์ที่เก็บค่าดิบที่พัง ต่อท้ายด้วย timestamp */
export const CORRUPT_KEY_PREFIX = "ion-clash:save:corrupt:";

/**
 * จองไว้ให้ event log งานวิจัยใน Phase 9 — ยังไม่มีอะไรเขียนคีย์นี้
 * ประกาศไว้ตรงนี้เพื่อให้เห็นภาพรวม namespace ทั้งหมดในที่เดียว
 */
export const RESEARCH_KEY = "ion-clash:research:v1";

export function corruptKey(timestamp: string): string {
  return `${CORRUPT_KEY_PREFIX}${timestamp}`;
}

/** เก็บไฟล์เสียไว้กี่ชุดก่อนเริ่มลบของเก่า */
export const MAX_CORRUPT_ENTRIES = 3;
