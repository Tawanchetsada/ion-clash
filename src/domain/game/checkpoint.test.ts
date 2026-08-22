import { describe, expect, it } from "vitest";
import { getLevel } from "../../data/levels";
import { levelCheckpointSchema } from "../../storage/schema";
import { emptyErrorTally } from "../chemistry/types";
import { correctSlotOrder } from "./__fixtures__/autoplay";
import { applyCheckpoint, toCheckpoint } from "./checkpoint";
import { createInitialState, reduce } from "./gameMachine";
import { correctSpectatorPairs } from "./guards";
import { productSlotIds } from "./instances";
import type { GameEvent } from "./events";
import type { GameState } from "./types";

const level = getLevel(13);
const SAVED_AT = "2026-08-22T10:00:00.000Z";

function send(state: GameState, events: readonly GameEvent[]): GameState {
  return events.reduce((current, event) => reduce(current, event, level), state);
}

/** เล่นถึงกลางด่าน โดยผิดหนึ่งครั้งและใช้คำใบ้หนึ่งครั้ง */
function midLevel(): GameState {
  const slots = productSlotIds(level);
  const order = correctSlotOrder(level);

  return send(createInitialState(level), [
    { type: "START_LEVEL", at: 0 },
    { type: "CONTINUE" },
    { type: "USE_HINT" },
    ...order.map(
      (instanceId, index): GameEvent => ({
        type: "PLACE_ION",
        instanceId: instanceId ?? "",
        slotId: slots[index] ?? "",
      }),
    ),
    { type: "CHECK" },
    { type: "SET_COEFFICIENT", index: 0, value: 9 },
    { type: "SET_COEFFICIENT", index: 1, value: 9 },
    { type: "SET_COEFFICIENT", index: 2, value: 9 },
    { type: "SET_COEFFICIENT", index: 3, value: 9 },
    { type: "CHECK_BALANCE" },
  ]);
}

describe("บันทึก checkpoint", () => {
  it("บันทึกได้เฉพาะ 4 สถานะกลางด่าน", () => {
    const intro = createInitialState(level);
    expect(toCheckpoint(intro, { at: 0, savedAt: SAVED_AT })).toBeNull();

    const mid = midLevel();
    expect(toCheckpoint(mid, { at: 0, savedAt: SAVED_AT })?.state).toBe(
      "balanceEquation",
    );
  });

  it("ผลลัพธ์ผ่าน schema ของชั้นบันทึกจริง", () => {
    const checkpoint = toCheckpoint(midLevel(), { at: 60_000, savedAt: SAVED_AT });
    expect(levelCheckpointSchema.safeParse(checkpoint).success).toBe(true);
  });

  it("เก็บเวลาที่กำลังเดินอยู่ด้วย ไม่ใช่แค่ยอดที่พับไปแล้ว", () => {
    // ถ้าเก็บ elapsedMs ดิบ เวลาระหว่าง autosave สองครั้งจะหายทุกครั้ง
    const checkpoint = toCheckpoint(midLevel(), { at: 75_000, savedAt: SAVED_AT });
    expect(checkpoint?.elapsedMs).toBe(75_000);
  });

  it("เก็บ errorsByCode ครบทุกรหัส", () => {
    const checkpoint = toCheckpoint(midLevel(), { at: 0, savedAt: SAVED_AT });
    expect(checkpoint?.errorsByCode["E-BALANCE"]).toBe(1);
    expect(Object.keys(checkpoint?.errorsByCode ?? {})).toHaveLength(
      Object.keys(emptyErrorTally()).length,
    );
  });
});

describe("กู้ checkpoint", () => {
  it("ไป-กลับแล้วได้ค่าครบเหมือนเดิม", () => {
    const before = midLevel();
    const checkpoint = toCheckpoint(before, { at: 50_000, savedAt: SAVED_AT });
    expect(checkpoint).not.toBeNull();
    if (!checkpoint) return;

    const after = applyCheckpoint(checkpoint, level, 900_000);
    expect(after).not.toBeNull();
    if (!after) return;

    expect(after.phase).toBe(before.phase);
    expect(after.slots).toEqual(before.slots);
    expect(after.coefficients).toEqual(before.coefficients);
    expect(after.hintsUsed).toBe(before.hintsUsed);
    expect(after.wrongAttempts).toBe(before.wrongAttempts);
    expect(after.errorsByCode).toEqual(before.errorsByCode);
    expect(after.elapsedMs).toBe(50_000);
  });

  it("เดินนาฬิกาต่อทันทีที่กู้ เพราะผู้เล่นอยู่กลางด่านแล้ว", () => {
    const checkpoint = toCheckpoint(midLevel(), { at: 50_000, savedAt: SAVED_AT });
    const after = checkpoint && applyCheckpoint(checkpoint, level, 900_000);
    expect(after?.startedAt).toBe(900_000);
  });

  it("เล่นต่อจนจบได้ และเวลาไม่กระโดด", () => {
    const checkpoint = toCheckpoint(midLevel(), { at: 50_000, savedAt: SAVED_AT });
    const resumed = checkpoint && applyCheckpoint(checkpoint, level, 1_000_000);
    expect(resumed).not.toBeNull();
    if (!resumed) return;

    const { a, b, c, d } = level.coefficients;
    let state = send(resumed, [
      { type: "SET_COEFFICIENT", index: 0, value: a },
      { type: "SET_COEFFICIENT", index: 1, value: b },
      { type: "SET_COEFFICIENT", index: 2, value: c },
      { type: "SET_COEFFICIENT", index: 3, value: d },
      { type: "CHECK_BALANCE" },
      { type: "CONFIRM_PRODUCTS" },
    ]);

    for (const pair of correctSpectatorPairs(level)) {
      state = send(state, [
        { type: "SELECT_LEFT", instanceId: pair.leftInstanceId },
        { type: "SELECT_RIGHT", instanceId: pair.rightInstanceId },
      ]);
    }

    state = send(state, [
      { type: "CONFIRM" },
      { type: "COMPLETE_LEVEL", at: 1_010_000 },
    ]);

    expect(state.phase).toBe("levelComplete");
    // 50 วินาทีก่อนปิดแท็บ บวก 10 วินาทีหลังกลับมา ไม่ใช่ 1,010 วินาที
    expect(state.elapsedMs).toBe(60_000);
  });

  it("checkpoint ของด่านอื่นใช้กับด่านนี้ไม่ได้", () => {
    const checkpoint = toCheckpoint(midLevel(), { at: 0, savedAt: SAVED_AT });
    expect(checkpoint && applyCheckpoint(checkpoint, getLevel(14), 0)).toBeNull();
  });

  it("id การ์ดที่ไม่รู้จักถูกตัดทิ้ง ไม่ throw", () => {
    // เกิดได้เมื่อข้อมูลด่านถูกแก้หลังนักเรียนเซฟไว้ — ต้องเริ่มด่านใหม่ได้
    // ไม่ใช่เปิดเว็บไม่ได้ทั้งเว็บ
    const checkpoint = toCheckpoint(midLevel(), { at: 0, savedAt: SAVED_AT });
    expect(checkpoint).not.toBeNull();
    if (!checkpoint) return;

    const tampered = {
      ...checkpoint,
      slotAssignments: [
        { slotId: checkpoint.slotAssignments[0]?.slotId ?? "", ionInstanceId: "ผี" },
        { slotId: "ช่องที่ไม่มีจริง", ionInstanceId: "ผีอีกตัว" },
      ],
      canceledPairs: [{ leftInstanceId: "ซ้ายผี", rightInstanceId: "ขวาผี" }],
    };

    const after = applyCheckpoint(tampered, level, 0);
    expect(after?.slots).toHaveLength(4);
    expect(after?.slots.every((slot) => slot.ionInstanceId === null)).toBe(true);
    expect(after?.canceledPairs).toEqual([]);
  });

  it("errorsByCode ที่ขาดถูกเติมเป็นศูนย์", () => {
    const checkpoint = toCheckpoint(midLevel(), { at: 0, savedAt: SAVED_AT });
    expect(checkpoint).not.toBeNull();
    if (!checkpoint) return;

    const after = applyCheckpoint(
      { ...checkpoint, errorsByCode: { "E-PAIR": 2 } as never },
      level,
      0,
    );
    expect(after?.errorsByCode).toEqual({ ...emptyErrorTally(), "E-PAIR": 2 });
  });

  it("คำใบ้ที่บันทึกไว้เกินโควตาถูกดึงกลับ", () => {
    const checkpoint = toCheckpoint(midLevel(), { at: 0, savedAt: SAVED_AT });
    expect(checkpoint).not.toBeNull();
    if (!checkpoint) return;

    const after = applyCheckpoint({ ...checkpoint, hintsUsed: 3 }, level, 0);
    expect(after?.hintsUsed).toBeLessThanOrEqual(level.hints.length);
  });
});
