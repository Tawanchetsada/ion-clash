export type HintButtonProps = {
  hintsUsed: number;
  /** เพดานคือ level.hints.length ไม่ใช่เลข 3 ที่ตายตัว (ดู domain/game/hints.ts) */
  maxHints: number;
  disabled?: boolean;
  onUseHint: () => void;
};

export function HintButton({ hintsUsed, maxHints, disabled = false, onUseHint }: HintButtonProps) {
  const remaining = Math.max(0, maxHints - hintsUsed);

  return (
    <button
      type="button"
      onClick={onUseHint}
      disabled={disabled || remaining === 0}
      className="min-h-11 min-w-11 rounded-card bg-gold px-4 py-2 font-bold text-navy shadow-card transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
    >
      คำใบ้ (เหลือ {remaining} ครั้ง)
    </button>
  );
}
