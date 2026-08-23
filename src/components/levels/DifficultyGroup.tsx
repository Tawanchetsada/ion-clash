import { useId } from "react";
import { LevelTile } from "./LevelTile";
import type { DifficultyGroupView } from "../../presentation/levels";

export type DifficultyGroupProps = {
  view: DifficultyGroupView;
  onOpenLevel: (levelId: number) => void;
};

/**
 * หนึ่งช่วงความยาก (10 ด่าน) พร้อมป้ายชื่อช่วง
 *
 * ใช้ grid ที่กำหนดจำนวนคอลัมน์ตายตัว ไม่ใช่ `flex-wrap` — เพราะ flex-wrap
 * ตัดสินจากความกว้างที่เหลือ ทำให้ได้ 9 ใบบรรทัดแรกและอีก 1 ใบตกไปบรรทัดสอง
 * อย่างที่เห็นในหน้าจริง ส่วน grid บังคับ 10 คอลัมน์เป๊ะตามเอกสาร UI หน้า 05
 * (บนจอแคบลดเหลือ 5 คอลัมน์ ซึ่งยังหาร 10 ลงตัวจึงได้สองแถวเต็มพอดี)
 */
export function DifficultyGroup({ view, onOpenLevel }: DifficultyGroupProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
    >
      <h3
        id={headingId}
        className="shrink-0 text-sm font-bold text-navy sm:w-20 sm:text-right"
      >
        {view.labelTh}
      </h3>

      <div className="grid min-w-0 flex-1 grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2">
        {view.levels.map((tile) => (
          <LevelTile key={tile.levelId} view={tile} onOpen={() => onOpenLevel(tile.levelId)} />
        ))}
      </div>
    </section>
  );
}
