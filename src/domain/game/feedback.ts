import { ERROR_CODES } from "../chemistry/types";
import type { ErrorCode } from "../chemistry/types";
import type { Feedback } from "./types";

/**
 * ข้อความ feedback ภาษาไทย
 *
 * **ข้อห้ามที่สำคัญที่สุดของไฟล์นี้:** ทุกข้อความบอก "หลักการที่ถูกละเมิด"
 * เท่านั้น ห้ามบอกคำตอบ ห้ามเอ่ยชื่อหรือสูตรของผลิตภัณฑ์ ห้ามชี้ว่าไอออนคู่ไหนถูก
 * ข้อความจึงต้องเป็นสตริงคงที่ ไม่ประกอบจากข้อมูลด่าน — ถ้าวันไหนอยากทำให้
 * "ช่วยเหลือมากขึ้น" โดยแทรกสูตรลงไป เทสต์ใน feedback.test.ts จะจับได้ทันที
 */

export const ERROR_MESSAGES_TH: Readonly<Record<ErrorCode, string>> = {
  "E-CHARGE": "ประจุรวมของสารประกอบยังไม่เป็นศูนย์ ลองปรับจำนวนไอออน",
  "E-PAIR": "ไอออนคู่นี้ไม่ใช่ผลิตภัณฑ์ของปฏิกิริยานี้",
  "E-PHASE": "ตรวจสอบกฎการละลายของผลิตภัณฑ์อีกครั้ง",
  "E-BALANCE": "จำนวนอะตอมบางธาตุยังไม่เท่ากันทั้งสองข้าง",
  "E-RATIO": "สมการสมดุลแล้ว แต่ยังลดสัมประสิทธิ์ได้",
  "E-SPECTATOR": "ตัดได้เฉพาะไอออนที่เหมือนกันและไม่เปลี่ยนแปลงทั้งสองข้าง",
};

export const SUCCESS_MESSAGES_TH = {
  arrangement: "จับคู่ถูกต้อง",
  balance: "สมการสมดุลแล้ว",
  products: "ผลิตภัณฑ์ผ่านการตรวจครบทุกข้อ",
  cancelPair: "ตัดไอออนผู้ชมคู่นี้ถูกต้อง",
  cancelComplete: "ตัดไอออนผู้ชมครบแล้ว",
  levelComplete: "ถูกต้อง! สมการไอออนิกสุทธิสมบูรณ์",
} as const;

export type SuccessKey = keyof typeof SUCCESS_MESSAGES_TH;

export function errorFeedback(code: ErrorCode): Feedback {
  return { kind: "error", code, messageTh: ERROR_MESSAGES_TH[code] };
}

export function successFeedback(key: SuccessKey): Feedback {
  return { kind: "success", code: null, messageTh: SUCCESS_MESSAGES_TH[key] };
}

/** ทุกข้อความที่ผู้เล่นอาจเห็น ใช้ในเทสต์ที่ตรวจว่าไม่มีข้อความไหนเฉลย */
export const ALL_FEEDBACK_MESSAGES: readonly string[] = [
  ...ERROR_CODES.map((code) => ERROR_MESSAGES_TH[code]),
  ...Object.values(SUCCESS_MESSAGES_TH),
];
