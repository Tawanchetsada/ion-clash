"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { MESSAGES } from "../../config/messages";
import { Button } from "../ui/Button";
import { RotateDeviceIcon } from "../ui/Icon";

/** มือถือแนวตั้ง — ไม่รวมแท็บเล็ตแนวตั้งซึ่งกว้างพอให้สมการอยู่บรรทัดเดียวอยู่แล้ว */
const PORTRAIT_PHONE = "(orientation: portrait) and (max-width: 767px)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(PORTRAIT_PHONE);
  mql.addEventListener("change", onChange);
  // เผื่อเบราว์เซอร์/ตัวจำลองบางตัวที่เปลี่ยนขนาดจอแล้วไม่ยิง change ของ
  // matchMedia (เจอจริงกับ device emulation ผ่าน CDP) — สองตัวนี้ยิงแน่นอน
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  return () => {
    mql.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
  };
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(PORTRAIT_PHONE).matches;
}

/**
 * ชวนให้หมุนเครื่องเป็นแนวนอนก่อนเล่นบนมือถือ
 *
 * เหตุผลเชิงการเรียนรู้: นักเรียนที่ยังอ่านสมการไอออนิกไม่คล่องต้องเห็นสมการ
 * **ทั้งเส้นในบรรทัดเดียว** จึงจะเชื่อมโยงได้ว่าอะไรอยู่ก่อนลูกศรและอะไรอยู่หลัง
 * บนมือถือแนวตั้งแถบสมการต้องเลื่อนดูทีละส่วน ทำให้เห็นไม่ครบพร้อมกัน
 *
 * **เป็นคำแนะนำที่ปิดได้ ไม่ใช่การบังคับ** — WCAG 1.3.4 (Orientation) ห้ามล็อก
 * เนื้อหาไว้กับทิศทางจอเดียว เพราะผู้ใช้บางคนยึดอุปกรณ์ไว้กับรถเข็นหรือขาตั้ง
 * ที่หมุนไม่ได้ ปุ่ม "เล่นแนวตั้งต่อไป" จึงต้องมีเสมอ และเมื่อกดแล้วต้องไม่ถามซ้ำ
 */
export function RotatePrompt() {
  const isPortraitPhone = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const [dismissed, setDismissed] = useState(false);
  const dismiss = useCallback(() => setDismissed(true), []);

  if (!isPortraitPhone || dismissed) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="rotate-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/95 px-6 text-center text-white"
    >
      <div className="flex max-w-xs flex-col items-center gap-4">
        <span className="text-5xl text-gold">
          <RotateDeviceIcon />
        </span>

        <h2 id="rotate-prompt-title" className="text-xl font-bold">
          {MESSAGES.ui.rotatePrompt.title}
        </h2>

        <p className="text-sm text-white/80">{MESSAGES.ui.rotatePrompt.description}</p>

        <Button variant="outline" onClick={dismiss} className="bg-white/10 text-white">
          {MESSAGES.ui.rotatePrompt.dismiss}
        </Button>
      </div>
    </div>
  );
}
