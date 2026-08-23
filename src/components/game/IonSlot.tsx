"use client";

import type React from "react";
import type { IonCardView } from "../../presentation/cards";
import { IonCard } from "./IonCard";

export type IonSlotProps = {
  slotId: string;
  slotLabelTh: string;
  assignedIon: IonCardView | null;
  isDropTarget?: boolean | undefined;
  disabled?: boolean | undefined;
  selected?: boolean | undefined;
  isDragging?: boolean | undefined;
  /** แตะช่องว่างเพื่อวาง — ใช้กับโหมด "แตะการ์ดแล้วแตะช่อง" ใน Phase 6 */
  onActivate?: (() => void) | undefined;
  onRemove?: (() => void) | undefined;
  onSelect?: (() => void) | undefined;
  onPointerDown?: ((e: React.PointerEvent<HTMLButtonElement>) => void) | undefined;
};

/**
 * ช่องรับไอออนหนึ่งช่อง — รับ prop มาแสดงและส่ง event อย่างเดียว
 * ไม่ตัดสินเองว่าวางถูกหรือผิด ตาม Component Contract ในสเปก
 */
export function IonSlot({
  slotId,
  slotLabelTh,
  assignedIon,
  isDropTarget = false,
  disabled = false,
  selected = false,
  isDragging = false,
  onActivate,
  onRemove,
  onSelect,
  onPointerDown,
}: IonSlotProps) {
  if (assignedIon) {
    return (
      <div
        data-drop-target="slot"
        data-slot-id={slotId}
        className="flex flex-col items-center gap-1"
      >
        <IonCard
          view={assignedIon}
          selected={selected}
          disabled={disabled}
          isDragging={isDragging}
          onSelect={onSelect}
          onPointerDown={onPointerDown}
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="min-h-11 min-w-11 text-sm text-error underline"
          >
            นำออกจาก{slotLabelTh}
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-drop-target="slot"
      data-slot-id={slotId}
      disabled={disabled}
      onClick={onActivate}
      aria-label={`${slotLabelTh} ว่าง`}
      className={`min-h-11 min-w-11 touch-none select-none rounded-card border-2 border-dashed px-4 py-3 text-2xl font-bold text-navy/40 transition-colors duration-150 ${
        isDropTarget ? "border-gold bg-gold/10 scale-105" : "border-border"
      }`}
    >
      +
    </button>
  );
}
