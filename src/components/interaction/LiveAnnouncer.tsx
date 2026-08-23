"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { VisuallyHidden } from "../ui/VisuallyHidden";

export type AnnouncerContextType = {
  announce: (messageTh: string) => void;
};

const AnnouncerContext = createContext<AnnouncerContextType | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string>("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((text: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // ล้างข้อความเก่าก่อนใส่ใหม่ เพื่อให้ screen reader อ่านซ้ำได้แม้เป็นข้อความเดิม
    setMessage("");
    timeoutRef.current = setTimeout(() => {
      setMessage(text);
    }, 50);
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true">
        <VisuallyHidden>{message}</VisuallyHidden>
      </div>
    </AnnouncerContext.Provider>
  );
}

/**
 * Hook สำหรับประกาศข้อความให้ Screen Reader
 */
export function useAnnouncer(): AnnouncerContextType {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) {
    return {
      announce: () => {},
    };
  }
  return ctx;
}
