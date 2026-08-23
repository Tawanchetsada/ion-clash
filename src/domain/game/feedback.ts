import { MESSAGES } from "../../config/messages";
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

export const ERROR_MESSAGES_TH = MESSAGES.error;
export const SUCCESS_MESSAGES_TH = MESSAGES.success;

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
