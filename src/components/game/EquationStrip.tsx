import { MESSAGES } from "../../config/messages";
import type React from "react";
import type { EquationCardView } from "../../presentation/cards";
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
 * จำนวน "เท่าของความกว้างการ์ดหนึ่งใบ" ที่ทั้งแถวกินเมื่อวางเรียงกัน
 *
 * นับตรง ๆ ตามสิ่งที่วาดจริง: การ์ดใบละ 1 · เครื่องหมายบวกแต่ละตัวพร้อมช่องไฟ
 * สองข้าง 0.55 · ลูกศรตรงกลางอีก 0.95 แล้วเผื่อขอบไว้ 4% เพราะเส้นขอบการ์ด
 * และการปัดเศษของเบราว์เซอร์ทำให้ผลรวมจริงเกินที่คำนวณได้เล็กน้อยเสมอ
 *
 * ต้องคิดจากจำนวนการ์ดจริง ไม่ใช่ค่าคงที่ เพราะด่านที่สัมประสิทธิ์ไม่ใช่ 1
 * มีการ์ดมากกว่าด่านทั่วไป ถ้าใช้ตัวหารเดียวกันหมด ด่านยาวจะล้นและด่านสั้น
 * จะได้การ์ดเล็กเกินจำเป็น
 */
function fitUnits(cardCount: number): number {
  const plusCount = Math.max(cardCount - 2, 0);
  return (cardCount + plusCount * 0.55 + 0.95) * 1.04;
}

/**
 * แถบสมการไอออนิกที่ย่อการ์ดให้พอดีความกว้างของตัวเอง (ข้อ 5.5 — ห้ามทั้งหน้าเลื่อน)
 *
 * เดิมการ์ดมีขนาดตายตัวแล้วให้แถบเลื่อนแนวนอนเอา ซึ่งอ่านสมการไม่รู้เรื่อง:
 * ขั้นตัดไอออนผู้ชมบังคับให้เทียบไอออนซ้าย–ขวาว่าคู่ไหนเหมือนกัน ถ้าเห็นทีละครึ่ง
 * ต้องเลื่อนไป–กลับเพื่อจำ ตอนนี้จึงคำนวณขนาดการ์ดจากความกว้างแถบและจำนวนการ์ด
 * ให้ทั้งสมการอยู่ในสายตาเดียวกัน
 *
 * มีชั้นใน relative กว้างเท่าเนื้อหา เพื่อให้ SVG overlay เลื่อนตามการ์ดได้อัตโนมัติ
 * โดยที่ root ยังคง `min-w-0` เพื่อไม่ให้ดันหน้าจอจนเกิด horizontal scroll
 * และยังคง `equation-scroll` ไว้เป็นทางหนีทีไล่สำหรับจอที่แคบจนย่อต่อไม่ได้แล้ว
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
      className="equation-scroll fit-cards min-w-0 flex items-center rounded-card bg-panel p-4 shadow-card"
    >
      <div
        ref={innerRef}
        className="fit-cards-line relative flex min-w-max items-center gap-[calc(var(--card-size,5rem)*0.12)] py-7"
        style={{ "--fit-units": fitUnits(left.length + right.length) } as React.CSSProperties}
      >
        {connector}
        {left.map((card, index) => (
          <EquationChip
            key={card.view.instanceId}
            card={card}
            showPlus={index < left.length - 1}
            registerCardRef={registerCardRef}
          />
        ))}
        <span
          aria-hidden="true"
          className="px-[calc(var(--card-size,5rem)*0.1)] text-[calc(var(--card-size,5rem)*0.34)] font-bold leading-none text-navy"
        >
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
