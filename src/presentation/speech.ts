import type { CompoundDef, IonDef, Phase } from "../domain/chemistry/types";

/**
 * ประกอบ aria-label ภาษาไทยจากฟิลด์มีโครงสร้างล้วน — ห้าม parse formula string
 *
 * ข้อสอบสเปกยกตัวอย่างว่า Ag⁺(aq) อ่านว่า "ไอออนเงิน ประจุบวกหนึ่ง สถานะสารละลาย"
 * แต่ที่นี่ใช้ชื่อจากทะเบียนไอออน (`ion.nameTh` เช่น "ซิลเวอร์(I) ไอออน") แทน
 * ชื่อในตัวอย่าง เพราะเป็นคำเดียวกับที่ขึ้นบนตัวการ์ดจริง ถ้าเสียงที่ได้ยิน
 * ไม่ตรงกับตัวหนังสือที่เห็น นักเรียนสองคนที่คุยกันจะอ้างชื่อคนละชื่อ และชื่อ
 * แบบ "ไอรอน(II)"/"ไอรอน(III)" ยังแยก Fe²⁺ กับ Fe³⁺ ได้ ซึ่งคำว่า "เหล็ก" เฉย ๆ แยกไม่ได้
 */

const DIGIT_WORDS_TH: Readonly<Record<number, string>> = {
  1: "หนึ่ง",
  2: "สอง",
  3: "สาม",
  4: "สี่",
  5: "ห้า",
  6: "หก",
  7: "เจ็ด",
  8: "แปด",
  9: "เก้า",
};

function digitWordTh(n: number): string {
  return DIGIT_WORDS_TH[n] ?? String(n);
}

/** เช่น "ประจุบวกหนึ่ง" "ประจุลบสอง" */
export function chargeLabelTh(charge: number): string {
  const sign = charge > 0 ? "บวก" : charge < 0 ? "ลบ" : "";
  return `ประจุ${sign}${digitWordTh(Math.abs(charge))}`;
}

/** เช่น "สถานะสารละลาย" "สถานะของแข็ง" */
export function phaseLabelTh(phase: Phase): string {
  return phase === "aq" ? "สถานะสารละลาย" : "สถานะของแข็ง";
}

/** เช่น "จำนวน 2 หน่วย" — ว่างเปล่าเมื่อมีหน่วยเดียว ไม่ต้องพูดซ้ำ */
export function countLabelTh(count: number): string {
  return count > 1 ? `จำนวน ${count} หน่วย` : "";
}

/**
 * ป้ายเสียงของไอออนหนึ่งใบ — ใช้กับทั้งการ์ดไอออนสารตั้งต้นและไอออนอิสระ
 * ในสมการไอออนิกสมบูรณ์
 */
export function ionSpeechTh(ion: IonDef, phase: Phase, count = 1): string {
  return [ion.nameTh, countLabelTh(count), chargeLabelTh(ion.charge), phaseLabelTh(phase)]
    .filter((part) => part !== "")
    .join(" ");
}

/** ป้ายเสียงของสารประกอบ (ตะกอนหรือผลิตภัณฑ์ที่ยังไม่แตกตัว) — ไม่มีประจุ เพราะรวมแล้วเป็นศูนย์เสมอ */
export function compoundSpeechTh(compound: CompoundDef, count = 1): string {
  return [compound.nameTh, countLabelTh(count), phaseLabelTh(compound.phase)]
    .filter((part) => part !== "")
    .join(" ");
}
