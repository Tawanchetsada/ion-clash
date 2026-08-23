"use client";

import { MESSAGES } from "../../config/messages";
import type React from "react";
import type { IonCardView } from "../../presentation/cards";
import { IonCard } from "./IonCard";

export type IonSlotProps = {
  slotId: string;
  slotLabelTh: string;
  /** บทบาทที่ช่องนี้รับ เช่น "ไอออนบวก" — แสดงในช่องว่างเพื่อกันวางสลับ */
  roleHintTh?: string | undefined;
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
  roleHintTh,
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
            {MESSAGES.ui.removeSlotPrefix}{slotLabelTh}
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
      aria-label={`${slotLabelTh} ${MESSAGES.ui.slotEmptySuffix}`}
      className={`flex min-h-[4.5rem] min-w-[4.5rem] touch-none select-none flex-col items-center justify-center gap-0.5 rounded-card border-2 border-dashed px-3 py-2 text-navy/70 transition-colors duration-150 sm:min-w-[5rem] ${
        isDropTarget ? "scale-105 border-gold bg-gold/10" : "border-border"
      }`}
    >
      <span aria-hidden="true" className="text-2xl font-bold leading-none">
        +
      </span>
      {/* บอกด้วยตาว่าช่องนี้รับไอออนบวกหรือลบ — ไม่ใช่รู้ได้เฉพาะ screen reader
          ผู้เล่นที่จับคู่ถูกแล้วแต่วางสลับช่องจะโดนตีว่าตอบผิดโดยไม่รู้สาเหตุ */}
      {roleHintTh && (
        <span aria-hidden="true" className="text-[10px] leading-tight">
          {roleHintTh}
        </span>
      )}
    </button>
  );
}
