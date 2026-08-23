import { describe, expect, it } from "vitest";
import { LEVELS, getLevel } from "../../data/levels";
import { ERROR_CODES } from "../chemistry/types";
import {
  correctSlotOrder,
  playLevel,
  precipitateCardId,
} from "./__fixtures__/autoplay";
import { createInitialState, reduce } from "./gameMachine";
import { correctSpectatorPairs, needsBalancing } from "./guards";
import { completeIonicCards, productSlotIds } from "./instances";
import { scoreOf, starsOf } from "./selectors";
import type { GameEvent } from "./events";
import type { GameState } from "./types";

const level1 = getLevel(1);

function send(
  state: GameState,
  events: readonly GameEvent[],
  level = level1,
): GameState {
  return events.reduce((current, event) => reduce(current, event, level), state);
}

function tallyTotal(state: GameState): number {
  return ERROR_CODES.reduce((sum, code) => sum + state.errorsByCode[code], 0);
}

describe("เส้นทางเต็มของด่าน", () => {
  it("ด่าน 01 เล่นจบได้ตั้งแต่ levelIntro ถึง levelComplete", () => {
    const state = playLevel(level1, { startAt: 0, endAt: 45_000 });

    expect(state.phase).toBe("levelComplete");
    expect(state.wrongAttempts).toBe(0);
    expect(scoreOf(state)).toBe(100);
    expect(starsOf(state)).toBe(3);
    expect(state.elapsedMs).toBe(45_000);
    expect(state.startedAt).toBeNull();
  });

  it("ด่าน 13 ที่ต้องดุล ผ่านสถานะ balanceEquation จริง", () => {
    const level = getLevel(13);
    expect(needsBalancing(level)).toBe(true);

    const phases: string[] = [];
    const state = playLevel(level, {
      interject: (current) => {
        phases.push(current.phase);
        return [];
      },
    });

    expect(phases).toContain("balanceEquation");
    expect(state.phase).toBe("levelComplete");
  });

  it("ด่าน 42 ระดับท้าทายเล่นจบได้", () => {
    const state = playLevel(getLevel(42));
    expect(state.phase).toBe("levelComplete");
    expect(scoreOf(state)).toBe(100);
  });

  it("ด่านที่สัมประสิทธิ์เป็น 1 ทุกตัวข้าม balanceEquation ไปเลย", () => {
    const phases: string[] = [];
    playLevel(level1, {
      interject: (current) => {
        phases.push(current.phase);
        return [];
      },
    });

    expect(phases).not.toContain("balanceEquation");
    expect(phases).toContain("validateProducts");
  });

  it("เล่นอัตโนมัติจบครบทั้ง 50 ด่าน ได้ 100 คะแนน 3 ดาว", () => {
    // ด่านไหนที่โครงสร้างแปลกจนเดินเส้นทางไม่จบจะโผล่ตรงนี้ ไม่ใช่ตอน Phase 7
    for (const level of LEVELS) {
      const state = playLevel(level);
      expect(state.phase, `ด่าน ${level.id}`).toBe("levelComplete");
      expect(scoreOf(state), `ด่าน ${level.id}`).toBe(100);
      expect(starsOf(state), `ด่าน ${level.id}`).toBe(3);
    }
  });
});

describe("event ที่ส่งผิดสถานะ", () => {
  it("คืน state เดิมทั้งอ็อบเจกต์ ไม่ใช่สำเนา", () => {
    // ต้องเป็นตัวเดิมจริง ๆ เพื่อให้ React ไม่ re-render ทุกครั้งที่แตะผิดที่
    const intro = createInitialState(level1);
    const strays: readonly GameEvent[] = [
      { type: "CHECK" },
      { type: "CHECK_BALANCE" },
      { type: "CONFIRM_PRODUCTS" },
      { type: "CONFIRM" },
      { type: "UNDO" },
      { type: "RESET" },
      { type: "COMPLETE_LEVEL", at: 1 },
      { type: "SET_COEFFICIENT", index: 0, value: 2 },
      { type: "PLACE_ION", instanceId: "x", slotId: "y" },
      { type: "SELECT_LEFT", instanceId: "x" },
    ];

    for (const event of strays) {
      expect(reduce(intro, event, level1), event.type).toBe(intro);
    }
  });

  it("ไม่ throw แม้ส่ง event ที่อ้าง id ที่ไม่มีจริง", () => {
    const arranging = send(createInitialState(level1), [
      { type: "START_LEVEL", at: 0 },
      { type: "CONTINUE" },
    ]);

    expect(() =>
      send(arranging, [
        { type: "PLACE_ION", instanceId: "ผี", slotId: "ไม่มีช่องนี้" },
        { type: "MOVE_ION", fromSlotId: "a", toSlotId: "b" },
        { type: "REMOVE_ION", slotId: "z" },
      ]),
    ).not.toThrow();
  });

  it("กดตรวจก่อนวางครบไม่นับว่าผิด", () => {
    const arranging = send(createInitialState(level1), [
      { type: "START_LEVEL", at: 0 },
      { type: "CONTINUE" },
    ]);

    expect(reduce(arranging, { type: "CHECK" }, level1)).toBe(arranging);
    expect(arranging.wrongAttempts).toBe(0);
  });
});

describe("การวางไอออนลงช่อง", () => {
  const slots = productSlotIds(level1);
  const order = correctSlotOrder(level1);
  const base = send(createInitialState(level1), [
    { type: "START_LEVEL", at: 0 },
    { type: "CONTINUE" },
  ]);

  it("วางแล้วสลับตำแหน่งได้", () => {
    const placed = send(base, [
      { type: "PLACE_ION", instanceId: order[0] ?? "", slotId: slots[0] },
      { type: "PLACE_ION", instanceId: order[1] ?? "", slotId: slots[1] },
      { type: "MOVE_ION", fromSlotId: slots[0], toSlotId: slots[1] },
    ]);

    expect(placed.slots[0]?.ionInstanceId).toBe(order[1]);
    expect(placed.slots[1]?.ionInstanceId).toBe(order[0]);
  });

  it("ลากการ์ดที่วางแล้วไปช่องที่มีของ ทำให้สองใบสลับกัน ไม่มีใบไหนหาย", () => {
    const placed = send(base, [
      { type: "PLACE_ION", instanceId: order[0] ?? "", slotId: slots[0] },
      { type: "PLACE_ION", instanceId: order[1] ?? "", slotId: slots[1] },
      { type: "PLACE_ION", instanceId: order[0] ?? "", slotId: slots[1] },
    ]);

    expect(placed.slots[0]?.ionInstanceId).toBe(order[1]);
    expect(placed.slots[1]?.ionInstanceId).toBe(order[0]);
  });

  it("ลากออกจากช่องได้", () => {
    const placed = send(base, [
      { type: "PLACE_ION", instanceId: order[0] ?? "", slotId: slots[0] },
      { type: "REMOVE_ION", slotId: slots[0] },
    ]);

    expect(placed.slots[0]?.ionInstanceId).toBeNull();
  });
});

describe("การนับความผิด", () => {
  it("ตอบผิดหักคะแนนและบันทึกรหัสที่ผิด", () => {
    const order = correctSlotOrder(level1);
    const slots = productSlotIds(level1);
    // สลับ cation กับ anion ในคู่แรก — ผิดลำดับตาม D-03
    const wrong = [order[1], order[0], order[2], order[3]];

    const state = send(createInitialState(level1), [
      { type: "START_LEVEL", at: 0 },
      { type: "CONTINUE" },
      ...wrong.map(
        (instanceId, index): GameEvent => ({
          type: "PLACE_ION",
          instanceId: instanceId ?? "",
          slotId: slots[index] ?? "",
        }),
      ),
      { type: "CHECK" },
    ]);

    expect(state.phase).toBe("arrangeProductIons");
    expect(state.wrongAttempts).toBe(1);
    expect(state.errorsByCode["E-PAIR"]).toBe(1);
    expect(state.lastFeedback?.kind).toBe("error");
    expect(scoreOf(state)).toBe(95);
  });

  it("ยอดรวมกับผลรวมรายรหัสตรงกันเสมอ", () => {
    // ถ้าสองค่านี้หลุดจากกัน สถิติงานวิจัยจะอ่านไม่ได้
    const level = getLevel(13);
    const state = playLevel(level, {
      interject: (current) =>
        current.phase === "balanceEquation" && current.wrongAttempts < 2
          ? [
              { type: "SET_COEFFICIENT", index: 0, value: 9 },
              { type: "SET_COEFFICIENT", index: 1, value: 9 },
              { type: "SET_COEFFICIENT", index: 2, value: 9 },
              { type: "SET_COEFFICIENT", index: 3, value: 9 },
              { type: "CHECK_BALANCE" },
            ]
          : [],
    });

    expect(state.wrongAttempts).toBeGreaterThan(0);
    expect(tallyTotal(state)).toBe(state.wrongAttempts);
    expect(state.errorsByCode["E-BALANCE"]).toBeGreaterThan(0);
  });

  it("ดุลได้แต่ไม่ใช่อัตราส่วนต่ำสุดได้ E-RATIO ไม่ใช่ E-BALANCE", () => {
    const level = getLevel(13);
    const { a, b, c, d } = level.coefficients;
    const doubled = [a * 2, b * 2, c * 2, d * 2];

    const state = playLevel(level, {
      interject: (current) =>
        current.phase === "balanceEquation" && current.wrongAttempts === 0
          ? [
              ...doubled.map(
                (value, index): GameEvent => ({
                  type: "SET_COEFFICIENT",
                  index,
                  value,
                }),
              ),
              { type: "CHECK_BALANCE" },
            ]
          : [],
    });

    expect(state.errorsByCode["E-RATIO"]).toBe(1);
    expect(state.errorsByCode["E-BALANCE"]).toBe(0);
  });
});

describe("ช่องกรอกสัมประสิทธิ์", () => {
  const level = getLevel(13);

  function atBalanceStep(): GameState {
    const slots = productSlotIds(level);
    const order = correctSlotOrder(level);
    return send(
      createInitialState(level),
      [
        { type: "START_LEVEL", at: 0 },
        { type: "CONTINUE" },
        ...order.map(
          (instanceId, index): GameEvent => ({
            type: "PLACE_ION",
            instanceId: instanceId ?? "",
            slotId: slots[index] ?? "",
          }),
        ),
        { type: "CHECK" },
      ],
      level,
    );
  }

  it("รับเฉพาะจำนวนเต็ม 1-9 ตามสเปก", () => {
    const state = atBalanceStep();
    expect(state.phase).toBe("balanceEquation");

    for (const value of [0, -1, 10, 2.5]) {
      expect(
        reduce(state, { type: "SET_COEFFICIENT", index: 0, value }, level),
      ).toBe(state);
    }

    const filled = reduce(
      state,
      { type: "SET_COEFFICIENT", index: 0, value: 3 },
      level,
    );
    expect(filled.coefficients[0]).toBe(3);
  });

  it("ล้างช่องด้วย null ได้", () => {
    const state = reduce(
      atBalanceStep(),
      { type: "SET_COEFFICIENT", index: 1, value: 2 },
      level,
    );
    expect(
      reduce(state, { type: "SET_COEFFICIENT", index: 1, value: null }, level)
        .coefficients[1],
    ).toBeNull();
  });

  it("กดตรวจสมดุลก่อนกรอกครบไม่นับว่าผิด", () => {
    const state = atBalanceStep();
    expect(reduce(state, { type: "CHECK_BALANCE" }, level)).toBe(state);
    expect(state.wrongAttempts).toBe(0);
  });
});

describe("ขั้นตัดไอออนผู้ชม", () => {
  function atCancelStep(): GameState {
    const slots = productSlotIds(level1);
    const order = correctSlotOrder(level1);
    return send(createInitialState(level1), [
      { type: "START_LEVEL", at: 0 },
      { type: "CONTINUE" },
      ...order.map(
        (instanceId, index): GameEvent => ({
          type: "PLACE_ION",
          instanceId: instanceId ?? "",
          slotId: slots[index] ?? "",
        }),
      ),
      { type: "CHECK" },
      { type: "CONFIRM_PRODUCTS" },
    ]);
  }

  it("เลือกซ้ายแล้วขวาที่ถูกกัน เกิดเป็นคู่ที่ตัดแล้ว", () => {
    const [pair] = correctSpectatorPairs(level1);
    const state = send(atCancelStep(), [
      { type: "SELECT_LEFT", instanceId: pair?.leftInstanceId ?? "" },
      { type: "SELECT_RIGHT", instanceId: pair?.rightInstanceId ?? "" },
    ]);

    expect(state.canceledPairs).toHaveLength(1);
    expect(state.selection).toBeNull();
    expect(state.lastFeedback?.kind).toBe("success");
  });

  it("ตัดตะกอนไม่ได้ และนับเป็นความผิด E-SPECTATOR", () => {
    const left = completeIonicCards(level1).left[0];
    const state = send(atCancelStep(), [
      { type: "SELECT_LEFT", instanceId: left?.instanceId ?? "" },
      { type: "SELECT_RIGHT", instanceId: precipitateCardId(level1) },
    ]);

    expect(state.canceledPairs).toHaveLength(0);
    expect(state.errorsByCode["E-SPECTATOR"]).toBe(1);
    expect(state.selection).toBeNull();
  });

  it("เลือกการ์ดที่ตัดไปแล้วไม่นับว่าผิด", () => {
    const [pair] = correctSpectatorPairs(level1);
    const cut = send(atCancelStep(), [
      { type: "SELECT_LEFT", instanceId: pair?.leftInstanceId ?? "" },
      { type: "SELECT_RIGHT", instanceId: pair?.rightInstanceId ?? "" },
    ]);

    const again = reduce(
      cut,
      { type: "SELECT_LEFT", instanceId: pair?.leftInstanceId ?? "" },
      level1,
    );
    expect(again).toBe(cut);
  });

  it("Undo ถอนคู่ล่าสุด Reset ล้างทั้งหมด และทั้งคู่ไม่หักคะแนน", () => {
    const pairs = correctSpectatorPairs(level1);
    let state = atCancelStep();
    for (const pair of pairs) {
      state = send(state, [
        { type: "SELECT_LEFT", instanceId: pair.leftInstanceId },
        { type: "SELECT_RIGHT", instanceId: pair.rightInstanceId },
      ]);
    }

    const undone = reduce(state, { type: "UNDO" }, level1);
    expect(undone.canceledPairs).toHaveLength(pairs.length - 1);

    const reset = reduce(state, { type: "RESET" }, level1);
    expect(reset.canceledPairs).toHaveLength(0);
    expect(reset.wrongAttempts).toBe(0);
  });

  it("กดยืนยันก่อนตัดครบไม่นับว่าผิด", () => {
    const state = atCancelStep();
    expect(reduce(state, { type: "CONFIRM" }, level1)).toBe(state);
  });
});

describe("การจับเวลาใน state machine", () => {
  it("เริ่มนับตอนกดเริ่ม ไม่ใช่ตอนสร้าง state", () => {
    const intro = createInitialState(level1);
    expect(intro.startedAt).toBeNull();

    const started = reduce(intro, { type: "START_LEVEL", at: 5_000 }, level1);
    expect(started.startedAt).toBe(5_000);
    expect(started.elapsedMs).toBe(0);
  });

  it("หยุดตอนแท็บถูกซ่อนแล้วเดินต่อเมื่อกลับมา", () => {
    const state = send(createInitialState(level1), [
      { type: "START_LEVEL", at: 0 },
      { type: "CONTINUE" },
      { type: "PAUSE", at: 10_000 },
      { type: "RESUME", at: 610_000 },
    ]);

    expect(state.elapsedMs).toBe(10_000);
    expect(state.startedAt).toBe(610_000);
  });
});

describe("จบด่านแล้วเล่นซ้ำ", () => {
  it("REPLAY เริ่มใหม่หมดและเดินนาฬิกาใหม่", () => {
    const done = playLevel(level1, { startAt: 0, endAt: 30_000 });
    const replayed = reduce(done, { type: "REPLAY", at: 90_000 }, level1);

    expect(replayed.phase).toBe("dissociateReactants");
    expect(replayed.wrongAttempts).toBe(0);
    expect(replayed.hintsUsed).toBe(0);
    expect(replayed.canceledPairs).toEqual([]);
    expect(replayed.elapsedMs).toBe(0);
    expect(replayed.startedAt).toBe(90_000);
  });

  it("ปุ่มเลือกด่านและด่านถัดไปพากลับ levelSelect", () => {
    const done = playLevel(level1);
    expect(reduce(done, { type: "LEVELS" }, level1).phase).toBe("levelSelect");
    expect(reduce(done, { type: "NEXT_LEVEL" }, level1).phase).toBe("levelSelect");
  });

  it("ออกจากหน้าโจทย์ก่อนเริ่มได้", () => {
    const intro = createInitialState(level1);
    expect(reduce(intro, { type: "EXIT" }, level1).phase).toBe("levelSelect");
  });
});
