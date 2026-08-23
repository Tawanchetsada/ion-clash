"use client";

import { useCallback, useState } from "react";
import { resolveIntent } from "./resolveIntent";
import type {
  DragHandlers,
  DragState,
  PlacementIntent,
  PlacementSource,
  PlacementTarget,
  TargetProps,
} from "./types";
import { usePointerDrag } from "./usePointerDrag";

export type UsePlacementOptions = {
  /** ผู้เรียกเป็นคน dispatch เข้า reducer เอง — hook ไม่รู้จัก reducer */
  onIntent: (intent: PlacementIntent) => void;
  /** ข้อความประกาศให้ screen reader — hook เรียก ผู้เรียกเป็นคนแสดง */
  announce?: (messageTh: string) => void;
  disabled?: boolean;
};

export type UsePlacement = {
  held: PlacementSource | null;
  isHeld(source: PlacementSource): boolean;
  /** ปลายทางที่กำลังเล็งอยู่ — ส่งต่อเป็น isDropTarget ของ IonSlot */
  activeTargetId: string | null;
  /** แตะการ์ด/ช่อง หรือกด Enter บนมัน */
  toggleHold(source: PlacementSource): void;
  /** แตะช่องปลายทาง หรือกด Enter บนช่องขณะถืออยู่ */
  activateTarget(target: PlacementTarget): void;
  cancel(): void; // Escape
  /** ผูกกับการ์ด/ช่องต้นทางเพื่อเปิดโหมดลาก */
  dragHandlersFor(source: PlacementSource): DragHandlers;
  /** ผูกกับ element ที่รับการวาง — ใส่ data-drop-target ให้อัตโนมัติ */
  targetPropsFor(target: PlacementTarget): TargetProps;
  dragging: DragState | null; // ให้ DragLayer ใช้
};

function areSourcesEqual(a: PlacementSource | null, b: PlacementSource | null): boolean {
  if (!a || !b) return false;
  if (a.kind === "card" && b.kind === "card") {
    return a.instanceId === b.instanceId;
  }
  if (a.kind === "slot" && b.kind === "slot") {
    return a.slotId === b.slotId;
  }
  return false;
}

/**
 * Hook เจ้าของสถานะการเลือกตัวเดียว (Single Source of Truth)
 * รองรับทั้งการแตะสองครั้ง (Tap-to-place), คีย์บอร์ด (Enter/Space), และลากวาง (Pointer Drag)
 */
export function usePlacement({
  onIntent,
  disabled = false,
}: UsePlacementOptions): UsePlacement {
  const [held, setHeld] = useState<PlacementSource | null>(null);

  const handleIntent = useCallback(
    (intent: PlacementIntent) => {
      onIntent(intent);
    },
    [onIntent],
  );

  const { dragging, dragHandlersFor } = usePointerDrag({
    onIntent: handleIntent,
    disabled,
    onDragStart: () => {
      // เมื่อเริ่มลาก ให้เคลียร์การถือด้วย tap/keyboard เพื่อไม่ให้สถานะซ้อนทับกัน
      setHeld(null);
    },
  });

  const isHeld = useCallback(
    (source: PlacementSource) => {
      if (disabled) return false;
      return areSourcesEqual(held, source);
    },
    [disabled, held],
  );

  const toggleHold = useCallback(
    (source: PlacementSource) => {
      if (disabled) return;
      setHeld((current) => {
        if (areSourcesEqual(current, source)) {
          // แตะซ้ำตัวเดิม = ยกเลิกการถือ
          return null;
        }
        // แตะตัวใหม่ = เปลี่ยนไปถือตัวใหม่
        return source;
      });
    },
    [disabled],
  );

  const activateTarget = useCallback(
    (target: PlacementTarget) => {
      if (disabled || !held) return;
      const intent = resolveIntent(held, target);
      setHeld(null);
      if (intent.kind !== "cancel") {
        onIntent(intent);
      }
    },
    [disabled, held, onIntent],
  );

  const cancel = useCallback(() => {
    if (disabled) return;
    setHeld(null);
  }, [disabled]);

  const targetPropsFor = useCallback((target: PlacementTarget): TargetProps => {
    if (target.kind === "slot") {
      return {
        "data-drop-target": "slot",
        "data-slot-id": target.slotId,
      };
    }
    return {
      "data-drop-target": "tray",
    };
  }, []);

  const activeTargetId =
    dragging && dragging.target && dragging.target.kind === "slot"
      ? dragging.target.slotId
      : null;

  return {
    held,
    isHeld,
    activeTargetId,
    toggleHold,
    activateTarget,
    cancel,
    dragHandlersFor,
    targetPropsFor,
    dragging,
  };
}
