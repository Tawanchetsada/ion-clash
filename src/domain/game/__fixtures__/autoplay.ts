import { createInitialState, reduce } from "../gameMachine";
import { correctSpectatorPairs, needsBalancing, playerProducts } from "../guards";
import { completeIonicCards, productSlotIds, reactantIonCards } from "../instances";
import type { BuiltLevel } from "../../../data/buildLevel";
import type { GameEvent } from "../events";
import type { GameState } from "../types";

/**
 * เล่นด่านให้จบด้วยคำตอบที่ถูกต้อง — ใช้ในเทสต์เท่านั้น
 *
 * มีไว้เพื่อเดินเส้นทางเต็มของทุกด่านได้ในลูปเดียว ถ้าด่านไหนมีโครงสร้าง
 * แปลกจนเดินไม่จบ จะโผล่ทันทีแทนที่จะไปโผล่ตอนต่อหน้าจอจริงใน Phase 7
 */

export type PlayOptions = {
  /** เริ่มนับเวลาที่ ms นี้ */
  startAt?: number;
  /** เวลาตอนจบด่าน ใช้คำนวณ timeMs */
  endAt?: number;
  /** ใส่ event เพิ่มก่อนเดินต่อ เช่นคำตอบผิดหรือการกดคำใบ้ */
  interject?: (state: GameState) => readonly GameEvent[];
};

/** ลำดับไอออนที่ถูกต้องในช่องผลิตภัณฑ์ 4 ช่อง — cation ก่อน anion ในแต่ละคู่ */
export function correctSlotOrder(level: BuiltLevel): readonly string[] {
  const cards = reactantIonCards(level);
  const byIon = new Map(cards.map((card) => [card.ionId, card.instanceId]));

  const ids = [
    byIon.get(level.productA.cationId),
    byIon.get(level.productA.anionId),
    byIon.get(level.productB.cationId),
    byIon.get(level.productB.anionId),
  ];

  if (ids.some((id) => id === undefined)) {
    throw new Error(`ด่าน ${level.id}: ไอออนของผลิตภัณฑ์ไม่ตรงกับสารตั้งต้น`);
  }
  return ids as string[];
}

/** สัมประสิทธิ์ที่ถูกต้องเรียงตามลำดับที่ผู้เล่นวาง ไม่ใช่ลำดับของข้อมูลด่าน */
function correctCoefficients(
  state: GameState,
  level: BuiltLevel,
): readonly [number, number, number, number] {
  const products = playerProducts(state, level);
  if (!products) throw new Error(`ด่าน ${level.id}: ประกอบผลิตภัณฑ์ไม่ได้`);

  const { a, b, c, d } = level.coefficients;
  const firstIsProductA = products[0].compoundId === level.productA.compoundId;

  return firstIsProductA ? [a, b, c, d] : [a, b, d, c];
}

export function playLevel(
  level: BuiltLevel,
  options: PlayOptions = {},
): GameState {
  const startAt = options.startAt ?? 0;
  const endAt = options.endAt ?? startAt + 60_000;

  let state = createInitialState(level);
  const send = (...events: readonly GameEvent[]): void => {
    for (const event of events) {
      state = reduce(state, event, level);
      for (const extra of options.interject?.(state) ?? []) {
        state = reduce(state, extra, level);
      }
    }
  };

  send({ type: "START_LEVEL", at: startAt }, { type: "SHOW_IONS" }, { type: "CONTINUE" });

  const slotIds = productSlotIds(level);
  const order = correctSlotOrder(level);
  send(
    ...order.map(
      (instanceId, index): GameEvent => ({
        type: "PLACE_ION",
        instanceId,
        slotId: slotIds[index] ?? "",
      }),
    ),
    { type: "CHECK" },
  );

  if (needsBalancing(level)) {
    const coefficients = correctCoefficients(state, level);
    send(
      ...coefficients.map(
        (value, index): GameEvent => ({
          type: "SET_COEFFICIENT",
          index,
          value,
        }),
      ),
      { type: "CHECK_BALANCE" },
    );
  }

  send({ type: "CONFIRM_PRODUCTS" });

  for (const pair of correctSpectatorPairs(level)) {
    send(
      { type: "SELECT_LEFT", instanceId: pair.leftInstanceId },
      { type: "SELECT_RIGHT", instanceId: pair.rightInstanceId },
    );
  }

  send({ type: "CONFIRM" }, { type: "COMPLETE_LEVEL", at: endAt });

  return state;
}

/** การ์ดฝั่งขวาที่เป็นตะกอน — ใช้ทดสอบว่าตัดตะกอนไม่ได้ */
export function precipitateCardId(level: BuiltLevel): string {
  const card = completeIonicCards(level).right.find(
    (candidate) => candidate.term.kind === "compound",
  );
  if (!card) throw new Error(`ด่าน ${level.id}: หาการ์ดตะกอนไม่พบ`);
  return card.instanceId;
}
