import type { GameEvent } from "../../domain/game/events";
import type { PlacementIntent } from "./types";

/**
 * แปลง PlacementIntent เป็น GameEvent ที่ reducer ยอมรับ
 * คืน null หากเป็น cancel (ผู้เรียกไม่ต้อง dispatch อะไร)
 */
export function intentToEvent(intent: PlacementIntent): GameEvent | null {
  switch (intent.kind) {
    case "place":
      return {
        type: "PLACE_ION",
        instanceId: intent.instanceId,
        slotId: intent.slotId,
      };
    case "move":
      return {
        type: "MOVE_ION",
        fromSlotId: intent.fromSlotId,
        toSlotId: intent.toSlotId,
      };
    case "remove":
      return {
        type: "REMOVE_ION",
        slotId: intent.slotId,
      };
    case "cancel":
      return null;
  }
}
