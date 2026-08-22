import { describe, expect, it } from "vitest";
import { LEVELS, getLevel } from "../../data/levels";
import { correctSlotOrder, precipitateCardId } from "./__fixtures__/autoplay";
import { createInitialState } from "./gameMachine";
import {
  checkArrangement,
  checkCancelPair,
  correctSpectatorPairs,
  isCancellationComplete,
  needsBalancing,
  playerProducts,
} from "./guards";
import { completeIonicCards, productSlotIds, reactantIonCards } from "./instances";
import type { GameState } from "./types";

/** ด่านที่ทุกสัมประสิทธิ์เป็น 1 — ตรวจจากข้อมูลจริง ไม่ใช่จากเลขด่าน */
const LEVELS_WITHOUT_BALANCING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 18, 19, 38];

function arranged(levelId: number, ionOrder: readonly string[]): GameState {
  const level = getLevel(levelId);
  const slotIds = productSlotIds(level);
  return {
    ...createInitialState(level),
    phase: "arrangeProductIons",
    slots: slotIds.map((slotId, index) => ({
      slotId,
      ionInstanceId: ionOrder[index] ?? null,
    })),
  };
}

describe("เงื่อนไขข้ามขั้นดุล", () => {
  it("อ่านจากสัมประสิทธิ์จริง ไม่ใช่จากช่วงเลขด่าน", () => {
    // เอกสารแผนเขียนว่า "ด่าน 01-10" แต่ข้อมูลจริงมี 13 ด่าน
    // ด่าน 18, 19 และ 38 ก็เป็น 1:1:1:1 เหมือนกัน
    const skipped = LEVELS.filter((level) => !needsBalancing(level)).map(
      (level) => level.id,
    );
    expect(skipped).toEqual(LEVELS_WITHOUT_BALANCING);
  });

  it.each(LEVELS)("ด่าน $id — ตรงกับสัมประสิทธิ์ในข้อมูลด่าน", (level) => {
    const { a, b, c, d } = level.coefficients;
    const allOnes = a === 1 && b === 1 && c === 1 && d === 1;
    expect(needsBalancing(level)).toBe(!allOnes);
  });
});

describe("ตรวจการจับคู่ผลิตภัณฑ์", () => {
  it.each(LEVELS)("ด่าน $id — คำตอบที่ถูกผ่าน", (level) => {
    const state = arranged(level.id, correctSlotOrder(level));
    expect(checkArrangement(state, level)).toEqual({ ok: true });
  });

  it.each(LEVELS)("ด่าน $id — สลับคู่ที่ 1 กับคู่ที่ 2 ก็ถูก ตาม D-03", (level) => {
    const [first, second, third, fourth] = correctSlotOrder(level);
    const swapped = [third, fourth, first, second].filter(
      (id): id is string => id !== undefined,
    );
    const state = arranged(level.id, swapped);
    expect(checkArrangement(state, level)).toEqual({ ok: true });
  });

  it("วางไม่ครบ 4 ช่องไม่ผ่าน และไม่ throw", () => {
    const level = getLevel(1);
    const partial = correctSlotOrder(level).slice(0, 2);
    expect(checkArrangement(arranged(1, partial), level)).toEqual({
      ok: false,
      code: "E-PAIR",
    });
  });

  it("สลับ cation กับ anion ในคู่เดียวกันไม่ผ่าน", () => {
    const level = getLevel(1);
    const [first, second, third, fourth] = correctSlotOrder(level);
    const state = arranged(1, [second, first, third, fourth] as string[]);
    expect(checkArrangement(state, level)).toEqual({
      ok: false,
      code: "E-PAIR",
    });
  });

  it("จับคู่ไอออนจากสารตั้งต้นเดียวกันไม่ผ่าน — ไม่ได้แลกคู่", () => {
    const level = getLevel(1);
    const cards = reactantIonCards(level);
    const ids = cards.map((card) => card.instanceId) as string[];
    // คู่ที่ 1 เป็นไอออนของสารตั้งต้น A ทั้งคู่
    const state = arranged(1, [ids[0], ids[1], ids[2], ids[3]] as string[]);
    expect(checkArrangement(state, level).ok).toBe(false);
  });

  it("ประกอบผลิตภัณฑ์ตามลำดับที่ผู้เล่นวาง ไม่ใช่ลำดับของข้อมูลด่าน", () => {
    const level = getLevel(13);
    const [first, second, third, fourth] = correctSlotOrder(level);
    const swapped = arranged(13, [third, fourth, first, second] as string[]);
    const products = playerProducts(swapped, level);

    expect(products?.[0].compoundId).toBe(level.productB.compoundId);
    expect(products?.[1].compoundId).toBe(level.productA.compoundId);
  });
});

describe("ตรวจการตัดไอออนผู้ชม", () => {
  it.each(LEVELS)("ด่าน $id — คู่ที่ถูกผ่านทุกคู่", (level) => {
    for (const pair of correctSpectatorPairs(level)) {
      expect(
        checkCancelPair(level, pair.leftInstanceId, pair.rightInstanceId),
      ).toEqual({ ok: true });
    }
  });

  it.each(LEVELS)("ด่าน $id — จำนวนคู่เท่ากับจำนวนไอออนผู้ชม", (level) => {
    expect(correctSpectatorPairs(level)).toHaveLength(level.spectators.length);
  });

  it("ตัดตะกอนไม่ได้ เพราะไม่ได้แตกตัวเป็นไอออนอิสระ", () => {
    const level = getLevel(1);
    const left = completeIonicCards(level).left[0];
    expect(
      checkCancelPair(level, left?.instanceId ?? "", precipitateCardId(level)),
    ).toEqual({ ok: false, code: "E-SPECTATOR" });
  });

  it("จับคู่ไอออนคนละชนิดไม่ได้", () => {
    const level = getLevel(1);
    const cards = completeIonicCards(level);
    const left = cards.left[0];
    const wrongRight = cards.right.find(
      (card) =>
        card.term.kind === "ion" &&
        left?.term.kind === "ion" &&
        card.term.ionId !== left.term.ionId,
    );

    expect(
      checkCancelPair(level, left?.instanceId ?? "", wrongRight?.instanceId ?? ""),
    ).toEqual({ ok: false, code: "E-SPECTATOR" });
  });

  it("สลับข้างซ้ายขวาไม่ได้", () => {
    const level = getLevel(1);
    const [pair] = correctSpectatorPairs(level);
    expect(
      checkCancelPair(level, pair?.rightInstanceId ?? "", pair?.leftInstanceId ?? ""),
    ).toEqual({ ok: false, code: "E-SPECTATOR" });
  });

  it("id ที่ไม่มีอยู่จริงไม่ผ่านและไม่ throw", () => {
    expect(checkCancelPair(getLevel(1), "ไม่มีจริง", "ก็ไม่มี")).toEqual({
      ok: false,
      code: "E-SPECTATOR",
    });
  });

  it("ตัดครบถึงจะถือว่าเสร็จ", () => {
    const level = getLevel(1);
    const pairs = correctSpectatorPairs(level);
    const base = createInitialState(level);

    expect(isCancellationComplete(base, level)).toBe(false);
    expect(
      isCancellationComplete({ ...base, canceledPairs: pairs.slice(0, 1) }, level),
    ).toBe(false);
    expect(
      isCancellationComplete({ ...base, canceledPairs: [...pairs] }, level),
    ).toBe(true);
  });
});
