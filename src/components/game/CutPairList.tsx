import { MESSAGES } from "../../config/messages";

export type CutPairListProps = {
  pairLabelsTh: readonly string[];
};

/**
 * รายการข้อความของคู่ไอออนผู้ชมที่ตัดแล้ว — คู่กับเส้นตัด SVG ของ Phase 6 เสมอ
 * ตามข้อบังคับ a11y "เส้นตัดไอออนผู้ชมต้องมีรายการข้อความควบคู่ไปกับเส้น SVG"
 */
export function CutPairList({ pairLabelsTh }: CutPairListProps) {
  if (pairLabelsTh.length === 0) {
    return <p className="text-sm text-navy/70">{MESSAGES.ui.cutPairEmpty}</p>;
  }

  return (
    <ul aria-label={MESSAGES.ui.cutPairListLabel} className="list-disc space-y-1 pl-5 text-sm text-navy">
      {pairLabelsTh.map((label) => (
        <li key={label}>{label}</li>
      ))}
    </ul>
  );
}
