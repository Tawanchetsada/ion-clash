export type AppHeaderProps = {
  levelLabelTh?: string;
  onHome?: () => void;
  onHowToPlay?: () => void;
};

/**
 * แถบบนสุดของทุกหน้า — ตรา IC, เลขด่าน (ถ้ามี), ปุ่มหน้าหลัก/วิธีเล่น
 *
 * `flex-wrap` ที่ตัว header และการรวมป้ายด่าน+เมนูไว้ในกลุ่มเดียวกันจำเป็น
 * จริง ๆ — ทดสอบแล้วว่าที่ 390px (มือถือแนวตั้งขั้นต่ำตามสเปก) ถ้าจัดสามกลุ่ม
 * เรียงแถวเดียวแบบ justify-between เฉย ๆ ความกว้างรวมจะเกิน viewport แล้วดัน
 * ทั้งหน้าให้เลื่อนแนวนอน ซึ่งข้อ 5.5 ห้ามไว้ตรง ๆ
 */
export function AppHeader({ levelLabelTh, onHome, onHowToPlay }: AppHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 bg-navy px-4 py-3 text-white">
      <div className="flex items-center gap-2 font-bold">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm text-navy"
        >
          IC
        </span>
        <span>ION CLASH</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {levelLabelTh && (
          <span className="rounded-card bg-white/10 px-3 py-1 text-sm">{levelLabelTh}</span>
        )}

        <nav aria-label="เมนูหลัก" className="flex items-center gap-2">
          {onHome && (
            <button
              type="button"
              onClick={onHome}
              className="min-h-11 min-w-11 rounded-card px-3 py-2 text-sm hover:bg-white/10"
            >
              หน้าหลัก
            </button>
          )}
          {onHowToPlay && (
            <button
              type="button"
              onClick={onHowToPlay}
              className="min-h-11 min-w-11 rounded-card px-3 py-2 text-sm hover:bg-white/10"
            >
              วิธีเล่น
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
