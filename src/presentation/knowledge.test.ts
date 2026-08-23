import { describe, expect, it } from "vitest";
import {
  getKnowledgeTopic1Examples,
  getKnowledgeTopic3Example,
  getKnowledgeTopic4Examples,
  isExampleInLevelSeeds,
} from "./knowledge";

describe("knowledge presentation", () => {
  it("ตัวอย่าง Topic 1 มี AST ครบถ้วน", () => {
    const t1 = getKnowledgeTopic1Examples();
    expect(t1.naclCompound.length).toBeGreaterThan(0);
    expect(t1.naIon.length).toBeGreaterThan(0);
    expect(t1.clIon.length).toBeGreaterThan(0);
    expect(t1.cacl2Compound.length).toBeGreaterThan(0);
    expect(t1.twoClIon.length).toBeGreaterThan(0);
  });

  it("ตัวอย่าง Topic 3 ไม่อยู่ใน 50 ด่านจริงของ LEVEL_SEEDS", () => {
    const t3 = getKnowledgeTopic3Example();
    expect(
      isExampleInLevelSeeds(
        t3.reactantA.cationId,
        t3.reactantA.anionId,
        t3.reactantB.cationId,
        t3.reactantB.anionId,
      ),
    ).toBe(false);
  });

  it("ตัวอย่าง Topic 3 คำนวณสมการ 3 ชั้นถูกต้องตามกฎเคมี", () => {
    const t3 = getKnowledgeTopic3Example();
    expect(t3.precipitate.compoundId).toBe("calcium-2plus__sulfate");
    expect(t3.precipitate.phase).toBe("s");
    expect(t3.completeIonic.reactants.length).toBeGreaterThan(0);
    expect(t3.spectators.length).toBe(2);
    expect(t3.netIonic.products.length).toBeGreaterThan(0);
  });

  it("ตัวอย่าง Topic 4 มี AST ถูกต้อง", () => {
    const t4 = getKnowledgeTopic4Examples();
    expect(t4.agIon.length).toBeGreaterThan(0);
    expect(t4.clIon.length).toBeGreaterThan(0);
    expect(t4.agclCompound.length).toBeGreaterThan(0);
  });
});
