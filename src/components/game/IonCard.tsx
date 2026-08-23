"use client";

import type React from "react";
import type { IonCardView } from "../../presentation/cards";
import { EquationView } from "./EquationView";
import { TONE_CLASS } from "./tone";

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
      className={`min-h-11 min-w-11 touch-none select-none rounded-card px-3 py-2 text-lg font-bold shadow-card transition-colors duration-150 ${
        TONE_CLASS[view.tone]
      } ${selected ? "ring-4 ring-focus-ring" : ""} ${
        isDragging ? "opacity-40" : "opacity-100"
      }`}
    >
      <EquationView ast={view.formula} />
    </button>
  );
}
