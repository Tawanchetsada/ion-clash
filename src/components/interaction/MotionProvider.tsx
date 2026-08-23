"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type MotionContextType = {
  motionEnabled: boolean;
};

const MotionContext = createContext<MotionContextType>({
  motionEnabled: true,
});

export type MotionProviderProps = {
  children: ReactNode;
  /** การตั้งค่าเปิด/ปิดแอนิเมชันจากหน้า Settings ของเกม (ค่าเริ่มต้นคือ true) */
  enabled?: boolean;
};

function subscribeMotion(callback: () => void) {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia === "undefined"
  ) {
    return () => {};
  }
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => {
    mediaQuery.removeEventListener("change", callback);
  };
}

function getMotionSnapshot(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia === "undefined"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * MotionProvider จัดการการเปิด/ปิด Animation โดยเคารพทั้ง:
 * 1. การตั้งค่าในเกม (prop `enabled`)
 * 2. การตั้งค่าระดับ OS (`prefers-reduced-motion: reduce`)
 */
export function MotionProvider({
  children,
  enabled = true,
}: MotionProviderProps) {
  const osReducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    () => false,
  );

  const motionEnabled = enabled && !osReducedMotion;

  return (
    <MotionContext.Provider value={{ motionEnabled }}>
      {children}
    </MotionContext.Provider>
  );
}

/**
 * Hook ตรวจสอบว่าแอนิเมชันเปิดใช้งานอยู่หรือไม่
 */
export function useMotionEnabled(): boolean {
  const ctx = useContext(MotionContext);
  return ctx.motionEnabled;
}
