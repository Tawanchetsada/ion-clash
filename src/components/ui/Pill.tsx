import type { ReactNode } from "react";

export type PillTone = "navy" | "gold" | "blue" | "green" | "neutral";

export type PillProps = {
  children: ReactNode;
  tone?: PillTone;
};

const TONE_CLASS: Readonly<Record<PillTone, string>> = {
  navy: "bg-navy text-white",
  gold: "bg-gold text-navy",
  blue: "bg-blue text-white",
  green: "bg-green text-white",
  neutral: "bg-border text-navy",
};

/** ป้ายกลมเล็ก ใช้กับเลขด่านหรือสถานะสั้น ๆ */
export function Pill({ children, tone = "neutral" }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}
