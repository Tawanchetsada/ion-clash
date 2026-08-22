import { describe, expect, it } from "vitest";
import { LEVELS, getLevel } from "../../data/levels";
import { createInitialState, reduce } from "./gameMachine";
import { canUseHint, hintBudget, nextHint, visibleHints } from "./hints";
import { computeScore } from "./scoring";
import type { GameState } from "./types";

const level = getLevel(1);

function playing(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(level),
    phase: "arrangeProductIons",
    ...overrides,
  };
}

describe("ระบบคำใบ้", () => {
  it.each(LEVELS)("ด่าน $id — โควตาเท่ากับจำนวนคำใบ้ที่ด่านนั้นมีจริง", (item) => {
    // ไม่ใช่เลข 3 ที่ตายตัว เพราะสเปกกับ D-05 ขัดกันเรื่องด่าน 41-50
    // การอ่านจากข้อมูลทำให้ Phase 8 ปรับได้โดยไม่ต้องแก้ตรรกะเกม
    expect(hintBudget(item)).toBe(item.hints.length);
  });

  it("ยังไม่กด ไม่มีคำใบ้ให้เห็น", () => {
    expect(visibleHints(playing(), level)).toEqual([]);
  });

  it("กดแล้วเห็นทีละระดับ ไล่จากกว้างไปแคบ", () => {
    let state = playing();
    for (let count = 1; count <= 3; count += 1) {
      state = reduce(state, { type: "USE_HINT" }, level);
      expect(state.hintsUsed).toBe(count);
      expect(visibleHints(state, level)).toEqual(level.hints.slice(0, count));
    }
  });

  it("กดเกินโควตาไม่เปลี่ยน state และไม่หักคะแนนเพิ่ม", () => {
    let state = playing();
    for (let count = 0; count < 3; count += 1) {
      state = reduce(state, { type: "USE_HINT" }, level);
    }

    const capped = reduce(state, { type: "USE_HINT" }, level);
    expect(capped).toBe(state);
    expect(canUseHint(state, level)).toBe(false);
    expect(nextHint(state, level)).toBeNull();
    expect(computeScore(capped)).toBe(computeScore(state));
  });

  it("กดคำใบ้ตอนยังไม่เริ่มด่านไม่ได้", () => {
    const intro = createInitialState(level);
    expect(reduce(intro, { type: "USE_HINT" }, level)).toBe(intro);
  });

  it("คำใบ้ระดับถัดไปคือข้อที่ยังไม่เปิด", () => {
    const state = playing({ hintsUsed: 1 });
    expect(nextHint(state, level)).toBe(level.hints[1]);
  });
});
