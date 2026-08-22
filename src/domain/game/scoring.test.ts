import { describe, expect, it } from "vitest";
import { SCORING, starsForScore } from "../../config/scoring";
import { computeScore } from "./scoring";

describe("คะแนนของด่าน", () => {
  it("ไม่ผิดไม่ใช้คำใบ้ ได้เต็ม 100", () => {
    expect(computeScore({ wrongAttempts: 0, hintsUsed: 0 })).toBe(100);
  });

  it("ผิด 3 ครั้งใช้คำใบ้ 2 ครั้ง ได้ 65 คะแนน 1 ดาว", () => {
    // ตัวเลขนี้อยู่ใน Definition of Done ของเฟสตรง ๆ: 100 - 15 - 20
    const score = computeScore({ wrongAttempts: 3, hintsUsed: 2 });
    expect(score).toBe(65);
    expect(starsForScore(score)).toBe(1);
  });

  it("ผิดเกินเพดานหักได้แค่ 30", () => {
    expect(computeScore({ wrongAttempts: 6, hintsUsed: 0 })).toBe(70);
    expect(computeScore({ wrongAttempts: 20, hintsUsed: 0 })).toBe(70);
  });

  it("คำใบ้เกินเพดานหักได้แค่ 30", () => {
    expect(computeScore({ wrongAttempts: 0, hintsUsed: 3 })).toBe(70);
    expect(computeScore({ wrongAttempts: 0, hintsUsed: 9 })).toBe(70);
  });

  it("ผิดและใช้คำใบ้เต็มเพดาน ยังได้ 40 ไม่ติดลบ", () => {
    expect(computeScore({ wrongAttempts: 99, hintsUsed: 99 })).toBe(
      SCORING.minPassScore,
    );
  });

  it("ค่าติดลบที่หลุดเข้ามาไม่ทำให้ได้เกิน 100", () => {
    expect(computeScore({ wrongAttempts: -5, hintsUsed: -5 })).toBe(100);
  });

  it("เส้นแบ่งดาวอยู่ที่ 90 และ 70 พอดี", () => {
    expect(starsForScore(90)).toBe(3);
    expect(starsForScore(89)).toBe(2);
    expect(starsForScore(70)).toBe(2);
    expect(starsForScore(69)).toBe(1);
  });

  it("อ่านค่าจาก config เท่านั้น ไม่ hard-code", () => {
    // ถ้าผู้วิจัยปรับค่าหลังทดลองนำร่อง ผลลัพธ์ต้องขยับตาม
    const expected =
      SCORING.startScore - SCORING.penaltyPerWrong - SCORING.penaltyPerHint;
    expect(computeScore({ wrongAttempts: 1, hintsUsed: 1 })).toBe(expected);
  });
});
