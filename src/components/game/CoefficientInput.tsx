import { MESSAGES } from "../../config/messages";
import { useId } from "react";
import type { ChangeEvent } from "react";

export type CoefficientInputProps = {
  value: number | null;
  compoundLabelTh: string;
  errorTh?: string;
  hideLabel?: boolean;
  size?: "md" | "sm";
  onChange: (value: number | null) => void;
};

/**
 * ช่องกรอกสัมประสิทธิ์หน้าสูตร — กติกาตามข้อ 5.4 ของสเปก
 *
 * รับเฉพาะจำนวนเต็มบวก 1-9 หลักเดียว (สัมประสิทธิ์จริงในชุดด่านสูงสุดคือ 6
 * ดู development-plan/05-phase-4-game-state.md) คีย์ที่ไม่ผ่านจะถูกเมิน — ไม่เรียก
 * onChange เลย แล้วปล่อยให้ React sync ค่าที่แสดงกลับไปตาม prop `value` เดิม
 * ตามกลไก controlled input มาตรฐาน ไม่ต้องมี state ภายในซ้ำซ้อน
 */
export function CoefficientInput({
  value,
  compoundLabelTh,
  errorTh,
  hideLabel = false,
  size = "md",
  onChange,
}: CoefficientInputProps) {
  const inputId = useId();
  const errorId = useId();

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const raw = event.target.value.trim();
    if (raw === "") {
      onChange(null);
      return;
    }
    if (/^[1-9]$/.test(raw)) {
      onChange(Number(raw));
    }
  }

  const sizeClasses =
    size === "sm"
      ? "h-9 w-9 sm:h-10 sm:w-10 text-base sm:text-lg"
      : "h-11 w-11 text-lg";

  return (
    <div className="flex flex-col items-center gap-1">
      <label
        htmlFor={inputId}
        className={`text-sm text-navy ${hideLabel ? "sr-only" : ""}`}
      >
        {MESSAGES.ui.coefficientLabelPrefix} {compoundLabelTh}
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value ?? ""}
        onChange={handleChange}
        placeholder="1"
        aria-invalid={errorTh ? true : undefined}
        aria-describedby={errorTh ? errorId : undefined}
        className={`${sizeClasses} rounded-card border bg-white text-center font-bold text-navy shadow-xs transition-all focus:border-gold focus:ring-2 focus:ring-gold/30 ${
          errorTh ? "border-error" : "border-border"
        }`}
      />
      {errorTh && (
        <p id={errorId} role="alert" className="text-xs text-error">
          {errorTh}
        </p>
      )}
    </div>
  );
}
