/**
 * Event ทั้งหมดที่ state machine รับได้
 *
 * ตารางในสเปกกำหนด event ต่อสถานะไว้แล้ว ที่นี่เพิ่มอีก 3 ตัวที่ตารางไม่ได้ระบุ
 * แต่ข้อกำหนดอื่นบังคับไว้ และไม่ได้เปลี่ยนเส้นทางของ state machine เลย
 *
 *   USE_HINT        D-05 บังคับให้มีปุ่มคำใบ้ 3 ระดับ
 *   PAUSE / RESUME  หัวข้อการจับเวลาบังคับให้หยุดนับเมื่อแท็บถูกซ่อน
 *
 * **event ที่เกี่ยวกับเวลาพก `at` มาเอง** ไม่ให้ reducer เรียก Date.now()
 * เพราะ reducer ต้องเป็นฟังก์ชันบริสุทธิ์ ทดสอบได้โดยไม่ต้องใช้ fake timer
 */
export type GameEvent =
  // ── levelIntro
  | { type: "START_LEVEL"; at: number }
  | { type: "EXIT" }
  // ── dissociateReactants
  | { type: "SHOW_IONS" }
  | { type: "CONTINUE" }
  // ── arrangeProductIons
  | { type: "PLACE_ION"; instanceId: string; slotId: string }
  | { type: "MOVE_ION"; fromSlotId: string; toSlotId: string }
  | { type: "REMOVE_ION"; slotId: string }
  | { type: "CHECK" }
  // ── balanceEquation
  | { type: "SET_COEFFICIENT"; index: number; value: number | null }
  | { type: "CHECK_BALANCE" }
  // ── validateProducts
  | { type: "CONFIRM_PRODUCTS" }
  // ── cancelSpectatorIons
  | { type: "SELECT_LEFT"; instanceId: string }
  | { type: "SELECT_RIGHT"; instanceId: string }
  | { type: "UNDO" }
  | { type: "RESET" }
  | { type: "CONFIRM" }
  // ── netIonicResult
  | { type: "COMPLETE_LEVEL"; at: number }
  // ── levelComplete
  | { type: "NEXT_LEVEL" }
  | { type: "LEVELS" }
  | { type: "REPLAY"; at: number }
  // ── ใช้ได้ทุกสถานะระหว่างเล่น
  | { type: "USE_HINT" }
  | { type: "PAUSE"; at: number }
  | { type: "RESUME"; at: number }
  // ── ย้อนกลับไปขั้นก่อนหน้า / ไปยังขั้นที่ระบุ
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; step: 1 | 2 | 3 | 4 | 5 };

export type GameEventType = GameEvent["type"];
