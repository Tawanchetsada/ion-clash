import { describe, expect, it } from "vitest";
import { emptyErrorTally } from "../domain/chemistry/types";
import { createDefaultSave } from "./defaults";
import {
  clearCheckpoint,
  isLevelUnlocked,
  recordLevelResult,
  saveCheckpoint,
} from "./progress";
import { MAX_LEVEL_ID, gameSaveV1Schema } from "./schema";
import type { LevelCheckpoint } from "./schema";

const clock = (iso: string) => (): Date => new Date(iso);
const base = createDefaultSave({
  now: clock("2026-08-22T09:00:00.000Z"),
  uuid: () => "test-id",
});

function checkpoint(levelId: number): LevelCheckpoint {
  return {
    levelId,
    state: "balanceEquation",
    slotAssignments: [],
    coefficients: [1, null, null, null],
    canceledPairs: [],
    hintsUsed: 0,
    wrongAttempts: 0,
    errorsByCode: emptyErrorTally(),
    elapsedMs: 1000,
    savedAt: "2026-08-22T09:00:00.000Z",
  };
}

describe("การบันทึกผลเมื่อจบด่าน", () => {
  it("ผ่านด่าน 1 แล้วปลดล็อกด่าน 2", () => {
    const next = recordLevelResult(
      base,
      { levelId: 1, score: 100, timeMs: 30_000 },
      clock("2026-08-22T10:00:00.000Z"),
    );

    expect(next.unlockedLevel).toBe(2);
    expect(next.lastPlayedLevel).toBe(1);
    expect(next.completedLevels["1"]).toMatchObject({
      completed: true,
      bestScore: 100,
      stars: 3,
      attempts: 1,
    });
  });

  it("ผ่านด่านสุดท้ายแล้ว unlockedLevel ไม่เกิน 50", () => {
    const next = recordLevelResult(
      { ...base, unlockedLevel: MAX_LEVEL_ID },
      { levelId: MAX_LEVEL_ID, score: 80, timeMs: 1000 },
      clock("2026-08-22T10:00:00.000Z"),
    );
    expect(next.unlockedLevel).toBe(MAX_LEVEL_ID);
  });

  it("เล่นซ้ำแล้วได้คะแนนแย่ลง ยังเก็บผลที่ดีที่สุดไว้ แต่นับจำนวนครั้งเพิ่ม", () => {
    const first = recordLevelResult(
      base,
      { levelId: 1, score: 95, timeMs: 30_000 },
      clock("2026-08-22T10:00:00.000Z"),
    );
    const second = recordLevelResult(
      first,
      { levelId: 1, score: 45, timeMs: 90_000 },
      clock("2026-08-22T11:00:00.000Z"),
    );

    expect(second.completedLevels["1"]).toMatchObject({
      bestScore: 95,
      stars: 3,
      bestTimeMs: 30_000,
      attempts: 2,
      // เวลาที่ผ่านครั้งแรก ไม่ใช่ครั้งล่าสุด
      completedAt: "2026-08-22T10:00:00.000Z",
    });
  });

  it("เล่นซ้ำแล้วเร็วขึ้น เก็บเวลาที่ดีกว่า", () => {
    const first = recordLevelResult(
      base,
      { levelId: 3, score: 70, timeMs: 90_000 },
      clock("2026-08-22T10:00:00.000Z"),
    );
    const second = recordLevelResult(
      first,
      { levelId: 3, score: 70, timeMs: 40_000 },
      clock("2026-08-22T11:00:00.000Z"),
    );
    expect(second.completedLevels["3"]?.bestTimeMs).toBe(40_000);
  });

  it("ปลดล็อกแล้วไม่ถอยหลังเมื่อกลับไปเล่นด่านเก่า", () => {
    const far = { ...base, unlockedLevel: 30 };
    const next = recordLevelResult(
      far,
      { levelId: 2, score: 100, timeMs: 1000 },
      clock("2026-08-22T10:00:00.000Z"),
    );
    expect(next.unlockedLevel).toBe(30);
  });

  it("ล้าง checkpoint ของด่านที่เพิ่งจบ แต่ไม่แตะของด่านอื่น", () => {
    const withOwn = { ...base, activeCheckpoint: checkpoint(1) };
    expect(
      recordLevelResult(
        withOwn,
        { levelId: 1, score: 80, timeMs: 1000 },
        clock("2026-08-22T10:00:00.000Z"),
      ).activeCheckpoint,
    ).toBeNull();

    const withOther = { ...base, unlockedLevel: 5, activeCheckpoint: checkpoint(4) };
    expect(
      recordLevelResult(
        withOther,
        { levelId: 1, score: 80, timeMs: 1000 },
        clock("2026-08-22T10:00:00.000Z"),
      ).activeCheckpoint,
    ).not.toBeNull();
  });

  it("คะแนนนอกช่วงถูกดึงกลับเข้า 0-100", () => {
    const next = recordLevelResult(
      base,
      { levelId: 1, score: 250, timeMs: -5 },
      clock("2026-08-22T10:00:00.000Z"),
    );
    expect(next.completedLevels["1"]?.bestScore).toBe(100);
    expect(next.completedLevels["1"]?.bestTimeMs).toBe(0);
  });

  it("เลขด่านนอกช่วงถือเป็นบั๊กของโปรแกรม จึงโยน error", () => {
    for (const levelId of [0, 51, 1.5]) {
      expect(() =>
        recordLevelResult(base, { levelId, score: 80, timeMs: 1 }),
      ).toThrow();
    }
  });

  it("ผลลัพธ์ผ่าน schema เข้มงวด", () => {
    const next = recordLevelResult(
      base,
      { levelId: 7, score: 65, timeMs: 12_345 },
      clock("2026-08-22T10:00:00.000Z"),
    );
    expect(gameSaveV1Schema.safeParse(next).success).toBe(true);
  });
});

describe("checkpoint กลางด่าน", () => {
  it("บันทึกแล้วอ่านกลับได้ และไม่แตะความก้าวหน้าเดิม", () => {
    const next = saveCheckpoint(
      base,
      checkpoint(1),
      clock("2026-08-22T10:00:00.000Z"),
    );
    expect(next.activeCheckpoint?.levelId).toBe(1);
    expect(next.lastPlayedLevel).toBe(1);
    expect(next.completedLevels).toEqual({});
  });

  it("ล้าง checkpoint แล้วคืนวัตถุเดิมถ้าไม่มีอะไรให้ล้าง", () => {
    expect(clearCheckpoint(base)).toBe(base);
    expect(clearCheckpoint(saveCheckpoint(base, checkpoint(1))).activeCheckpoint).toBeNull();
  });
});

describe("การตรวจสิทธิ์เข้าด่าน", () => {
  it("เข้าได้เฉพาะด่านที่ปลดล็อกแล้ว", () => {
    const save = { ...base, unlockedLevel: 5 };
    expect(isLevelUnlocked(save, 1)).toBe(true);
    expect(isLevelUnlocked(save, 5)).toBe(true);
    expect(isLevelUnlocked(save, 6)).toBe(false);
    expect(isLevelUnlocked(save, 0)).toBe(false);
  });

  it("ชื่อผู้เล่น admin111213 สามารถเข้าเล่นได้ทุกด่าน (1-50)", () => {
    const save = { ...base, playerName: "admin111213", unlockedLevel: 1 };
    expect(isLevelUnlocked(save, 1)).toBe(true);
    expect(isLevelUnlocked(save, 25)).toBe(true);
    expect(isLevelUnlocked(save, 50)).toBe(true);
    expect(isLevelUnlocked(save, 51)).toBe(false);
  });
});
