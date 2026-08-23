"use client";

import { MESSAGES } from "../../config/messages";
import { ClockIcon, StarIcon } from "../ui/Icon";

export type LiveGameStatsProps = {
  score: number;
  elapsedSec: number;
};

export function LiveGameStats({ score, elapsedSec }: LiveGameStatsProps) {
  const min = Math.floor(elapsedSec / 60);
  const sec = elapsedSec % 60;
  const timeFormatted = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

  const scoreBadgeStyle =
    score >= 90
      ? "bg-emerald-50 text-green-ink border-emerald-200"
      : score >= 70
        ? "bg-amber-50 text-navy border-amber-300"
        : "bg-red-50 text-error border-red-200";

  return (
    <div
      role="region"
      aria-label={MESSAGES.ui.liveStats}
      className="flex flex-wrap items-center gap-2 text-xs font-bold"
    >
      {/* คะแนนปัจจุบัน */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border shadow-2xs transition-colors duration-200 ${scoreBadgeStyle}`}
      >
        <StarIcon className="text-gold text-sm" />
        <span>{MESSAGES.ui.currentScore}</span>
        <span className="font-extrabold text-sm">{score}</span>
      </div>

      {/* เวลาที่ใช้ไป */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 border border-navy/15 text-navy shadow-2xs">
        <ClockIcon className="text-navy/70 text-sm" />
        <span>{MESSAGES.ui.elapsedTime}</span>
        <span className="font-mono font-extrabold text-sm tracking-tight">{timeFormatted}</span>
      </div>
    </div>
  );
}
