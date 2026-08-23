import { EquationView } from "./EquationView";
import { TONE_CLASS } from "./tone";
import type { CompoundCardView } from "../../presentation/cards";

export type CompoundCardProps = {
  view: CompoundCardView;
};

/** การ์ดสารประกอบ — แสดงอย่างเดียว ไม่ส่ง event ตาม Component Contract ในสเปก */
export function CompoundCard({ view }: CompoundCardProps) {
  return (
    <div
      role="group"
      aria-label={view.ariaLabel}
      className={`flex flex-col items-center gap-1 rounded-card px-4 py-3 shadow-card ${TONE_CLASS[view.tone]}`}
    >
      <EquationView ast={view.formula} className="text-lg font-bold" />
      <span aria-hidden="true" className="text-xs font-normal">
        {view.nameTh}
      </span>
    </div>
  );
}
