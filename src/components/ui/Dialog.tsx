"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export type DialogProps = {
  open: boolean;
  titleTh: string;
  onClose: () => void;
  children: ReactNode;
};

function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
}

/**
 * Modal พื้นฐาน — focus trap, ปิดด้วย Escape, คืน focus ไปปุ่มเดิมเสมอ
 *
 * คืน focus ทำผ่าน cleanup function ของ useEffect ไม่ใช่ event handler ของปุ่มปิด
 * เพราะผู้เรียกปิด dialog ได้หลายทาง (Escape, ปุ่มยกเลิก, คลิกฉากหลัง) และ
 * ทุกทางต้องพา focus กลับที่เดิมเหมือนกันหมด
 *
 * effect หลักพึ่ง `[open]` เท่านั้น ห้ามใส่ `onClose` ลง dependency array —
 * ผู้เรียกส่ง onClose เป็น inline arrow function ได้ (เช่น `() => setOpen(false)`)
 * ซึ่งเปลี่ยน identity ทุกครั้งที่ parent re-render ไม่ว่าจะด้วยเหตุผลอะไรก็ตาม
 * ที่ไม่เกี่ยวกับ dialog เลย (นาฬิกาเดิน, autosave, การ์ดอื่นถูกเลือก) ถ้า effect
 * ผูกกับ onClose มันจะ restart กลางคันทุกครั้ง เขียนทับ previouslyFocused ด้วย
 * document.activeElement ปัจจุบัน (ซึ่งอาจเป็นปุ่มในตัว dialog เอง) แล้วพอปิด
 * dialog จริงจะคืน focus ผิดที่ — ตรวจพบจริงตอนทดสอบในเบราว์เซอร์กับหน้าคลัง
 * component ที่มี state อื่นอยู่ในหน้าเดียวกันจำนวนมาก
 */
export function Dialog({ open, titleTh, onClose, children }: DialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const items = container ? focusableIn(container) : [];
    (items[0] ?? container)?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !container) return;

      const focusable = focusableIn(container);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md rounded-card bg-panel p-6 shadow-card outline-none"
      >
        <h2 id={titleId} className="text-lg font-bold text-navy">
          {titleTh}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
