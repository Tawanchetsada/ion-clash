import type { ReactNode } from "react";
import type { FormulaAst } from "../../domain/chemistry/types";

export type EquationViewProps = {
  ast: FormulaAst;
  /**
   * ป้ายเสียงภาษาไทย — ใส่เมื่อ EquationView ยืนเดี่ยว (เช่นในแถบสมการ)
   * ละไว้เมื่อถูกครอบด้วย element ที่มี aria-label ของตัวเองอยู่แล้ว
   * (เช่นในปุ่ม IonCard) กันไม่ให้ screen reader อ่านซ้ำสองรอบ
   */
  ariaLabel?: string;
  className?: string;
};

/**
 * render สูตรเคมีจาก AST เป็น <sub>/<sup> จริง — ห้าม parse หรือ
 * dangerouslySetInnerHTML ตามข้อห้ามของสเปก
 */
export function EquationView({ ast, ariaLabel, className }: EquationViewProps) {
  const glyphs: ReactNode = ast.map((part, index) => {
    if (part.kind === "sub") return <sub key={index}>{part.value}</sub>;
    if (part.kind === "sup") return <sup key={index}>{part.value}</sup>;
    return <span key={index}>{part.value}</span>;
  });

  if (ariaLabel === undefined) {
    return (
      <span aria-hidden="true" className={className}>
        {glyphs}
      </span>
    );
  }

  return (
    <span aria-label={ariaLabel} className={className}>
      <span aria-hidden="true">{glyphs}</span>
    </span>
  );
}
