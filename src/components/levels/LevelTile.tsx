import { MESSAGES } from "../../config/messages";
import { CheckIcon, LockIcon, PlayIcon, StarIcon } from "../ui/Icon";
import type { LevelStatus, LevelTileView } from "../../presentation/levels";

export type LevelTileProps = {
  view: LevelTileView;
  onOpen?: () => void;
};

const STATUS_CLASS: Readonly<Record<LevelStatus, string>> = {
  completed: "bg-gold text-navy",
  current: "bg-blue text-white ring-2 ring-navy",
  locked: "border border-border bg-panel text-navy/45",
};

function StatusIcon({ status }: { status: LevelStatus }) {
  if (status === "completed") return <CheckIcon className="text-[0.85em]" />;
  if (status === "current") return <PlayIcon className="text-[0.85em]" />;
  return <LockIcon className="text-[0.85em]" />;
}

/**
 * กระเบื้องด่านหนึ่งใบ — สามสถานะแยกกันด้วยสีและ**ไอคอน SVG** ไม่ใช่อิโมจิ
 *
 * ตัดข้อความสถานะที่เคยพิมพ์ใต้เลขด่านออก เพราะที่ 390px คำว่า "ยังไม่ปลดล็อก"
 * ยาวกว่าตัวกระเบื้องเอง ทำให้กระเบื้องกว้างจนเรียงได้ไม่ครบ 10 ใบต่อแถวตาม
 * เอกสาร UI หน้า 05 และตัวเลขด่านเล็กลงจนอ่านยาก
 *
 * ข้อความยังอยู่ครบใน `aria-label` — สถานะจึงยังสื่อด้วยสามทางตามข้อบังคับ
 * a11y คือสี ไอคอน และชื่อที่ screen reader อ่านออก ไม่ได้พึ่งสีอย่างเดียว
 */
export function LevelTile({ view, onOpen }: LevelTileProps) {
  const levelLabel = String(view.levelId).padStart(2, "0");
  const starsLabel = view.stars > 0 ? ` ${view.stars} ${MESSAGES.ui.starsSuffix}` : "";

  return (
    <button
      type="button"
      disabled={view.status === "locked"}
      onClick={onOpen}
      title={`${MESSAGES.ui.levelPrefix} ${levelLabel} — ${view.statusLabelTh}`}
      aria-label={`${MESSAGES.ui.levelPrefix} ${levelLabel} ${view.statusLabelTh}${starsLabel}`}
      className={`flex aspect-[5/4] min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-card shadow-card transition-transform duration-150 disabled:cursor-not-allowed enabled:hover:-translate-y-0.5 ${STATUS_CLASS[view.status]}`}
    >
      <span aria-hidden="true" className="text-base font-bold leading-none sm:text-lg">
        {levelLabel}
      </span>

      <span aria-hidden="true" className="flex items-center gap-0.5 text-xs leading-none">
        <StatusIcon status={view.status} />
        {view.status === "completed" && view.stars > 0 && (
          <span className="flex items-center">
            {Array.from({ length: view.stars }, (_, i) => (
              <StarIcon key={i} className="text-[0.7em]" />
            ))}
          </span>
        )}
      </span>
    </button>
  );
}
