import { GameCardFace, type GameCardSize } from "./GameCard";
import type { CompoundCardView } from "../../presentation/cards";

export type CompoundCardProps = {
  view: CompoundCardView;
  size?: GameCardSize;
};

/** การ์ดสารประกอบ — แสดงอย่างเดียว ไม่ส่ง event ตาม Component Contract ในสเปก */
export function CompoundCard({ view, size }: CompoundCardProps) {
  return (
    <div role="group" aria-label={view.ariaLabel} className="inline-flex">
      <GameCardFace
        formula={view.formula}
        nameTh={view.nameTh}
        phaseTh={view.phaseTh}
        tone={view.tone}
        {...(size !== undefined ? { size } : {})}
      />
    </div>
  );
}
