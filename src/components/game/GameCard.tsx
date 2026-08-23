import { EquationView } from "./EquationView";
import { TONE_CLASS } from "./tone";
import type { FormulaAst } from "../../domain/chemistry/types";
import type { CardTone } from "../../presentation/cards";

export type GameCardFaceProps = {
  formula: FormulaAst;
  nameTh: string;
  /** "aq" หรือ "s" — แสดงเป็นป้ายเล็กใต้ชื่อ ตามการ์ดในเอกสาร UI หน้า 07–11 */
  phaseTh: string;
  tone: CardTone;
  /** ขนาดกะทัดรัดสำหรับแถบสมการที่มีการ์ดหลายใบเรียงกัน */
  size?: "md" | "sm";
  struck?: boolean;
};

/**
 * หน้าตาของการ์ดหนึ่งใบ — สูตร ชื่อไทย และป้ายสถานะ เรียงสามชั้นในกรอบเดียว
 *
 * แยกออกมาเป็นชิ้นเดียวเพราะเอกสาร UI (หน้า 07 · 09 · 10 · 11) ใช้การ์ดหน้าตา
 * เดียวกันทุกที่ ทั้งถาดไอออนตั้งต้น กล่องผลลัพธ์ แถบสมการ และหน้าสรุป
 * ถ้าปล่อยให้แต่ละหน้าวาดเอง สัดส่วนจะเพี้ยนกันทีละนิดจนดูไม่เหมือนเกมเดียวกัน
 *
 * สัดส่วนอ้างอิงจากเอกสาร UI คือกล่องเกือบจัตุรัส สูงกว่ากว้างเล็กน้อย
 * จึงกำหนดความกว้างขั้นต่ำไว้และให้ความสูงมาจากเนื้อหาสามชั้นเสมอ
 */
export function GameCardFace({
  formula,
  nameTh,
  phaseTh,
  tone,
  size = "md",
  struck = false,
}: GameCardFaceProps) {
  const isNeutral = tone === "neutral";

  return (
    <span
      className={`relative flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-card border-2 shadow-card transition-colors duration-150 ${
        TONE_CLASS[tone]
      } ${isNeutral ? "border-border" : "border-white/60"} ${
        size === "sm"
          ? "min-w-[3.75rem] px-2 py-1.5"
          : "min-w-[4.5rem] px-2.5 py-2 sm:min-w-[5rem] sm:px-3"
      } ${struck ? "opacity-60" : ""}`}
    >
      <EquationView
        ast={formula}
        className={`font-bold leading-none ${size === "sm" ? "text-base" : "text-xl sm:text-2xl"}`}
      />

      <span
        aria-hidden="true"
        className={`max-w-[7rem] truncate leading-tight opacity-90 ${
          size === "sm" ? "text-[8px]" : "text-[9px] sm:text-[10px]"
        }`}
      >
        {nameTh}
      </span>

      <span
        aria-hidden="true"
        className={`rounded-full px-1.5 leading-4 ${
          isNeutral ? "bg-navy/10" : "bg-black/20"
        } ${size === "sm" ? "text-[8px]" : "text-[9px]"}`}
      >
        ({phaseTh})
      </span>

      {/* ขีดทับแบบเส้นทแยงในกรอบการ์ด ตามเอกสาร UI หน้า 10 — ไม่ใช่ line-through
          ของตัวอักษร ซึ่งขีดทับแค่สูตรและมองแทบไม่เห็นบนพื้นสีเข้ม */}
      {struck && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="h-[3px] w-[140%] rotate-[-32deg] rounded-full bg-error shadow-[0_0_0_1px_rgba(255,255,255,0.6)]" />
        </span>
      )}
    </span>
  );
}
