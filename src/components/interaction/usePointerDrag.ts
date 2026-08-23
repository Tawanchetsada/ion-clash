"use client";

import { useCallback, useRef, useState } from "react";
import { resolveIntent } from "./resolveIntent";
import type {
  DragHandlers,
  DragState,
  PlacementIntent,
  PlacementSource,
  PlacementTarget,
} from "./types";

const DRAG_THRESHOLD_PX = 8;

export type UsePointerDragOptions = {
  onIntent: (intent: PlacementIntent) => void;
  onDragStart?: () => void;
  disabled?: boolean;
};

export type UsePointerDrag = {
  dragging: DragState | null;
  dragHandlersFor: (source: PlacementSource) => DragHandlers;
};

function getDropTargetFromPoint(x: number, y: number): PlacementTarget | null {
  if (typeof document === "undefined") return null;
  const element = document.elementFromPoint(x, y);
  if (!element) return null;

  const targetEl = element.closest("[data-drop-target]");
  if (!targetEl) return null;

  const dropType = targetEl.getAttribute("data-drop-target");
  if (dropType === "tray") {
    return { kind: "tray" };
  }

  if (dropType === "slot") {
    const slotId = targetEl.getAttribute("data-slot-id");
    if (slotId) {
      return { kind: "slot", slotId };
    }
  }

  return null;
}

/**
 * Hook จัดการ Pointer Events สำหรับการลากวาง
 * - Threshold 8px เพื่อไม่ให้กวนการแตะธรรมดา
 * - setPointerCapture เพื่อไม่ให้ event หลุดตอนลากเร็ว
 * - หาเป้าหมายด้วย document.elementFromPoint
 */
export function usePointerDrag({
  onIntent,
  onDragStart,
  disabled = false,
}: UsePointerDragOptions): UsePointerDrag {
  const [dragging, setDragging] = useState<DragState | null>(null);
  const activePointerRef = useRef<{
    pointerId: number;
    source: PlacementSource;
    startX: number;
    startY: number;
    isDragging: boolean;
  } | null>(null);

  const handlePointerDown = useCallback(
    (source: PlacementSource, e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;

      const pointerId = e.pointerId;
      const startX = e.clientX;
      const startY = e.clientY;

      activePointerRef.current = {
        pointerId,
        source,
        startX,
        startY,
        isDragging: false,
      };

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(pointerId);
      } catch {
        // Ignored in environments where setPointerCapture is mocked or unsupported
      }
    },
    [disabled],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const active = activePointerRef.current;
      if (!active || active.pointerId !== e.pointerId) return;

      const currentX = e.clientX;
      const currentY = e.clientY;
      const distance = Math.hypot(currentX - active.startX, currentY - active.startY);

      if (!active.isDragging) {
        if (distance >= DRAG_THRESHOLD_PX) {
          active.isDragging = true;
          onDragStart?.();
        } else {
          return;
        }
      }

      const target = getDropTargetFromPoint(currentX, currentY);

      setDragging({
        source: active.source,
        startX: active.startX,
        startY: active.startY,
        currentX,
        currentY,
        target,
      });
    },
    [onDragStart],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const active = activePointerRef.current;
      if (!active || active.pointerId !== e.pointerId) return;

      if (active.isDragging) {
        const target = getDropTargetFromPoint(e.clientX, e.clientY);
        const intent = resolveIntent(active.source, target);
        setDragging(null);
        if (intent.kind !== "cancel") {
          onIntent(intent);
        }
      }

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(active.pointerId);
      } catch {
        // Ignored
      }

      activePointerRef.current = null;
    },
    [onIntent],
  );

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    const active = activePointerRef.current;
    if (!active || active.pointerId !== e.pointerId) return;

    setDragging(null);
    activePointerRef.current = null;
  }, []);

  const dragHandlersFor = useCallback(
    (source: PlacementSource): DragHandlers => {
      return {
        onPointerDown: (e: React.PointerEvent) => {
          handlePointerDown(source, e);

          const onMove = (moveEvt: PointerEvent) => {
            if (activePointerRef.current?.pointerId === moveEvt.pointerId) {
              handlePointerMove(moveEvt as unknown as React.PointerEvent);
            }
          };

          const onUp = (upEvt: PointerEvent) => {
            if (activePointerRef.current?.pointerId === upEvt.pointerId) {
              handlePointerUp(upEvt as unknown as React.PointerEvent);
              window.removeEventListener("pointermove", onMove);
              window.removeEventListener("pointerup", onUp);
              window.removeEventListener("pointercancel", onCancel);
            }
          };

          const onCancel = (cancelEvt: PointerEvent) => {
            if (activePointerRef.current?.pointerId === cancelEvt.pointerId) {
              handlePointerCancel(cancelEvt as unknown as React.PointerEvent);
              window.removeEventListener("pointermove", onMove);
              window.removeEventListener("pointerup", onUp);
              window.removeEventListener("pointercancel", onCancel);
            }
          };

          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onCancel);
        },
      };
    },
    [handlePointerCancel, handlePointerDown, handlePointerMove, handlePointerUp],
  );

  return {
    dragging,
    dragHandlersFor,
  };
}
