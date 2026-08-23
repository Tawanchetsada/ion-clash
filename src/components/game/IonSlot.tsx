"use client";

import { IonCard } from "./IonCard";
import type { IonCardView } from "../../presentation/cards";

export type IonSlotProps = {
  slotId: string;
  slotLabelTh: string;
  assignedIon: IonCardView | null;
  isDropTarget?: boolean;
  disabled?: boolean;
  /** แตะช่องว่างเพื่อวาง — ใช้กับโหมด "แตะการ์ดแล้วแตะช่อง" ใน Phase 6 */
  onActivate?: () => void;
  onRemove?: () => void;
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
  onActivate,
  onRemove,
}: IonSlotProps) {
  if (assignedIon) {
    return (
      <div data-slot-id={slotId} className="flex flex-col items-center gap-1">
        <IonCard view={assignedIon} />
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
      data-slot-id={slotId}
      disabled={disabled}
      onClick={onActivate}
      aria-label={`${slotLabelTh} ว่าง`}
      className={`min-h-11 min-w-11 rounded-card border-2 border-dashed px-4 py-3 text-2xl font-bold text-navy/40 transition-colors duration-150 ${
        isDropTarget ? "border-gold bg-gold/10" : "border-border"
      }`}
    >
      +
    </button>
  );
}
