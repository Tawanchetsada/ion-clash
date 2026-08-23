import { MESSAGES } from "../../config/messages";
import { VisuallyHidden } from "../ui/VisuallyHidden";

export type ProgressStep = 1 | 2 | 3 | 4 | 5;

export type StepIndicatorProps = {
  current: ProgressStep | null;
};

const STEP_LABELS_TH = MESSAGES.ui.steps;

/**
 * แถบ 5 ขั้นที่อยู่บนหัวทุกหน้าระหว่างเล่น — คนละชุดกับ 9 สถานะของเครื่อง
 * โดยตั้งใจ (ดู progressStep ใน domain/game/selectors.ts)
 *
 * `aria-current="step"` ต้องมีอยู่ที่ขั้นเดียวเท่านั้น ไม่งั้น screen reader
 * จะไม่รู้ว่าผู้เล่นอยู่ตรงไหน — ข้อห้ามตรง ๆ ในหัวข้อกับดักของ Phase 5
 */
export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <ol aria-label={MESSAGES.ui.stepProgressLabel} className="flex items-center gap-2">
      {STEP_LABELS_TH.map((labelTh, index) => {
        const step = (index + 1) as ProgressStep;
        const isCurrent = step === current;
        const isDone = current !== null && step < current;

        return (
          <li key={step} className="flex items-center gap-2">
            <span
              aria-current={isCurrent ? "step" : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors duration-150 ${
                isCurrent
                  ? "bg-gold text-navy"
                  : isDone
                    ? "bg-blue text-white"
                    : "bg-navy/20 text-navy"
              }`}
            >
              <span aria-hidden="true">{step}</span>
              <VisuallyHidden>
                {labelTh}
                {isCurrent
                  ? MESSAGES.ui.stepCurrentSuffix
                  : isDone
                    ? MESSAGES.ui.stepDoneSuffix
                    : ""}
              </VisuallyHidden>
            </span>
            {index < STEP_LABELS_TH.length - 1 && (
              <span aria-hidden="true" className="h-0.5 w-4 bg-navy/20" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
