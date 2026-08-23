"use client";

import type React from "react";
import type { IonCardView } from "../../presentation/cards";
import { GameCardFace } from "./GameCard";

export type IonCardProps = {
  view: IonCardView;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
  isDragging?: boolean | undefined;
  onSelect?: (() => void) | undefined;
  onPointerDown?: ((e: React.PointerEvent<HTMLButtonElement>) => void) | undefined;
  style?: React.CSSProperties | undefined;
};

/** การ์ดไอออนของสารตั้งต้น — รับ view model มาแสดง ไม่ตัดสินเคมีเอง */
export function IonCard({
  view,
  selected = false,
  disabled = false,
  isDragging = false,
  onSelect,
  onPointerDown,
  style,
}: IonCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={onSelect ? selected : undefined}
      aria-label={view.ariaLabel}
      onClick={onSelect}
      onPointerDown={onPointerDown}
      style={style}
      className={`touch-none select-none rounded-card transition-transform duration-150 ${
        selected ? "ring-4 ring-focus-ring" : ""
      } ${isDragging ? "opacity-40" : "opacity-100"} ${
        onSelect && !disabled ? "hover:-translate-y-0.5" : ""
      }`}
    >
      <GameCardFace
        formula={view.formula}
        nameTh={view.nameTh}
        phaseTh={view.phaseTh}
        tone={view.tone}
      />
    </button>
  );
}
