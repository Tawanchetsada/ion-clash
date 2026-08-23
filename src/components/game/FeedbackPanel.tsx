"use client";

import { useEffect, useState } from "react";
import { MESSAGES } from "../../config/messages";
import type { Feedback } from "../../domain/game/types";
import { CheckCircleIcon, CloseIcon, WarningIcon } from "../ui/Icon";

export type FeedbackPanelProps = {
  feedback: Feedback | null;
  onRetry?: () => void;
  onDismiss?: () => void;
};

/**
 * ข้อความหลังตรวจคำตอบ — error ใช้ role="alert" (มี aria-live="assertive" ในตัว)
 * ส่วนความสำเร็จใช้ role="status" (aria-live="polite" ในตัว) ตามกติกาข้อ 5.6
 * ที่ให้ใช้ role=alert "อย่างพอดี" ไม่ใช่ทุกข้อความ
 */
export function FeedbackPanel({ feedback, onRetry, onDismiss }: FeedbackPanelProps) {
  const [displayedFeedback, setDisplayedFeedback] = useState<Feedback | null>(feedback);
  const [isVisible, setIsVisible] = useState<boolean>(Boolean(feedback));
  const [prevFeedback, setPrevFeedback] = useState<Feedback | null>(feedback);

  if (feedback !== prevFeedback) {
    setPrevFeedback(feedback);
    if (feedback) {
      setDisplayedFeedback(feedback);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }

  useEffect(() => {
    if (!isVisible && displayedFeedback) {
      const timer = setTimeout(() => {
        setDisplayedFeedback(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, displayedFeedback]);

  if (!displayedFeedback) return null;

  const isError = displayedFeedback.kind === "error";

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur-md px-4 py-3 font-bold shadow-2xl border-2 transition-all duration-300 ease-out transform ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-95 pointer-events-none"
      } ${isError ? "border-error text-navy" : "border-green text-navy"}`}
    >
      <span className={isError ? "text-xl text-error shrink-0" : "text-xl text-green shrink-0"}>
        {isError ? <WarningIcon /> : <CheckCircleIcon />}
      </span>
      <span className="flex-1 text-sm sm:text-base leading-snug">{displayedFeedback.messageTh}</span>
      {isError && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 min-w-11 text-sm underline shrink-0 cursor-pointer"
        >
          {MESSAGES.ui.retry}
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={MESSAGES.ui.dismissFeedback}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy/60 hover:text-navy hover:bg-navy/10 active:bg-navy/20 transition-colors cursor-pointer"
        >
          <CloseIcon className="text-base" />
        </button>
      )}
    </div>
  );
}
