import { MESSAGES } from "../../config/messages";

export type AppHeaderProps = {
  levelLabelTh?: string;
  onHome?: () => void;
  onHowToPlay?: () => void;
};

/**
 * แถบบนสุดของทุกหน้า — ชื่อเกม เลขด่าน (ถ้ามี) และปุ่มหน้าหลัก/วิธีเล่น
 *
 * **ติดขอบบนตลอดการเลื่อน** (`sticky top-0`) เพราะปุ่มออกจากด่านกับปุ่มวิธีเล่น
 * อยู่บนแถบนี้ ถ้าเลื่อนแล้วหาย ผู้เล่นที่ติดกลางด่านบนมือถือจะต้องเลื่อนกลับ
 * ขึ้นไปสุดก่อนถึงจะออกได้ ซึ่งเป็นทางตันที่เจอบ่อยที่สุดของเกมบนจอเล็ก
 *
 * `flex-wrap` ที่ตัว header และการรวมป้ายด่าน+เมนูไว้ในกลุ่มเดียวกันจำเป็น
 * จริง ๆ — ทดสอบแล้วว่าที่ 390px (มือถือแนวตั้งขั้นต่ำตามสเปก) ถ้าจัดสามกลุ่ม
 * เรียงแถวเดียวแบบ justify-between เฉย ๆ ความกว้างรวมจะเกิน viewport แล้วดัน
 * ทั้งหน้าให้เลื่อนแนวนอน ซึ่งข้อ 5.5 ห้ามไว้ตรง ๆ
 */
export function AppHeader({ levelLabelTh, onHome, onHowToPlay }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-navy px-4 py-3 text-white shadow-card">
      <span className="text-lg font-bold tracking-wide">ION CLASH</span>

      <div className="flex flex-wrap items-center gap-2">
        {levelLabelTh && (
          <span className="rounded-card bg-white/10 px-3 py-1 text-sm">{levelLabelTh}</span>
        )}

        <nav aria-label={MESSAGES.ui.mainNav} className="flex items-center gap-2">
          {onHome && (
            <button
              type="button"
              onClick={onHome}
              className="min-h-11 min-w-11 rounded-card px-3 py-2 text-sm hover:bg-white/10"
            >
              {MESSAGES.ui.home}
            </button>
          )}
          {onHowToPlay && (
            <button
              type="button"
              onClick={onHowToPlay}
              className="min-h-11 min-w-11 rounded-card px-3 py-2 text-sm hover:bg-white/10"
            >
              {MESSAGES.ui.howToPlay}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
