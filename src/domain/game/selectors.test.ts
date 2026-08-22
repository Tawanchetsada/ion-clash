import { describe, expect, it } from "vitest";
import { getLevel } from "../../data/levels";
import { playLevel } from "./__fixtures__/autoplay";
import { createInitialState } from "./gameMachine";
import {
  canCheckArrangement,
  canConfirmCancellation,
  isPrecipitateRevealed,
  levelResultOf,
  progressStep,
  scoreOf,
  starsOf,
} from "./selectors";
import { GAME_PHASES } from "./types";
import type { GamePhase } from "./types";

const level = getLevel(1);

describe("แถบความก้าวหน้า 5 ขั้น", () => {
  it("9 สถานะย่อลงเป็น 5 ขั้นตาม UI", () => {
    const mapping: Record<GamePhase, number | null> = {
      levelSelect: null,
      levelIntro: 1,
      dissociateReactants: 1,
      arrangeProductIons: 2,
      balanceEquation: 2,
      validateProducts: 3,
      cancelSpectatorIons: 4,
      netIonicResult: 5,
      levelComplete: 5,
    };

    for (const phase of GAME_PHASES) {
      expect(progressStep(phase), phase).toBe(mapping[phase]);
    }
  });

  it("ทุกสถานะมีคำตอบ ไม่มี undefined หลุด", () => {
    for (const phase of GAME_PHASES) {
      const step = progressStep(phase);
      expect(step === null || (step >= 1 && step <= 5)).toBe(true);
    }
  });
});

describe("สีทองของตะกอน", () => {
  it("ยังไม่ทาสีก่อนผ่านการตรวจผลิตภัณฑ์", () => {
    // สีทองเป็นสัญญาณรางวัลของคำตอบที่ผ่านครบทุกข้อ ห้ามเผยก่อน
    for (const phase of [
      "levelIntro",
      "dissociateReactants",
      "arrangeProductIons",
      "balanceEquation",
    ] as const) {
      expect(
        isPrecipitateRevealed({ ...createInitialState(level), phase }),
        phase,
      ).toBe(false);
    }
  });

  it("ทาสีได้ตั้งแต่ขั้นตรวจผลิตภัณฑ์เป็นต้นไป", () => {
    for (const phase of [
      "validateProducts",
      "cancelSpectatorIons",
      "netIonicResult",
      "levelComplete",
    ] as const) {
      expect(
        isPrecipitateRevealed({ ...createInitialState(level), phase }),
        phase,
      ).toBe(true);
    }
  });
});

describe("ผลของด่านที่ส่งต่อให้ชั้นบันทึก", () => {
  it("อยู่ในรูปที่ recordLevelResult รับได้ตรง ๆ", () => {
    const done = playLevel(level, { startAt: 0, endAt: 42_000 });
    expect(levelResultOf(done, 42_000)).toEqual({
      levelId: 1,
      score: 100,
      timeMs: 42_000,
    });
  });

  it("คะแนนและดาวคำนวณจาก state ปัจจุบัน", () => {
    const state = {
      ...createInitialState(level),
      wrongAttempts: 3,
      hintsUsed: 2,
    };
    expect(scoreOf(state)).toBe(65);
    expect(starsOf(state)).toBe(1);
  });
});

describe("เงื่อนไขเปิดปุ่ม", () => {
  it("ปุ่มตรวจปิดอยู่จนวางครบ", () => {
    const state = { ...createInitialState(level), phase: "arrangeProductIons" as const };
    expect(canCheckArrangement(state)).toBe(false);
  });

  it("ปุ่มยืนยันการตัดปิดอยู่จนตัดครบ", () => {
    const state = {
      ...createInitialState(level),
      phase: "cancelSpectatorIons" as const,
    };
    expect(canConfirmCancellation(state, level)).toBe(false);
  });
});
