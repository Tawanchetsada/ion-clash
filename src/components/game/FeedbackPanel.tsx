import { MESSAGES } from "../../config/messages";
import type { Feedback } from "../../domain/game/types";

export type FeedbackPanelProps = {
  feedback: Feedback | null;
  onRetry?: () => void;
};

/**
 * ข้อความหลังตรวจคำตอบ — error ใช้ role="alert" (มี aria-live="assertive" ในตัว)
 * ส่วนความสำเร็จใช้ role="status" (aria-live="polite" ในตัว) ตามกติกาข้อ 5.6
 * ที่ให้ใช้ role=alert "อย่างพอดี" ไม่ใช่ทุกข้อความ
 */
export function FeedbackPanel({ feedback, onRetry }: FeedbackPanelProps) {
  if (!feedback) return null;

  const isError = feedback.kind === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-center gap-3 rounded-card p-3 font-semibold ${
        isError ? "border border-error text-error" : "border border-green text-green"
      }`}
    >
      <span aria-hidden="true">{isError ? "⚠" : "✓"}</span>
      <span>{feedback.messageTh}</span>
      {isError && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 min-w-11 text-sm underline"
        >
          {MESSAGES.ui.retry}
        </button>
      )}
    </div>
  );
}
