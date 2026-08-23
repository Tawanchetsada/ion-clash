import type { ReactNode } from "react";

/** ข้อความที่มีไว้ให้ screen reader อ่านเท่านั้น ไม่แสดงผลทางสายตา */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
