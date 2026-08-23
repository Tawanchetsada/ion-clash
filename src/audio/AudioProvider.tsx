"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { AudioEngine } from "./engine";
import { backgroundMusic } from "./music";
import type { ReactNode } from "react";
import type { SoundKey } from "./sounds";

export type AudioContextValue = {
  play: (key: SoundKey) => void;
  /** เล่นเสียงคลิกหรือแตะปุ่ม UI */
  playUiTap: () => void;
  /** ต้องเรียกจาก event handler ของ user gesture จริง (เช่นปุ่มเริ่มเกม) */
  unlock: () => void;
};

const AudioCtx = createContext<AudioContextValue | null>(null);

export type AudioProviderProps = {
  children: ReactNode;
  /** เปิด/ปิดเสียงเอฟเฟกต์ — อ่านจาก settings ของเซฟ */
  enabled?: boolean;
  /** เปิด/ปิดเพลงพื้นหลัง — อ่านจาก settings ของเซฟ */
  musicEnabled?: boolean;
};

export function AudioProvider({
  children,
  enabled = true,
  musicEnabled = false,
}: AudioProviderProps) {
  const engineRef = useRef<AudioEngine | null>(null);
  engineRef.current ??= new AudioEngine();

  const startedRef = useRef(false);

  const start = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    startedRef.current = true;
    void engine.unlock();
    engine.preload().catch(() => {
      // โหลดเสียงไม่สำเร็จ — เกมเล่นต่อได้ปกติ เสียงเป็นส่วนเสริมเท่านั้น
    });
    if (musicEnabled) {
      backgroundMusic.start();
    }
  }, [musicEnabled]);

  useEffect(() => {
    if (!enabled && !musicEnabled) return;

    if (startedRef.current) {
      start();
      return;
    }

    document.addEventListener("pointerdown", start, { once: true });
    document.addEventListener("keydown", start, { once: true });
    document.addEventListener("touchend", start, { once: true });

    return () => {
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("keydown", start);
      document.removeEventListener("touchend", start);
    };
  }, [enabled, musicEnabled, start]);

  // จัดการเปิด/ปิดเพลงพื้นหลังตาม musicEnabled
  useEffect(() => {
    if (musicEnabled) {
      if (startedRef.current) {
        backgroundMusic.start();
      }
    } else {
      backgroundMusic.stop();
    }
  }, [musicEnabled]);

  const value = useMemo<AudioContextValue>(
    () => ({
      play: (key) => engineRef.current?.play(key, { enabled }),
      playUiTap: () => {
        if (!enabled) return;
        backgroundMusic.playButtonTap();
      },
      unlock: () => {
        void engineRef.current?.unlock();
        if (musicEnabled) {
          backgroundMusic.start();
        }
      },
    }),
    [enabled, musicEnabled],
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioContextValue {
  const value = useContext(AudioCtx);
  if (!value) throw new Error("useAudio ต้องอยู่ใต้ AudioProvider");
  return value;
}

export function useAudioOptional(): AudioContextValue | null {
  return useContext(AudioCtx);
}
