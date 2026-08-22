import { emptyErrorTally } from "../chemistry/types";
import { errorFeedback, successFeedback } from "./feedback";
import {
  checkArrangement,
  checkBalance,
  checkCancelPair,
  findEquationCard,
  isArrangementComplete,
  isBalanceComplete,
  isCancellationComplete,
  isCardCanceled,
  needsBalancing,
} from "./guards";
import { canUseHint } from "./hints";
import { productSlotIds } from "./instances";
import { pauseTimer, readElapsed, resumeTimer, startTimer } from "./timer";
import type { BuiltLevel } from "../../data/buildLevel";
import type { ErrorCode, ValidationResult } from "../chemistry/types";
import type { GameEvent } from "./events";
import type { CoefficientInputs, GameState } from "./types";

/**
 * Reducer ของเกม — ฟังก์ชันบริสุทธิ์ ไม่มี side effect ไม่แตะ storage
 *
 * การบันทึกเป็นหน้าที่ของชั้นบน (Phase 7) ที่คอยดู state แล้วสั่ง repository
 * ถ้า reducer เรียก save เอง จะทดสอบยากและเกิด side effect ซ้อนกันเวลา
 * autosave กับการจบด่านมาพร้อมกัน
 *
 * **event ที่ส่งผิดสถานะคืน state เดิมทั้งอ็อบเจกต์** (ไม่ใช่สำเนาที่ค่าเท่ากัน)
 * เพื่อให้ React bail out ได้ ไม่ต้อง re-render ทุกครั้งที่ผู้เล่นแตะผิดที่
 */

/** สัมประสิทธิ์ที่ผู้เล่นกรอกได้ตามสเปก — จำนวนเต็ม 1 ถึง 9 เท่านั้น */
const MIN_COEFFICIENT_INPUT = 1;
const MAX_COEFFICIENT_INPUT = 9;

const EMPTY_COEFFICIENTS: CoefficientInputs = [null, null, null, null];

/** สถานะที่ผู้เล่นกำลังเล่นอยู่จริง — event ข้ามสถานะอย่างคำใบ้และเวลาใช้ได้ที่นี่ */
const PLAYING_PHASES = new Set<GameState["phase"]>([
  "dissociateReactants",
  "arrangeProductIons",
  "balanceEquation",
  "validateProducts",
  "cancelSpectatorIons",
  "netIonicResult",
]);

export function createInitialState(level: BuiltLevel): GameState {
  return {
    phase: "levelIntro",
    levelId: level.id,
    slots: productSlotIds(level).map((slotId) => ({
      slotId,
      ionInstanceId: null,
    })),
    coefficients: EMPTY_COEFFICIENTS,
    canceledPairs: [],
    selection: null,
    hintsUsed: 0,
    wrongAttempts: 0,
    errorsByCode: emptyErrorTally(),
    startedAt: null,
    elapsedMs: 0,
    lastFeedback: null,
  };
}

/** นับความผิดหนึ่งครั้ง ทั้งยอดรวมและแยกตามรหัส — สองค่านี้ต้องตรงกันเสมอ */
function withError(state: GameState, code: ErrorCode): GameState {
  return {
    ...state,
    wrongAttempts: state.wrongAttempts + 1,
    errorsByCode: {
      ...state.errorsByCode,
      [code]: state.errorsByCode[code] + 1,
    },
    lastFeedback: errorFeedback(code),
  };
}

function placeIon(
  state: GameState,
  instanceId: string,
  slotId: string,
): GameState {
  const target = state.slots.find((slot) => slot.slotId === slotId);
  if (!target) return state;
  if (target.ionInstanceId === instanceId) return state;

  const origin = state.slots.find((slot) => slot.ionInstanceId === instanceId);
  const displaced = target.ionInstanceId;

  const slots = state.slots.map((slot) => {
    if (slot.slotId === slotId) return { ...slot, ionInstanceId: instanceId };
    // การ์ดที่ถูกแทนที่กลับไปอยู่ช่องเดิมของการ์ดที่ย้ายมา ไม่ใช่หายไปเฉย ๆ
    if (origin && slot.slotId === origin.slotId) {
      return { ...slot, ionInstanceId: displaced };
    }
    return slot;
  });

  return { ...state, slots, lastFeedback: null };
}

function swapSlots(
  state: GameState,
  fromSlotId: string,
  toSlotId: string,
): GameState {
  if (fromSlotId === toSlotId) return state;

  const from = state.slots.find((slot) => slot.slotId === fromSlotId);
  const to = state.slots.find((slot) => slot.slotId === toSlotId);
  if (!from || !to) return state;

  const slots = state.slots.map((slot) => {
    if (slot.slotId === fromSlotId) {
      return { ...slot, ionInstanceId: to.ionInstanceId };
    }
    if (slot.slotId === toSlotId) {
      return { ...slot, ionInstanceId: from.ionInstanceId };
    }
    return slot;
  });

  return { ...state, slots, lastFeedback: null };
}

function setCoefficient(
  state: GameState,
  index: number,
  value: number | null,
): GameState {
  if (!Number.isInteger(index) || index < 0 || index > 3) return state;
  if (
    value !== null &&
    (!Number.isInteger(value) ||
      value < MIN_COEFFICIENT_INPUT ||
      value > MAX_COEFFICIENT_INPUT)
  ) {
    // ช่องกรอกรับเฉพาะจำนวนเต็ม 1-9 — ค่านอกช่วงถือว่าไม่เคยกรอก ไม่ใช่ตอบผิด
    return state;
  }

  const [a, b, c, d] = state.coefficients;
  const at = (position: number, current: number | null): number | null =>
    position === index ? value : current;

  return {
    ...state,
    coefficients: [at(0, a), at(1, b), at(2, c), at(3, d)],
    lastFeedback: null,
  };
}

/** ผ่านขั้นวางไอออนแล้วไปไหนต่อ — ด่านที่ไม่ต้องดุลข้าม balanceEquation ไปเลย */
function afterArrangement(state: GameState, level: BuiltLevel): GameState {
  return {
    ...state,
    phase: needsBalancing(level) ? "balanceEquation" : "validateProducts",
    lastFeedback: successFeedback(
      needsBalancing(level) ? "arrangement" : "products",
    ),
  };
}

function applyCheck(
  state: GameState,
  result: ValidationResult,
  onSuccess: (state: GameState) => GameState,
): GameState {
  return result.ok ? onSuccess(state) : withError(state, result.code);
}

function selectCard(
  state: GameState,
  level: BuiltLevel,
  side: "left" | "right",
  instanceId: string,
): GameState {
  const card = findEquationCard(level, instanceId);
  // การ์ดที่ไม่มีจริงหรือตัดไปแล้วเลือกไม่ได้ — ไม่ใช่การตอบผิด จึงไม่หักคะแนน
  if (!card || card.side !== side || isCardCanceled(state, instanceId)) {
    return state;
  }

  const pending = state.selection;
  if (!pending || pending.side === side) {
    return { ...state, selection: { side, instanceId }, lastFeedback: null };
  }

  const leftInstanceId = side === "left" ? instanceId : pending.instanceId;
  const rightInstanceId = side === "right" ? instanceId : pending.instanceId;
  const result = checkCancelPair(level, leftInstanceId, rightInstanceId);

  if (!result.ok) {
    return { ...withError(state, result.code), selection: null };
  }

  const canceledPairs = [
    ...state.canceledPairs,
    { leftInstanceId, rightInstanceId },
  ];

  return {
    ...state,
    canceledPairs,
    selection: null,
    lastFeedback: successFeedback("cancelPair"),
  };
}

export function reduce(
  state: GameState,
  event: GameEvent,
  level: BuiltLevel,
): GameState {
  // ── event ข้ามสถานะ: ใช้ได้ทุกสถานะระหว่างเล่น
  switch (event.type) {
    case "USE_HINT":
      if (!PLAYING_PHASES.has(state.phase) || !canUseHint(state, level)) {
        return state;
      }
      return { ...state, hintsUsed: state.hintsUsed + 1 };

    case "PAUSE": {
      const timer = pauseTimer(state, event.at);
      return timer === state ? state : { ...state, ...timer };
    }

    case "RESUME": {
      if (!PLAYING_PHASES.has(state.phase)) return state;
      const timer = resumeTimer(state, event.at);
      return timer === state ? state : { ...state, ...timer };
    }

    default:
      break;
  }

  switch (state.phase) {
    case "levelIntro":
      if (event.type === "START_LEVEL") {
        // เริ่มจับเวลาตรงนี้ ไม่ใช่ตอนเข้า route เพราะผู้เล่นอาจเปิดหน้าโจทย์ค้างไว้
        return {
          ...state,
          phase: "dissociateReactants",
          ...startTimer(event.at),
        };
      }
      if (event.type === "EXIT") return { ...state, phase: "levelSelect" };
      return state;

    case "dissociateReactants":
      // SHOW_IONS ไม่เปลี่ยน state เพราะการ์ดไอออนคำนวณจากข้อมูลด่านได้ทั้งหมด
      // (ดู reactantIonCards) ไม่มีอะไรต้องเก็บ — รับไว้เพื่อให้ Phase 7
      // สั่งอนิเมชันและ Phase 9 บันทึก event ได้โดยไม่ต้องเลี่ยง state machine
      if (event.type === "CONTINUE") {
        return { ...state, phase: "arrangeProductIons" };
      }
      return state;

    case "arrangeProductIons":
      switch (event.type) {
        case "PLACE_ION":
          return placeIon(state, event.instanceId, event.slotId);
        case "MOVE_ION":
          return swapSlots(state, event.fromSlotId, event.toSlotId);
        case "REMOVE_ION": {
          const target = state.slots.find(
            (slot) => slot.slotId === event.slotId,
          );
          if (!target || target.ionInstanceId === null) return state;
          return {
            ...state,
            slots: state.slots.map((slot) =>
              slot.slotId === event.slotId
                ? { ...slot, ionInstanceId: null }
                : slot,
            ),
            lastFeedback: null,
          };
        }
        case "CHECK":
          // ปุ่มตรวจ disabled จนวางครบ 4 ช่อง — กดไม่ได้จึงไม่นับว่าผิด
          if (!isArrangementComplete(state)) return state;
          return applyCheck(state, checkArrangement(state, level), (next) =>
            afterArrangement(next, level),
          );
        default:
          return state;
      }

    case "balanceEquation":
      switch (event.type) {
        case "SET_COEFFICIENT":
          return setCoefficient(state, event.index, event.value);
        case "CHECK_BALANCE":
          if (!isBalanceComplete(state)) return state;
          return applyCheck(state, checkBalance(state, level), (next) => ({
            ...next,
            phase: "validateProducts",
            lastFeedback: successFeedback("balance"),
          }));
        default:
          return state;
      }

    case "validateProducts":
      // ขั้นนี้เป็นการเฉลยผลล้วน ๆ ระบบแยกเองว่าตัวไหนตกตะกอน ผู้เล่นไม่ได้
      // ประกาศสถานะการละลายเอง (ยืนยันจาก UI PDF หน้า 09 และตาราง event ในสเปก
      // ที่มีแค่ CONFIRM_PRODUCTS) — E-PHASE จึงยิงไม่ได้ในเฟสนี้โดยตั้งใจ
      if (event.type === "CONFIRM_PRODUCTS") {
        return {
          ...state,
          phase: "cancelSpectatorIons",
          lastFeedback: null,
        };
      }
      return state;

    case "cancelSpectatorIons":
      switch (event.type) {
        case "SELECT_LEFT":
          return selectCard(state, level, "left", event.instanceId);
        case "SELECT_RIGHT":
          return selectCard(state, level, "right", event.instanceId);
        case "UNDO":
          if (state.canceledPairs.length === 0) return state;
          return {
            ...state,
            canceledPairs: state.canceledPairs.slice(0, -1),
            selection: null,
            lastFeedback: null,
          };
        case "RESET":
          if (state.canceledPairs.length === 0 && state.selection === null) {
            return state;
          }
          return {
            ...state,
            canceledPairs: [],
            selection: null,
            lastFeedback: null,
          };
        case "CONFIRM":
          // ปุ่มยืนยัน disabled จนตัดครบ — ไม่ใช่การตอบผิด จึงไม่หักคะแนน
          if (!isCancellationComplete(state, level)) return state;
          return {
            ...state,
            phase: "netIonicResult",
            selection: null,
            lastFeedback: successFeedback("cancelComplete"),
          };
        default:
          return state;
      }

    case "netIonicResult":
      if (event.type === "COMPLETE_LEVEL") {
        return {
          ...state,
          phase: "levelComplete",
          startedAt: null,
          elapsedMs: readElapsed(state, event.at),
          lastFeedback: successFeedback("levelComplete"),
        };
      }
      return state;

    case "levelComplete":
      switch (event.type) {
        case "REPLAY":
          // เริ่มใหม่หมด รวมคะแนนและเวลา — ชั้นบันทึกเก็บเฉพาะผลที่ดีที่สุด
          // และเพิ่ม attempts ให้เอง reducer จึงไม่ต้องจำรอบก่อนหน้า
          return {
            ...createInitialState(level),
            phase: "dissociateReactants",
            ...startTimer(event.at),
          };
        case "NEXT_LEVEL":
        case "LEVELS":
          return { ...state, phase: "levelSelect" };
        default:
          return state;
      }

    default:
      return state;
  }
}
