import { describe, expect, it } from "vitest";
import { SCORING, starsForScore } from "./scoring";

describe("เกณฑ์คะแนนและดาว", () => {
  it.each([
    [100, 3],
    [90, 3],
    [89, 2],
    [70, 2],
    [69, 1],
    [40, 1],
    [39, 0],
    [0, 0],
  ])("คะแนน %i ได้ %i ดาว", (score, stars) => {
    expect(starsForScore(score)).toBe(stars);
  });

  it("ขอบเขตดาวเรียงจากมากไปน้อยและไม่ทับกัน", () => {
    const { three, two, one } = SCORING.starThresholds;
    expect(three).toBeGreaterThan(two);
    expect(two).toBeGreaterThan(one);
  });

  it("คะแนนผ่านขั้นต่ำได้อย่างน้อย 1 ดาว", () => {
    expect(starsForScore(SCORING.minPassScore)).toBeGreaterThanOrEqual(1);
  });

  it("เพดานการหักคะแนนทำให้คะแนนต่ำสุดไม่ต่ำกว่าเกณฑ์ผ่าน", () => {
    const worst =
      SCORING.startScore - SCORING.maxWrongPenalty - SCORING.maxHintPenalty;
    expect(worst).toBeGreaterThanOrEqual(SCORING.minPassScore);
  });
});
