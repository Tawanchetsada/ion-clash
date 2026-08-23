"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { AudioEngine } from "./engine";
import type { ReactNode } from "react";
import type { SoundKey } from "./sounds";

export type AudioContextValue = {
  play: (key: SoundKey) => void;
  /** ต้องเรียกจาก event handler ของ user gesture จริง (เช่นปุ่มเริ่มเกม) */
  unlock: () => void;
};

const AudioCtx = createContext<AudioContextValue | null>(null);

export type AudioProviderProps = {
  children: ReactNode;
  /** เปิด/ปิดเสียง — อ่านจาก settings ของเซฟโดยชั้นที่เรียก provider นี้ไม่แตะ storage เอง */
  enabled: boolean;
};

export function AudioProvider({ children, enabled }: AudioProviderProps) {
  const engineRef = useRef<AudioEngine | null>(null);
  engineRef.current ??= new AudioEngine();

  useEffect(() => {
    if (!enabled) return;
    engineRef.current?.preload().catch(() => {
      // โหลดเสียงไม่สำเร็จ — เกมเล่นต่อได้ปกติ เสียงเป็นส่วนเสริมเท่านั้น
    });
  }, [enabled]);

  const value = useMemo<AudioContextValue>(
    () => ({
      play: (key) => engineRef.current?.play(key, { enabled }),
      unlock: () => {
        void engineRef.current?.unlock();
      },
    }),
    [enabled],
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioContextValue {
  const value = useContext(AudioCtx);
  if (!value) throw new Error("useAudio ต้องอยู่ใต้ AudioProvider");
  return value;
}
