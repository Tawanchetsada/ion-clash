import Link from "next/link";
import { MESSAGES } from "../../config/messages";
import { SettingsIcon } from "../ui/Icon";

export type AppHeaderProps = {
  levelLabelTh?: string;
  onHome?: () => void;
  onHowToPlay?: () => void;
  /** ซ่อนปุ่มตั้งค่า — ใช้เฉพาะหน้าคลัง component ที่ไม่มี router จริง */
  hideSettings?: boolean;
};

/**
 * แถบบนสุดของทุกหน้า — ชื่อเกม เลขด่าน (ถ้ามี) ปุ่มหน้าหลัก/วิธีเล่น และปุ่มตั้งค่า
 *
 * **ติดขอบบนตลอดการเลื่อน** (`sticky top-0`) เพราะปุ่มออกจากด่านกับปุ่มวิธีเล่น
 * อยู่บนแถบนี้ ถ้าเลื่อนแล้วหาย ผู้เล่นที่ติดกลางด่านบนมือถือจะต้องเลื่อนกลับ
 * ขึ้นไปสุดก่อนถึงจะออกได้ ซึ่งเป็นทางตันที่เจอบ่อยที่สุดของเกมบนจอเล็ก
 *
 * ปุ่มตั้งค่าเป็น `<Link>` ตรง ๆ ไม่ผ่าน prop เหมือนอีกสองปุ่ม เพราะทุกหน้า
 * ต้องไปหน้าตั้งค่าได้เหมือนกันหมดโดยไม่มีหน้าไหนอยากดักเปลี่ยนพฤติกรรม
 * ถ้าทำเป็น prop จะต้องไล่ส่ง handler เดิมซ้ำกันทั้ง 12 หน้าแล้วมีวันที่ลืมสักหน้า
 * ออกกลางด่านแล้วกลับเข้ามาใหม่ได้เพราะ checkpoint ถูกบันทึกไว้อยู่แล้ว
 *
 * `flex-wrap` ที่ตัว header และการรวมป้ายด่าน+เมนูไว้ในกลุ่มเดียวกันจำเป็น
 * จริง ๆ — ทดสอบแล้วว่าที่ 390px (มือถือแนวตั้งขั้นต่ำตามสเปก) ถ้าจัดสามกลุ่ม
 * เรียงแถวเดียวแบบ justify-between เฉย ๆ ความกว้างรวมจะเกิน viewport แล้วดัน
 * ทั้งหน้าให้เลื่อนแนวนอน ซึ่งข้อ 5.5 ห้ามไว้ตรง ๆ
 */
export function AppHeader({
  levelLabelTh,
  onHome,
  onHowToPlay,
  hideSettings = false,
}: AppHeaderProps) {
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
          {!hideSettings && (
            // ไอคอนอย่างเดียวบนจอแคบ แต่ยังมีคำว่า "ตั้งค่า" ตั้งแต่ sm ขึ้นไป
            // เพราะรูปเฟืองอย่างเดียวไม่ใช่สิ่งที่นักเรียน ม.4 ทุกคนอ่านออกทันที
            <Link
              href="/settings"
              aria-label={MESSAGES.ui.settings}
              title={MESSAGES.ui.settings}
              className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-card px-3 py-2 text-sm hover:bg-white/10"
            >
              <SettingsIcon className="text-base" />
              <span aria-hidden="true" className="hidden sm:inline">
                {MESSAGES.ui.settings}
              </span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
