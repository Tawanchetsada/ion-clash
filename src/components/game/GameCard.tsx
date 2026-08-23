import { EquationView } from "./EquationView";
import { TONE_CLASS } from "./tone";
import type { FormulaAst } from "../../domain/chemistry/types";
import type { CardTone } from "../../presentation/cards";

/**
 * `fluid` = ความกว้างมาจากตัวแปร `--card-size` ที่ `.fit-cards-track` คำนวณให้
 * ตามความกว้างของกล่องแม่ (ดู globals.css) ตัวอักษรทุกชั้นในการ์ดผูกกับ
 * `font-size` ของการ์ดด้วยหน่วย em การ์ดจึงย่อ–ขยายทั้งใบเป็นสัดส่วนเดิมเสมอ
 */
export type GameCardSize = "md" | "sm" | "fluid";

export type GameCardFaceProps = {
  formula: FormulaAst;
  nameTh: string;
  /** "aq" หรือ "s" — แสดงเป็นป้ายเล็กใต้ชื่อ ตามการ์ดในเอกสาร UI หน้า 07–11 */
  phaseTh: string;
  tone: CardTone;
  /** ขนาดกะทัดรัดสำหรับแถบสมการที่มีการ์ดหลายใบเรียงกัน */
  size?: GameCardSize;
  struck?: boolean;
};

const SIZE_CLASS: Record<GameCardSize, {
  box: string;
  formula: string;
  name: string;
  phase: string;
}> = {
  sm: {
    box: "min-w-[3.75rem] gap-0.5 px-2 py-1.5",
    formula: "text-base",
    name: "max-w-[7rem] text-[8px]",
    phase: "px-1.5 text-[8px] leading-4",
  },
  md: {
    box: "min-w-[4.5rem] gap-0.5 px-2.5 py-2 sm:min-w-[5rem] sm:px-3",
    formula: "text-xl sm:text-2xl",
    name: "max-w-[7rem] text-[9px] sm:text-[10px]",
    phase: "px-1.5 text-[9px] leading-4",
  },
  fluid: {
    box:
      "h-[calc(var(--card-size,5rem)*0.95)] w-[var(--card-size,5rem)] gap-[0.05em] px-[0.18em] text-[calc(var(--card-size,5rem)*0.26)]",
    formula: "text-[1em]",
    name: "max-w-full text-[0.46em]",
    phase: "px-[0.5em] text-[0.44em] leading-[1.5]",
  },
};

/**
 * หน้าตาของการ์ดหนึ่งใบ — สูตร ชื่อไทย และป้ายสถานะ เรียงสามชั้นในกรอบเดียว
 *
 * แยกออกมาเป็นชิ้นเดียวเพราะเอกสาร UI (หน้า 07 · 09 · 10 · 11) ใช้การ์ดหน้าตา
 * เดียวกันทุกที่ ทั้งถาดไอออนตั้งต้น กล่องผลลัพธ์ แถบสมการ และหน้าสรุป
 * ถ้าปล่อยให้แต่ละหน้าวาดเอง สัดส่วนจะเพี้ยนกันทีละนิดจนดูไม่เหมือนเกมเดียวกัน
 *
 * สัดส่วนอ้างอิงจากเอกสาร UI คือกล่องเกือบจัตุรัส สูงกว่ากว้างเล็กน้อย
 * จึงกำหนดความกว้างไว้และให้ความสูงมาจากเนื้อหาสามชั้นเสมอ
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
  const sizeClass = SIZE_CLASS[size];

  return (
    <span
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-card border-2 shadow-card transition-colors duration-150 ${
        TONE_CLASS[tone]
      } ${isNeutral ? "border-border" : "border-white/60"} ${sizeClass.box} ${
        struck ? "opacity-60" : ""
      }`}
    >
      <EquationView ast={formula} className={`font-bold leading-none ${sizeClass.formula}`} />

      <span
        aria-hidden="true"
        className={`truncate leading-tight opacity-90 ${sizeClass.name}`}
      >
        {nameTh}
      </span>

      <span
        aria-hidden="true"
        className={`rounded-full ${isNeutral ? "bg-navy/10" : "bg-black/20"} ${sizeClass.phase}`}
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
