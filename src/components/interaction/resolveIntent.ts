import type { PlacementIntent, PlacementSource, PlacementTarget } from "./types";

/**
 * แปลง (ต้นทาง, ปลายทาง) เป็นเจตนา (PlacementIntent)
 *
 * ฟังก์ชันบริสุทธิ์ 100% ไม่มี DOM และไม่มี side effect
 * ปลายทางที่เป็น null หมายถึงปล่อยนอกเป้าหมาย
 */
export function resolveIntent(
  source: PlacementSource,
  target: PlacementTarget | null,
): PlacementIntent {
  if (!target) {
    return { kind: "cancel" };
  }

  if (source.kind === "card") {
    if (target.kind === "slot") {
      return {
        kind: "place",
        instanceId: source.instanceId,
        slotId: target.slotId,
      };
    }
    // card -> tray = ปล่อยกลับถาดเดิม
    return { kind: "cancel" };
  }

  // source.kind === "slot"
  if (target.kind === "tray") {
    return {
      kind: "remove",
      slotId: source.slotId,
    };
  }

  // target.kind === "slot"
  if (source.slotId === target.slotId) {
    return { kind: "cancel" };
  }

  return {
    kind: "move",
    fromSlotId: source.slotId,
    toSlotId: target.slotId,
  };
}
