"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { DragState, PlacementSource } from "./types";

export type DragLayerProps = {
  dragging: DragState | null;
  renderGhost: (source: PlacementSource) => ReactNode;
};

const emptySubscribe = () => () => {};

/**
 * DragLayer เรนเดอร์ ghost preview ของการ์ดที่กำลังลากผ่าน Portal ไปยัง document.body
 * - มี pointer-events: none เสมอ เพื่อไม่ให้บัง document.elementFromPoint
 * - ป้องกัน SSR ด้วย useSyncExternalStore
 */
export function DragLayer({ dragging, renderGhost }: DragLayerProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isMounted || !dragging || typeof document === "undefined") {
    return null;
  }

  const { source, currentX, currentY } = dragging;

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        transform: `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <div className="opacity-90 shadow-2xl scale-105 transition-transform duration-75">
        {renderGhost(source)}
      </div>
    </div>,
    document.body,
  );
}
