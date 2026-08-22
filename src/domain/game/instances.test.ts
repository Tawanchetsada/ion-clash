import { describe, expect, it } from "vitest";
import { LEVELS, getLevel } from "../../data/levels";
import {
  allInstanceIds,
  completeIonicCards,
  productSlotIds,
  reactantIonCards,
} from "./instances";

describe("instanceId ตาม D-21", () => {
  it.each(LEVELS)("ด่าน $id — สร้างสองครั้งได้ id ชุดเดิมเป๊ะ", (level) => {
    // หัวใจของ D-21: ปิดแท็บแล้วเปิดใหม่ต้องได้ id เดิม ไม่งั้น checkpoint
    // จะหาการ์ดไม่เจอแล้วกู้กลางด่านไม่ได้แบบไม่มี error ให้เห็น
    expect(reactantIonCards(level)).toEqual(reactantIonCards(level));
    expect(completeIonicCards(level)).toEqual(completeIonicCards(level));
    expect(productSlotIds(level)).toEqual(productSlotIds(level));
  });

  it.each(LEVELS)("ด่าน $id — id ไม่ซ้ำกันภายในด่าน", (level) => {
    const cards = completeIonicCards(level);
    const ids = [
      ...reactantIonCards(level).map((card) => card.instanceId),
      ...productSlotIds(level),
      ...cards.left.map((card) => card.instanceId),
      ...cards.right.map((card) => card.instanceId),
    ];

    expect(new Set(ids).size).toBe(ids.length);
    expect(allInstanceIds(level).size).toBe(ids.length);
  });

  it.each(LEVELS)("ด่าน $id — มีการ์ดสารตั้งต้น 4 ใบเสมอตาม D-03", (level) => {
    const cards = reactantIonCards(level);
    expect(cards).toHaveLength(4);
    expect(cards.filter((card) => card.charge > 0)).toHaveLength(2);
    expect(cards.filter((card) => card.charge < 0)).toHaveLength(2);
    expect(cards.every((card) => card.phase === "aq")).toBe(true);
  });

  it("id ของคนละด่านไม่ชนกัน", () => {
    const first = allInstanceIds(getLevel(1));
    const second = allInstanceIds(getLevel(2));
    for (const id of first) {
      expect(second.has(id)).toBe(false);
    }
  });

  it("อ่านออกด้วยตา ทำให้ดีบัก checkpoint ในเครื่องนักเรียนได้", () => {
    const cards = reactantIonCards(getLevel(1));
    expect(cards.map((card) => card.instanceId)).toEqual([
      "L1:react:a:cat",
      "L1:react:a:an",
      "L1:react:b:cat",
      "L1:react:b:an",
    ]);
    expect(productSlotIds(getLevel(1))[0]).toBe("L1:slot:0");
  });

  it("การ์ดไอออนพกตัวห้อยจากสารตั้งต้นมาด้วย", () => {
    // Pb(NO₃)₂ แตกตัวเป็น Pb²⁺ กับ 2NO₃⁻ — ขั้นแยกไอออนต้องแสดงจำนวนนี้
    const level = LEVELS.find(
      (candidate) => candidate.reactantA.anionCount === 2,
    );
    expect(level).toBeDefined();
    if (!level) return;

    const anion = reactantIonCards(level)[1];
    expect(anion?.count).toBe(2);
  });

  it.each(LEVELS)("ด่าน $id — การ์ดสมการไอออนิกตรงกับพจน์ในสมการ", (level) => {
    const cards = completeIonicCards(level);
    expect(cards.left).toHaveLength(level.completeIonic.reactants.length);
    expect(cards.right).toHaveLength(level.completeIonic.products.length);
    expect(cards.right.filter((card) => card.term.kind === "compound")).toHaveLength(
      1,
    );
  });
});
