import { MESSAGES } from "../../config/messages";
import type React from "react";
import type { EquationCardView } from "../../presentation/cards";
import { GameCardFace } from "./GameCard";

export type EquationStripCard = {
  view: EquationCardView;
  /** ตัดออกแล้ว (ไอออนตัวประกอบ) — เส้นขีดทับ + ต่อท้ายป้ายเสียง ไม่ใช่แค่สื่อด้วยสี */
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
      aria-label={MESSAGES.ui.equationRegionLabel}
      tabIndex={0}
      className="equation-scroll min-w-0 flex items-center rounded-card bg-panel p-4 shadow-card"
    >
      <div ref={innerRef} className="relative flex min-w-max items-center gap-2 py-7">
        {connector}
        {left.map((card, index) => (
          <EquationChip
            key={card.view.instanceId}
            card={card}
            showPlus={index < left.length - 1}
            registerCardRef={registerCardRef}
          />
        ))}
        <span aria-hidden="true" className="px-2 text-2xl font-bold text-navy">
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
  const ariaLabel = struck ? `${view.ariaLabel} ${MESSAGES.ui.struckSuffix}` : view.ariaLabel;

  const face = (
    <GameCardFace
      formula={view.formula}
      nameTh={view.nameTh}
      phaseTh={view.phaseTh}
      tone={view.tone}
      struck={struck}
    />
  );

  return (
    <span className="flex items-center gap-2">
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={ariaLabel}
          ref={registerCardRef ? (el) => registerCardRef(view.instanceId, el) : undefined}
          className={`rounded-card transition-transform duration-150 hover:-translate-y-0.5 ${
            selected ? "ring-4 ring-focus-ring" : ""
          }`}
        >
          {face}
        </button>
      ) : (
        <span
          ref={registerCardRef ? (el) => registerCardRef(view.instanceId, el) : undefined}
          aria-label={ariaLabel}
          role="img"
          className="inline-flex rounded-card"
        >
          {face}
        </span>
      )}
      {showPlus && (
        <span aria-hidden="true" className="text-lg font-bold text-navy">
          +
        </span>
      )}
    </span>
  );
}
