"use client";

import { EquationView } from "./EquationView";
import { TONE_CLASS } from "./tone";
import type { EquationCardView } from "../../presentation/cards";

export type EquationStripCard = {
  view: EquationCardView;
  /** ตัดออกแล้ว (ไอออนผู้ชม) — เส้นขีดทับ + ต่อท้ายป้ายเสียง ไม่ใช่แค่สื่อด้วยสี */
  struck?: boolean;
  selected?: boolean;
  onSelect?: () => void;
};

export type EquationStripProps = {
  left: readonly EquationStripCard[];
  right: readonly EquationStripCard[];
};

/**
 * แถบสมการไอออนิกที่เลื่อนแนวนอนได้เฉพาะตัวมันเอง (ข้อ 5.5 — ห้ามทั้งหน้าเลื่อน)
 *
 * เส้นตัดไอออนผู้ชมจริง (SVG overlay) เป็นงานของ Phase 6 — ที่นี่ส่งมอบสถานะ
 * ภาพนิ่ง "ถูกตัดแล้ว" ที่ทดสอบได้และไม่ต้องรื้อเมื่อ Phase 6 มาวาดเส้นทับ
 *
 * `min-w-0` จำเป็นจริง ๆ ไม่ใช่แค่ safety class — component นี้เป็นลูกของ flex
 * container เสมอ (Section ในหน้าเกม, หรือแถวใดก็ตามที่ห่อมันไว้) และ flex item
 * ที่ไม่กำหนด min-width จะขอความกว้างเท่ากับผลรวมการ์ดทั้งหมดที่ไม่ตัดบรรทัด
 * (min-content) แม้จะมี overflow-x:auto กำกับไว้แล้วก็ตาม เคยเจอจริงตอนทดสอบ
 * ที่ 390px แล้วพบว่าทั้งหน้าเลื่อนแนวนอน ทั้งที่ตั้งใจให้เลื่อนเฉพาะแถบนี้แถบเดียว
 */
export function EquationStrip({ left, right }: EquationStripProps) {
  return (
    <div
      role="region"
      aria-label="สมการไอออนิก"
      tabIndex={0}
      className="equation-scroll min-w-0 flex items-center gap-2 rounded-card bg-panel p-4 shadow-card"
    >
      {left.map((card, index) => (
        <EquationChip key={card.view.instanceId} card={card} showPlus={index < left.length - 1} />
      ))}
      <span aria-hidden="true" className="px-2 text-xl text-navy">
        →
      </span>
      {right.map((card, index) => (
        <EquationChip
          key={card.view.instanceId}
          card={card}
          showPlus={index < right.length - 1}
        />
      ))}
    </div>
  );
}

function EquationChip({ card, showPlus }: { card: EquationStripCard; showPlus: boolean }) {
  const { view, struck = false, selected = false, onSelect } = card;
  const ariaLabel = struck ? `${view.ariaLabel} ถูกตัดออกแล้ว` : view.ariaLabel;

  const chip = (
    <span
      aria-label={onSelect ? undefined : ariaLabel}
      className={`inline-flex min-h-11 items-center rounded-card px-3 py-2 font-bold shadow-card transition-colors duration-150 ${TONE_CLASS[view.tone]} ${
        struck ? "line-through opacity-50" : ""
      } ${selected ? "ring-4 ring-focus-ring" : ""}`}
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
