"use client";

import { EquationView } from "./EquationView";
import { TONE_CLASS } from "./tone";
import type { IonCardView } from "../../presentation/cards";

export type IonCardProps = {
  view: IonCardView;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

/** การ์ดไอออนของสารตั้งต้น — รับ view model มาแสดง ไม่ตัดสินเคมีเอง */
export function IonCard({ view, selected = false, disabled = false, onSelect }: IonCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={onSelect ? selected : undefined}
      aria-label={view.ariaLabel}
      onClick={onSelect}
      className={`min-h-11 min-w-11 rounded-card px-3 py-2 text-lg font-bold shadow-card transition-colors duration-150 ${TONE_CLASS[view.tone]} ${
        selected ? "ring-4 ring-focus-ring" : ""
      }`}
    >
      <EquationView ast={view.formula} />
    </button>
  );
}
