import { describe, expect, it } from "vitest";
import { createDefaultSave } from "./defaults";
import { mergeSaves } from "./merge";
import { gameSaveV1Schema } from "./schema";
import type { GameSaveV1, LevelProgress } from "./schema";

function progress(overrides: Partial<LevelProgress> = {}): LevelProgress {
  return {
    completed: true,
    bestScore: 80,
    stars: 2,
    bestTimeMs: 60_000,
    attempts: 1,
    completedAt: "2026-08-22T09:00:00.000Z",
    ...overrides,
  };
}

function saveWith(overrides: Partial<GameSaveV1>): GameSaveV1 {
  return {
    ...createDefaultSave({
      now: () => new Date("2026-08-22T09:00:00.000Z"),
      uuid: () => "local-id",
    }),
    ...overrides,
  };
}

describe("การรวมเซฟสองชุด", () => {
  it("ความก้าวหน้าไม่ถอยหลังไม่ว่าฝั่งไหนจะใหม่กว่า", () => {
    const local = saveWith({
      unlockedLevel: 20,
      updatedAt: "2026-08-01T00:00:00.000Z",
      completedLevels: { "5": progress({ bestScore: 95, stars: 3 }) },
    });
    const incoming = saveWith({
      unlockedLevel: 3,
      updatedAt: "2026-08-30T00:00:00.000Z",
      completedLevels: { "5": progress({ bestScore: 60, stars: 1 }) },
    });

    const merged = mergeSaves(local, incoming);

    expect(merged.unlockedLevel).toBe(20);
    expect(merged.completedLevels["5"]?.bestScore).toBe(95);
    expect(merged.completedLevels["5"]?.stars).toBe(3);
  });

  it("เวลาที่ดีที่สุดใช้ค่าน้อยกว่าที่ไม่เป็น null", () => {
    const merged = mergeSaves(
      saveWith({ completedLevels: { "1": progress({ bestTimeMs: null }) } }),
      saveWith({ completedLevels: { "1": progress({ bestTimeMs: 30_000 }) } }),
    );
    expect(merged.completedLevels["1"]?.bestTimeMs).toBe(30_000);

    const both = mergeSaves(
      saveWith({ completedLevels: { "1": progress({ bestTimeMs: 90_000 }) } }),
      saveWith({ completedLevels: { "1": progress({ bestTimeMs: 45_000 }) } }),
    );
    expect(both.completedLevels["1"]?.bestTimeMs).toBe(45_000);
  });

  it("รวมด่านที่มีอยู่ฝั่งเดียวเข้ามาครบ", () => {
    const merged = mergeSaves(
      saveWith({ completedLevels: { "1": progress() } }),
      saveWith({ completedLevels: { "2": progress() } }),
    );
    expect(Object.keys(merged.completedLevels).sort()).toEqual(["1", "2"]);
  });

  it("ผ่านด่านฝั่งใดฝั่งหนึ่งถือว่าผ่าน", () => {
    const merged = mergeSaves(
      saveWith({ completedLevels: { "1": progress({ completed: false }) } }),
      saveWith({ completedLevels: { "1": progress({ completed: true }) } }),
    );
    expect(merged.completedLevels["1"]?.completed).toBe(true);
  });

  it("unlockedLevel ต้องตามด่านที่ผ่านแล้วเสมอ", () => {
    const merged = mergeSaves(
      saveWith({ unlockedLevel: 1 }),
      saveWith({ unlockedLevel: 1, completedLevels: { "9": progress() } }),
    );
    expect(merged.unlockedLevel).toBe(10);
  });

  it("ตัวตนของเครื่องไม่เปลี่ยนเพราะนำเข้าไฟล์ของคนอื่น", () => {
    const merged = mergeSaves(
      saveWith({ installId: "เครื่องนี้" }),
      saveWith({ installId: "เครื่องอื่น" }),
    );
    expect(merged.installId).toBe("เครื่องนี้");
  });

  it("ชื่อผู้เล่นจากฝั่งที่ใหม่กว่าชนะ แต่ไม่ทับด้วยค่าว่าง", () => {
    const withName = mergeSaves(
      saveWith({ playerName: "เก่า", updatedAt: "2026-08-01T00:00:00.000Z" }),
      saveWith({ playerName: "ใหม่", updatedAt: "2026-08-30T00:00:00.000Z" }),
    );
    expect(withName.playerName).toBe("ใหม่");

    const blankIncoming = mergeSaves(
      saveWith({ playerName: "เก่า", updatedAt: "2026-08-01T00:00:00.000Z" }),
      saveWith({ playerName: "", updatedAt: "2026-08-30T00:00:00.000Z" }),
    );
    expect(blankIncoming.playerName).toBe("เก่า");
  });

  it("เวลาสร้างใช้ค่าเก่ากว่า เวลาแก้ไขใช้ค่าใหม่กว่า", () => {
    const merged = mergeSaves(
      saveWith({
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
      }),
      saveWith({
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-08-30T00:00:00.000Z",
      }),
    );
    expect(merged.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(merged.updatedAt).toBe("2026-08-30T00:00:00.000Z");
  });

  it("ผลลัพธ์ยังผ่าน schema เข้มงวด", () => {
    const merged = mergeSaves(
      saveWith({ completedLevels: { "1": progress() } }),
      saveWith({ completedLevels: { "2": progress() } }),
    );
    expect(gameSaveV1Schema.safeParse(merged).success).toBe(true);
  });
});
