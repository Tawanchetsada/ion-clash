import { describe, expect, it } from "vitest";
import { getTutorialLevel, verifyTutorialLevelNotInSeeds } from "./tutorial";

describe("tutorial presentation", () => {
  it("ด่านตัวอย่างสร้างสำเร็จและไม่อยู่ใน 50 ด่านจริงของ LEVEL_SEEDS", () => {
    expect(verifyTutorialLevelNotInSeeds()).toBe(true);
  });

  it("ด่านตัวอย่างมีข้อมูลเคมีครบถ้วน", () => {
    const level = getTutorialLevel();
    expect(level.reactantA.nameTh).toBe("แคลเซียมคลอไรด์");
    expect(level.reactantB.nameTh).toBe("โซเดียมซัลเฟต");
    expect(level.precipitate.nameTh).toBe("แคลเซียมซัลเฟต");
    expect(level.precipitate.phase).toBe("s");
    expect(level.spectators.length).toBe(2);
  });
});
