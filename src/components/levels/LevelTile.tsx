import type { LevelStatus, LevelTileView } from "../../presentation/levels";

export type LevelTileProps = {
  view: LevelTileView;
  onOpen?: () => void;
};

const STATUS_ICON_TH: Readonly<Record<LevelStatus, string>> = {
  completed: "✓",
  current: "▶",
  locked: "🔒",
};

const STATUS_CLASS: Readonly<Record<LevelStatus, string>> = {
  completed: "bg-gold text-navy",
  current: "bg-blue text-white",
  locked: "border border-border bg-panel text-navy/50",
};

/**
 * กระเบื้องด่านหนึ่งใบ — สามสถานะต้องแยกกันด้วยทั้งสีและสัญลักษณ์ (ไอคอน + ข้อความ)
 * ไม่ใช่สีอย่างเดียว ตามข้อบังคับ a11y ของหน้าเลือกด่าน
 */
export function LevelTile({ view, onOpen }: LevelTileProps) {
  const levelLabel = String(view.levelId).padStart(2, "0");
  const starsLabel = view.stars > 0 ? ` ${view.stars} ดาว` : "";

  return (
    <button
      type="button"
      disabled={view.status === "locked"}
      onClick={onOpen}
      aria-label={`ด่าน ${levelLabel} ${view.statusLabelTh}${starsLabel}`}
      className={`flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-card px-2 py-3 shadow-card transition-colors duration-150 disabled:cursor-not-allowed ${STATUS_CLASS[view.status]}`}
    >
      <span aria-hidden="true" className="text-base font-bold">
        {levelLabel}
      </span>
      <span aria-hidden="true" className="text-[10px] font-normal">
        {STATUS_ICON_TH[view.status]} {view.statusLabelTh}
      </span>
    </button>
  );
}
