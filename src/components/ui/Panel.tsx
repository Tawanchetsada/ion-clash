import type { HTMLAttributes } from "react";

export type PanelProps = HTMLAttributes<HTMLDivElement>;

/** แผงพื้นฐาน — bg + radius + shadow ตามโทเค็นเดียวทั้งเว็บ */
export function Panel({ className = "", ...props }: PanelProps) {
  return <div className={`rounded-card bg-panel p-4 shadow-card ${className}`} {...props} />;
}
