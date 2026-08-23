import { MESSAGES } from "../../config/messages";
import { EquationView } from "./EquationView";
import type { FormulaAst } from "../../domain/chemistry/types";

export type ProblemTerm = {
  formula: FormulaAst;
  /** "aq" หรือ "s" */
  phaseTh: string;
};

export type ProblemBarProps = {
  reactants: readonly ProblemTerm[];
  /** ไม่ส่งมา = ยังไม่เฉลย แสดงเป็น "?" ตามเอกสาร UI หน้า 06–07 */
  products?: readonly ProblemTerm[] | undefined;
};

/**
 * แถบโจทย์ประจำด่าน — สมการโมเลกุลของสารตั้งต้นที่ค้างอยู่บนหัวหน้าจอตลอดขั้นเล่น
 *
 * เอกสาร UI หน้า 07 วางแถบนี้ไว้เหนือถาดไอออนเสมอ และมีเหตุผลจริง: ระหว่างที่
 * ลากไอออนมาจับคู่ ผู้เล่นต้องมองย้อนได้ตลอดว่าโจทย์ให้สารอะไรมาบ้าง ถ้าไม่มี
 * แถบนี้ต้องจำเอาเองจากหน้าก่อน ซึ่งเป็นภาระความจำที่ไม่เกี่ยวกับสิ่งที่ต้องการวัด
 *
 * ผลิตภัณฑ์แสดงเป็น "?" จนกว่าจะถูกเฉลย — ห้ามส่ง `products` มาก่อนผ่านการตรวจ
 */
export function ProblemBar({ reactants, products }: ProblemBarProps) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
      <span className="shrink-0 text-xs font-semibold text-navy/70">
        {MESSAGES.ui.problemLabel}
      </span>

      <p
        aria-label={MESSAGES.ui.problemLabel}
        className="equation-scroll flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-card border-2 border-gold bg-white px-3 py-2 font-bold text-navy shadow-card sm:gap-2 sm:px-4 sm:text-lg"
      >
        <span className="flex min-w-max items-center gap-1.5 sm:gap-2">
          {reactants.map((term, index) => (
            <span key={index} className="flex items-center gap-1.5 sm:gap-2">
              {index > 0 && <span aria-hidden="true">+</span>}
              <EquationView ast={term.formula} />
              <span className="text-xs font-normal text-navy/70">({term.phaseTh})</span>
            </span>
          ))}

          <span aria-hidden="true" className="px-1">
            →
          </span>

          {products === undefined ? (
            <span aria-label={MESSAGES.ui.problemUnknown} className="text-gold">
              ?
            </span>
          ) : (
            products.map((term, index) => (
              <span key={index} className="flex items-center gap-1.5 sm:gap-2">
                {index > 0 && <span aria-hidden="true">+</span>}
                <EquationView ast={term.formula} />
                <span className="text-xs font-normal text-navy/70">({term.phaseTh})</span>
              </span>
            ))
          )}
        </span>
      </p>
    </div>
  );
}
