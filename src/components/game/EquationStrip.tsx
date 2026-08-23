import { MESSAGES } from "../../config/messages";
import type React from "react";
import type { EquationCardView } from "../../presentation/cards";
import { EquationArrow } from "./EquationArrow";
import { GameCardFace } from "./GameCard";

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
 * แถบสมการไอออนิกที่ย่อการ์ดให้พอดีความกว้างของตัวเอง (ข้อ 5.5 — ห้ามทั้งหน้าเลื่อน)
 *
 * บนหน้าจอแนวนอน/จอใหญ่: แสดงเป็นแถวเดียวแนวนอน สารตั้งต้น → ผลิตภัณฑ์
 * บนหน้าจอแคบ/แนวตั้ง (มือถือ): พับเป็นสองชั้น (สารตั้งต้นบน · ลูกศรชี้ลง · ผลิตภัณฑ์ล่าง)
 * ตามรูปแบบเดียวกับขั้นที่ 2 ทำให้อ่านง่ายและแตะตัดไอออนได้สะดวกโดยไม่ต้องเลื่อนหน้าจอ
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
      className="equation-scroll fit-cards w-full min-w-0 flex items-center justify-center py-2"
    >
      <div
        ref={innerRef}
        className="fit-cards-track relative flex flex-col items-center justify-center gap-5 sm:gap-6 md:flex-row md:items-center md:gap-[calc(var(--card-size,5rem)*0.25)] py-10 sm:py-12 w-full"
      >
        {connector}

        {/* ฝั่งซ้าย (สารตั้งต้น) */}
        <div className="flex flex-wrap items-center justify-center gap-[calc(var(--card-size,5rem)*0.12)] rounded-card border border-navy/10 bg-canvas p-3 sm:p-4">
          {left.map((card, index) => (
            <EquationChip
              key={card.view.instanceId}
              card={card}
              showPlus={index < left.length - 1}
              registerCardRef={registerCardRef}
            />
          ))}
        </div>

        {/* ลูกศรคั่นกลาง — ชี้ลงเมื่อแนวตั้ง ชี้ขวาเมื่อแนวนอน */}
        <div className="flex items-center justify-center py-2 px-1 md:min-h-[calc(var(--card-size,5rem)*1.6)]">
          <EquationArrow breakpoint="md" className="text-gold" />
        </div>

        {/* ฝั่งขวา (ผลิตภัณฑ์) */}
        <div className="flex flex-wrap items-center justify-center gap-[calc(var(--card-size,5rem)*0.12)] rounded-card border border-border bg-panel p-3 sm:p-4">
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
      size="fluid"
      struck={struck}
    />
  );

  return (
    <span className="flex items-center gap-[calc(var(--card-size,5rem)*0.12)]">
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
        <span
          aria-hidden="true"
          className="text-[calc(var(--card-size,5rem)*0.28)] font-bold leading-none text-navy"
        >
          +
        </span>
      )}
    </span>
  );
}
