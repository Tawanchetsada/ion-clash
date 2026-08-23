"use client";

import { MESSAGES } from "../../config/messages";
import type React from "react";
import type { IonCardView } from "../../presentation/cards";
import type { GameCardSize } from "./GameCard";
import { IonCard } from "./IonCard";
import { CloseIcon } from "../ui/Icon";

export type IonSlotProps = {
  slotId: string;
  slotLabelTh: string;
  /** บทบาทที่ช่องนี้รับ เช่น "ไอออนบวก" — แสดงในช่องว่างเพื่อกันวางสลับ */
  roleHintTh?: string | undefined;
  assignedIon: IonCardView | null;
  size?: GameCardSize | undefined;
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

/** ช่องว่างต้องสูงเท่าการ์ดที่จะมาวาง ไม่อย่างนั้นแถวจะกระตุกตอนวางไอออนลง */
const EMPTY_CLASS: Record<GameCardSize, string> = {
  sm: "min-h-[3.75rem] min-w-[3.75rem] gap-0.5 px-2 py-1.5 text-base",
  md: "min-h-[4.5rem] min-w-[4.5rem] gap-0.5 px-3 py-2 text-2xl sm:min-w-[5rem]",
  fluid:
    "h-[calc(var(--card-size,5rem)*0.95)] w-[var(--card-size,5rem)] gap-[0.05em] px-[0.18em] text-[calc(var(--card-size,5rem)*0.26)]",
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
  size = "md",
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
          size={size}
          selected={selected}
          disabled={disabled}
          isDragging={isDragging}
          onSelect={onSelect}
          onPointerDown={onPointerDown}
        />
        {/*
          ปุ่มนำออกเป็นไอคอนล้วน โดยข้อความเต็มอยู่ใน aria-label
          ชื่อช่องแบบเต็ม ("ช่องที่ 1 (ไอออนบวก คู่ที่ 1)") ยาวกว่าตัวการ์ดสามเท่า
          ถ้าพิมพ์ออกมาจริงมันจะดันความกว้างของทั้งแถวจนสมการหลุดออกนอกจอ
          ทั้งที่ผู้เล่นที่มองเห็นรู้อยู่แล้วว่ากดกากบาทใต้การ์ดใบไหน
        */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`${MESSAGES.ui.removeSlotPrefix}${slotLabelTh}`}
            title={`${MESSAGES.ui.removeSlotPrefix}${slotLabelTh}`}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-lg text-error transition-colors duration-150 hover:bg-error/10"
          >
            <CloseIcon />
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
      className={`flex touch-none select-none flex-col items-center justify-center rounded-card border-2 border-dashed text-navy/70 transition-colors duration-150 ${
        EMPTY_CLASS[size]
      } ${isDropTarget ? "scale-105 border-gold bg-gold/10" : "border-border"}`}
    >
      <span aria-hidden="true" className="text-[1em] font-bold leading-none">
        +
      </span>
      {/* บอกด้วยตาว่าช่องนี้รับไอออนบวกหรือลบ — ไม่ใช่รู้ได้เฉพาะ screen reader
          ผู้เล่นที่จับคู่ถูกแล้วแต่วางสลับช่องจะโดนตีว่าตอบผิดโดยไม่รู้สาเหตุ */}
      {roleHintTh && (
        <span aria-hidden="true" className="text-[0.42em] leading-tight">
          {roleHintTh}
        </span>
      )}
    </button>
  );
}
