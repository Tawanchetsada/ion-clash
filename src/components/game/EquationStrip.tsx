"use client";

import type React from "react";
import type { EquationCardView } from "../../presentation/cards";
import { EquationView } from "./EquationView";
import { TONE_CLASS } from "./tone";

export type EquationStripCard = {
  view: EquationCardView;
  /** ตัดออกแล้ว (ไอออนผู้ชม) — เส้นขีดทับ + ต่อท้ายป้ายเสียง ไม่ใช่แค่สื่อด้วยสี */
  struck?: boolean | undefined;
  selected?: boolean | undefined;
  onSelect?: (() => void) | undefined;
};

export type EquationStripProps = {
  left: readonly EquationStripCard[];
  right: readonly EquationStripCard[];
  connector?: React.ReactNode | undefined;
  innerRef?: React.Ref<HTMLDivElement> | undefined;
  registerCardRef?: ((instanceId: string, el: HTMLElement | null) => void) | undefined;
};

/**
 * แถบสมการไอออนิกที่เลื่อนแนวนอนได้เฉพาะตัวมันเอง (ข้อ 5.5 — ห้ามทั้งหน้าเลื่อน)
 *
 * มีชั้นใน relative กว้างเท่าเนื้อหา เพื่อให้ SVG overlay เลื่อนตามการ์ดได้อัตโนมัติ
 * โดยที่ root ยังคง `min-w-0` เพื่อไม่ให้ดันหน้าจอจนเกิด horizontal scroll
 */
export function EquationStrip({
  left,
  right,
  connector,
  innerRef,
  registerCardRef,
}: EquationStripProps) {
  return (
    <div
      role="region"
      aria-label="สมการไอออนิก"
      tabIndex={0}
      className="equation-scroll min-w-0 flex items-center rounded-card bg-panel p-4 shadow-card"
    >
      <div ref={innerRef} className="relative flex min-w-max items-center gap-2">
        {connector}
        {left.map((card, index) => (
          <EquationChip
            key={card.view.instanceId}
            card={card}
            showPlus={index < left.length - 1}
            registerCardRef={registerCardRef}
          />
        ))}
        <span aria-hidden="true" className="px-2 text-xl text-navy">
          →
        </span>
        {right.map((card, index) => (
          <EquationChip
            key={card.view.instanceId}
            card={card}
            showPlus={index < right.length - 1}
            registerCardRef={registerCardRef}
          />
        ))}
      </div>
    </div>
  );
}

function EquationChip({
  card,
  showPlus,
  registerCardRef,
}: {
  card: EquationStripCard;
  showPlus: boolean;
  registerCardRef?: ((instanceId: string, el: HTMLElement | null) => void) | undefined;
}) {
  const { view, struck = false, selected = false, onSelect } = card;
  const ariaLabel = struck ? `${view.ariaLabel} ถูกตัดออกแล้ว` : view.ariaLabel;

  const chip = (
    <span
      ref={registerCardRef ? (el) => registerCardRef(view.instanceId, el) : undefined}
      aria-label={onSelect ? undefined : ariaLabel}
      className={`inline-flex min-h-11 items-center rounded-card px-3 py-2 font-bold shadow-card transition-colors duration-150 ${
        TONE_CLASS[view.tone]
      } ${struck ? "line-through opacity-50" : ""} ${
        selected ? "ring-4 ring-focus-ring" : ""
      }`}
    >
      <EquationView ast={view.formula} />
    </span>
  );

  return (
    <span className="flex items-center gap-2">
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={ariaLabel}
          className="rounded-card"
        >
          {chip}
        </button>
      ) : (
        chip
      )}
      {showPlus && (
        <span aria-hidden="true" className="text-navy">
          +
        </span>
      )}
    </span>
  );
}
