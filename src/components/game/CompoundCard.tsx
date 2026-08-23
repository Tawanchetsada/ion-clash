import { GameCardFace } from "./GameCard";
import type { CompoundCardView } from "../../presentation/cards";

export type CompoundCardProps = {
  view: CompoundCardView;
};

/** การ์ดสารประกอบ — แสดงอย่างเดียว ไม่ส่ง event ตาม Component Contract ในสเปก */
export function CompoundCard({ view }: CompoundCardProps) {
  return (
    <div role="group" aria-label={view.ariaLabel} className="inline-flex">
      <GameCardFace
        formula={view.formula}
        nameTh={view.nameTh}
        phaseTh={view.phaseTh}
        tone={view.tone}
      />
    </div>
  );
}
