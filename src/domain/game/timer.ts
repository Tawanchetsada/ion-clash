/**
 * การจับเวลาแบบสะสม
 *
 * เก็บเป็น "เวลาที่สะสมมาแล้ว" บวก "เวลาเริ่มของรอบปัจจุบัน" ไม่ใช่เก็บ
 * timestamp ที่เริ่มด่านแล้วลบตอนจบ เพราะถ้าเก็บแบบหลัง นักเรียนที่ปิดแท็บ
 * ตอนพักเที่ยงแล้วกลับมาเล่นต่อจะได้เวลาเป็นชั่วโมง ทั้งที่เล่นจริงไม่กี่นาที
 *
 * ทุกฟังก์ชันรับเวลาเข้ามาทางพารามิเตอร์ ไม่เรียก Date.now() เอง
 */

export type TimerFields = {
  startedAt: number | null;
  elapsedMs: number;
};

export function startTimer(at: number): TimerFields {
  return { startedAt: at, elapsedMs: 0 };
}

/**
 * เวลารวมจนถึงตอนนี้ รวมรอบที่กำลังเดินอยู่ด้วย
 *
 * กัน `at` ที่ย้อนหลังกว่า `startedAt` ไว้ด้วย — เกิดได้จริงเมื่อเครื่องปรับ
 * เวลาอัตโนมัติหรือข้ามเขตเวลากลางคัน ถ้าไม่กัน เวลาที่ได้จะติดลบแล้วไหลไป
 * เป็น bestTimeMs ที่เป็นลบในไฟล์เซฟ
 */
export function readElapsed(timer: TimerFields, at: number): number {
  if (timer.startedAt === null) return timer.elapsedMs;
  return timer.elapsedMs + Math.max(0, at - timer.startedAt);
}

/** หยุดนาฬิกาแล้วพับเวลาของรอบปัจจุบันเข้าไปในยอดสะสม */
export function pauseTimer(timer: TimerFields, at: number): TimerFields {
  if (timer.startedAt === null) return timer;
  return { startedAt: null, elapsedMs: readElapsed(timer, at) };
}

/** เดินนาฬิกาต่อโดยไม่แตะยอดสะสม — เรียกซ้ำตอนเดินอยู่แล้วต้องไม่รีเซ็ต */
export function resumeTimer(timer: TimerFields, at: number): TimerFields {
  if (timer.startedAt !== null) return timer;
  return { startedAt: at, elapsedMs: timer.elapsedMs };
}
