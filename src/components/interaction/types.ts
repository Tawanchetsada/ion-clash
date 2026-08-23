import type React from "react";

/**
 * ชนิดข้อมูลสำหรับระบบ interaction ของการวางไอออน
 *
 * นิยามเฉพาะต้นทาง (source), ปลายทาง (target), และเจตนา (intent)
 * เป็นชั้นบริสุทธิ์ที่ไม่มี DOM และใช้ร่วมกันระหว่าง ลาก, แตะ, และคีย์บอร์ด
 */

export type PlacementSource =
  | { kind: "card"; instanceId: string }
  | { kind: "slot"; slotId: string; instanceId: string };

export type PlacementTarget =
  | { kind: "slot"; slotId: string }
  | { kind: "tray" }; // ถาดการ์ดต้นทาง — ลากกลับมาทิ้งเพื่อเอาออกจากช่อง

export type PlacementIntent =
  | { kind: "place"; instanceId: string; slotId: string }
  | { kind: "move"; fromSlotId: string; toSlotId: string }
  | { kind: "remove"; slotId: string }
  | { kind: "cancel" };

export type DragHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
};

export type TargetProps = {
  "data-drop-target": "slot" | "tray";
  "data-slot-id"?: string;
};

export type DragState = {
  source: PlacementSource;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  target: PlacementTarget | null;
};
