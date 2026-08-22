import { describe, expect, it } from "vitest";
import { pauseTimer, readElapsed, resumeTimer, startTimer } from "./timer";

describe("การจับเวลาแบบสะสม", () => {
  it("เริ่มนับที่ศูนย์แล้วเดินไปตามเวลาจริง", () => {
    const timer = startTimer(1_000);
    expect(readElapsed(timer, 1_000)).toBe(0);
    expect(readElapsed(timer, 6_000)).toBe(5_000);
  });

  it("หยุดแล้วเดินต่อ เวลาสะสมไม่นับช่วงที่หยุด", () => {
    // นักเรียนสลับแท็บไปทำอย่างอื่น 10 นาที ต้องไม่ถูกนับเป็นเวลาเล่น
    let timer = startTimer(0);
    timer = pauseTimer(timer, 30_000);
    expect(timer.elapsedMs).toBe(30_000);
    expect(timer.startedAt).toBeNull();

    timer = resumeTimer(timer, 630_000);
    expect(readElapsed(timer, 640_000)).toBe(40_000);
  });

  it("หยุดซ้ำตอนหยุดอยู่แล้ว ไม่ทำให้เวลาเพิ่ม", () => {
    const paused = pauseTimer(startTimer(0), 5_000);
    expect(pauseTimer(paused, 99_000)).toBe(paused);
  });

  it("เดินต่อซ้ำตอนเดินอยู่แล้ว ไม่รีเซ็ตจุดเริ่ม", () => {
    const running = startTimer(1_000);
    expect(resumeTimer(running, 50_000)).toBe(running);
    expect(readElapsed(running, 6_000)).toBe(5_000);
  });

  it("นาฬิกาเดินถอยหลังไม่ทำให้เวลาติดลบ", () => {
    // เกิดจริงเมื่อเครื่องปรับเวลาอัตโนมัติกลางด่าน ถ้าไม่กัน bestTimeMs
    // ในไฟล์เซฟจะกลายเป็นค่าติดลบแล้วเป็นเวลาที่ดีที่สุดตลอดกาล
    const timer = startTimer(10_000);
    expect(readElapsed(timer, 4_000)).toBe(0);
    expect(pauseTimer(timer, 4_000).elapsedMs).toBe(0);
  });

  it("อ่านเวลาตอนหยุดอยู่ ได้ยอดสะสมตรง ๆ", () => {
    const paused = { startedAt: null, elapsedMs: 12_345 };
    expect(readElapsed(paused, 999_999)).toBe(12_345);
  });
});
