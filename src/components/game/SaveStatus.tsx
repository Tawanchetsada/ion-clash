import { MESSAGES } from "../../config/messages";

export type SaveStatusKind = "idle" | "saving" | "saved" | "error";

export type SaveStatusProps = {
  status: SaveStatusKind;
  onRetry?: () => void;
  onExport?: () => void;
};

const STATUS_LABEL_TH: Readonly<Record<SaveStatusKind, string>> = {
  idle: "",
  saving: MESSAGES.save.saving,
  saved: MESSAGES.save.saved,
  error: MESSAGES.save.error,
};

/** สถานะการบันทึกลงเครื่อง — error ต้องมีทางออกเสมอ (ลองใหม่ / ส่งออกข้อมูล) */
export function SaveStatus({ status, onRetry, onExport }: SaveStatusProps) {
  return (
    <div aria-live="polite" className="flex items-center gap-3 text-sm">
      {status !== "idle" && (
        <span className={status === "error" ? "font-semibold text-error" : "text-navy/70"}>
          {STATUS_LABEL_TH[status]}
        </span>
      )}
      {status === "error" && onRetry && (
        <button type="button" onClick={onRetry} className="min-h-11 min-w-11 underline">
          {MESSAGES.save.retry}
        </button>
      )}
      {status === "error" && onExport && (
        <button type="button" onClick={onExport} className="min-h-11 min-w-11 underline">
          {MESSAGES.save.export}
        </button>
      )}
    </div>
  );
}
