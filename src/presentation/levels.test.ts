import { describe, expect, it } from "vitest";
import { createDefaultSave } from "../storage/defaults";
import { recordLevelResult } from "../storage/progress";
import { levelGridView } from "./levels";

describe("levelGridView", () => {
  it("เซฟเปล่า → ด่าน 01 เป็นด่านปัจจุบัน ที่เหลือล็อกหมด", () => {
    const save = createDefaultSave({ now: () => new Date("2026-01-01T00:00:00Z") });
    const groups = levelGridView(save);

    const easy = groups.find((group) => group.difficulty === "easy");
    if (!easy) throw new Error("fixture ผิด");
    const level1 = easy.levels.find((tile) => tile.levelId === 1);
    const level2 = easy.levels.find((tile) => tile.levelId === 2);
    if (!level1 || !level2) throw new Error("fixture ผิด");

    expect(level1.status).toBe("current");
    expect(level1.stars).toBe(0);
    expect(level2.status).toBe("locked");
  });

  it("50 ด่านครบ จัดกลุ่มเป็น 5 ช่วง ช่วงละ 10 ด่านเป๊ะ", () => {
    const save = createDefaultSave({ now: () => new Date("2026-01-01T00:00:00Z") });
    const groups = levelGridView(save);

    expect(groups).toHaveLength(5);
    expect(groups.map((group) => group.difficulty)).toEqual([
      "easy",
      "basic",
      "medium",
      "hard",
      "challenge",
    ]);
    for (const group of groups) {
      expect(group.levels).toHaveLength(10);
    }
    expect(groups.flatMap((group) => group.levels)).toHaveLength(50);
  });

  it("ด่านที่ผ่านแล้วเป็น completed พร้อมดาว และปลดล็อกด่านถัดไปเป็น current", () => {
    let save = createDefaultSave({ now: () => new Date("2026-01-01T00:00:00Z") });
    save = recordLevelResult(
      save,
      { levelId: 1, score: 100, timeMs: 5_000 },
      () => new Date("2026-01-01T00:05:00Z"),
    );

    const groups = levelGridView(save);
    const easy = groups.find((group) => group.difficulty === "easy");
    if (!easy) throw new Error("fixture ผิด");
    const level1 = easy.levels.find((tile) => tile.levelId === 1);
    const level2 = easy.levels.find((tile) => tile.levelId === 2);
    if (!level1 || !level2) throw new Error("fixture ผิด");

    expect(level1.status).toBe("completed");
    expect(level1.stars).toBe(3);
    expect(level2.status).toBe("current");
  });

  it("ทุกสถานะมีข้อความคู่กับตัวมันเองเสมอ ไม่ใช่แค่ enum เปล่า", () => {
    const save = createDefaultSave({ now: () => new Date("2026-01-01T00:00:00Z") });
    const groups = levelGridView(save);
    for (const tile of groups.flatMap((group) => group.levels)) {
      expect(tile.statusLabelTh.length).toBeGreaterThan(0);
    }
  });
});
