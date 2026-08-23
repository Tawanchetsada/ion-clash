"use client";

import { useRef, useState, type TouchEvent } from "react";
import { MESSAGES } from "../../config/messages";
import { ChevronLeftIcon, ChevronRightIcon, HintIcon } from "../ui/Icon";

export type HintViewerProps = {
  /** รายการคำใบ้ทั้งหมดของด่าน */
  hints: readonly string[];
  /** จำนวนคำใบ้ที่ขอใช้แล้ว */
  hintsUsed: number;
};

export function HintViewer({ hints, hintsUsed }: HintViewerProps) {
  const [prevHintsUsed, setPrevHintsUsed] = useState(hintsUsed);
  const [currentIndex, setCurrentIndex] = useState(Math.max(0, hintsUsed - 1));
  const touchStartXRef = useRef<number | null>(null);

  // เมื่อผู้เล่นกดขอคำใบ้ใหม่ ให้เลื่อนไปยังคำใบ้ล่าสุดโดยอัตโนมัติ (React standard state adjustment during render)
  if (hintsUsed !== prevHintsUsed) {
    setPrevHintsUsed(hintsUsed);
    if (hintsUsed > prevHintsUsed) {
      setCurrentIndex(hintsUsed - 1);
    } else if (currentIndex >= hintsUsed) {
      setCurrentIndex(Math.max(0, hintsUsed - 1));
    }
  }

  if (hintsUsed <= 0) return null;

  const currentHintText = hints[currentIndex] ?? "";
  const totalUnlocked = Math.min(hintsUsed, hints.length);
  const hasMultiple = totalUnlocked > 1;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(totalUnlocked - 1, prev + 1));
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? null;
    if (endX !== null) {
      const deltaX = endX - touchStartXRef.current;
      if (deltaX > 40) {
        handlePrev(); // ปัดขวา -> ดูคำใบ้ก่อนหน้า
      } else if (deltaX < -40) {
        handleNext(); // ปัดซ้าย -> ดูคำใบ้ถัดไป
      }
    }
    touchStartXRef.current = null;
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col gap-2 rounded-card bg-gold-surface p-4 text-navy border-2 border-gold/50 shadow-2xs select-none sm:select-auto"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg text-navy">
            <HintIcon />
          </span>
          <span className="font-bold text-sm text-navy">
            {MESSAGES.ui.hintTitle(currentIndex + 1)}
          </span>
          {hasMultiple && (
            <span className="rounded-full bg-gold-light px-2.5 py-0.5 text-xs font-bold text-navy">
              {currentIndex + 1} / {totalUnlocked}
            </span>
          )}
        </div>

        {hasMultiple && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={MESSAGES.ui.prevHint}
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/50 bg-white text-navy transition-all hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              aria-label={MESSAGES.ui.nextHint}
              disabled={currentIndex === totalUnlocked - 1}
              onClick={handleNext}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/50 bg-white text-navy transition-all hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      <div className="text-sm leading-relaxed text-navy/90 pl-7 sm:pl-7">
        {currentHintText}
      </div>

      {hasMultiple && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {Array.from({ length: totalUnlocked }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={MESSAGES.ui.hintTitle(i + 1)}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex ? "w-6 bg-navy" : "w-2 bg-navy/25 hover:bg-navy/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
