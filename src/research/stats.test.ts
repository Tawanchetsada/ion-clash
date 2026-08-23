import { describe, expect, it } from "vitest";
import { emptyErrorTally } from "../domain/chemistry/types";
import {
  calculateErrorStats,
  calculateOverallE2,
  calculateParticipantE1,
  calculateParticipantE2,
  deduplicateEvents,
  summarizeResearchData,
} from "./stats";
import type { ResearchEvent } from "./types";

describe("Research Stats & Calculations (E1/E2, Errors)", () => {
  const createEvent = (
    playerName: string,
    levelId: number,
    score: number,
    errors: Partial<Record<string, number>> = {},
    attemptNo = 1,
    installId = "inst-1",
  ): ResearchEvent => ({
    playerName,
    installId,
    levelId,
    attemptNo,
    startedAt: "2026-08-23T08:00:00.000Z",
    finishedAt: "2026-08-23T08:02:00.000Z",
    elapsedMs: 60000,
    completed: true,
    score,
    stars: score >= 90 ? 3 : score >= 70 ? 2 : 1,
    hintsUsed: 0,
    wrongAttempts: 0,
    errorsByCode: {
      ...emptyErrorTally(),
      ...errors,
    },
  });

  it("1. คนเดียวเล่น 1 ด่าน: คำนวณ E1 ถูกต้อง", () => {
    const events = [createEvent("S01", 1, 90)];
    const stats = calculateParticipantE1(events);

    expect(stats.completedCount).toBe(1);
    expect(stats.totalScore).toBe(90);
    expect(stats.e1).toBe(90);
  });

  it("2. 8 คนเล่นจำนวนด่านไม่เท่ากัน: คำนวณ E1 รายคนและ E1 รวมถูกต้อง", () => {
    // ผู้เรียน 8 คน (S01 ถึง S08)
    const events: ResearchEvent[] = [
      // S01 เล่น 2 ด่าน ได้ 100, 80 -> avg 90
      createEvent("S01", 1, 100, {}, 1, "i1"),
      createEvent("S01", 2, 80, {}, 1, "i1"),
      // S02 เล่น 1 ด่าน ได้ 70 -> avg 70
      createEvent("S02", 1, 70, {}, 1, "i2"),
      // S03 เล่น 3 ด่าน ได้ 90, 90, 90 -> avg 90
      createEvent("S03", 1, 90, {}, 1, "i3"),
      createEvent("S03", 2, 90, {}, 1, "i3"),
      createEvent("S03", 3, 90, {}, 1, "i3"),
      // S04 ได้ 85
      createEvent("S04", 1, 85, {}, 1, "i4"),
      // S05 ได้ 80
      createEvent("S05", 1, 80, {}, 1, "i5"),
      // S06 ได้ 95
      createEvent("S06", 1, 95, {}, 1, "i6"),
      // S07 ได้ 75
      createEvent("S07", 1, 75, {}, 1, "i7"),
      // S08 ได้ 90
      createEvent("S08", 1, 90, {}, 1, "i8"),
    ];

    // E1 รายคน: 90, 70, 90, 85, 80, 95, 75, 90
    // Sum = 675 / 8 = 84.375 -> round 84.38
    const summary = summarizeResearchData(events);

    expect(summary.participants).toHaveLength(8);
    const s01 = summary.participants.find((p) => p.playerName === "S01");
    expect(s01?.e1).toBe(90);
    expect(s01?.completedLevelsCount).toBe(2);

    expect(summary.overallE1).toBe(84.38);
    expect(summary.e1Passed).toBe(true); // >= 80
  });

  it("3. กรณีไม่มีข้อมูล (Empty events): ไม่หารด้วยศูนย์และไม่ throw", () => {
    const summary = summarizeResearchData([]);

    expect(summary.participants).toHaveLength(0);
    expect(summary.overallE1).toBe(0);
    expect(summary.overallE2).toBeNull();
    expect(summary.e1Passed).toBe(false);
    expect(summary.errorAnalysis.totalErrors).toBe(0);
    expect(summary.errorAnalysis.mostFrequent).toEqual([]);
  });

  it("4. คำนวณ E2 และเกณฑ์ 80/80 รวม", () => {
    const e2_1 = calculateParticipantE2(24, 30); // 80.0
    const e2_2 = calculateParticipantE2(27, 30); // 90.0
    expect(e2_1).toBe(80);
    expect(e2_2).toBe(90);

    const overallE2 = calculateOverallE2([e2_1, e2_2]);
    expect(overallE2).toBe(85);

    const events = [
      createEvent("S01", 1, 85),
      createEvent("S02", 1, 85),
    ];
    const e2Map = {
      S01: { score: 24, maxScore: 30 },
      S02: { score: 27, maxScore: 30 },
    };

    const summary = summarizeResearchData(events, e2Map);
    expect(summary.overallE1).toBe(85);
    expect(summary.overallE2).toBe(85);
    expect(summary.e1Passed).toBe(true);
    expect(summary.e2Passed).toBe(true);
    expect(summary.benchmarkPassed).toBe(true);
  });

  it("5. วิเคราะห์สถิติข้อผิดพลาด 6 รหัส และหารหัสที่พบบ่อยสุด", () => {
    const events: ResearchEvent[] = [
      createEvent("S01", 1, 70, { "E-CHARGE": 3, "E-PAIR": 1 }),
      createEvent("S02", 1, 60, { "E-CHARGE": 2, "E-PHASE": 4 }),
    ];

    // Total E-CHARGE = 5, E-PAIR = 1, E-PHASE = 4. Total = 10
    const errorStats = calculateErrorStats(events);
    expect(errorStats.totalErrors).toBe(10);
    expect(errorStats.tally["E-CHARGE"]).toBe(5);
    expect(errorStats.percentages["E-CHARGE"]).toBe(50);
    expect(errorStats.tally["E-PHASE"]).toBe(4);
    expect(errorStats.percentages["E-PHASE"]).toBe(40);
    expect(errorStats.tally["E-PAIR"]).toBe(1);
    expect(errorStats.percentages["E-PAIR"]).toBe(10);
    expect(errorStats.mostFrequent).toEqual(["E-CHARGE"]);
  });

  it("6. ตัดแถวซ้ำด้วย installId + levelId + attemptNo", () => {
    const ev1 = createEvent("S01", 1, 70, {}, 1, "inst-1");
    const ev1Duplicate = createEvent("S01", 1, 100, {}, 1, "inst-1"); // score updated
    const ev2 = createEvent("S01", 2, 90, {}, 1, "inst-1");

    const deduped = deduplicateEvents([ev1, ev1Duplicate, ev2]);
    expect(deduped).toHaveLength(2);
    expect(deduped.find((e) => e.levelId === 1)?.score).toBe(100);
  });
});
