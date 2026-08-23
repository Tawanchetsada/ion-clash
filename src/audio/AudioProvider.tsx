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

  /*
   * ปลดล็อกเสียงที่การสัมผัสหน้าจอครั้งแรก ไม่ว่าจะแตะตรงไหน
   *
   * เบราว์เซอร์ทุกตัวสร้าง AudioContext ขึ้นมาในสถานะ `suspended` ถ้าไม่ได้สร้าง
   * ระหว่าง user gesture และ `source.start()` บน context ที่ยัง suspended อยู่
   * **จะไม่มีเสียงออกลำโพงเลย โดยไม่มี error ใด ๆ** — อาการคือเกมทำงานปกติทุก
   * อย่างแต่เงียบสนิท ซึ่งเป็นสิ่งที่เกิดขึ้นจริงเพราะไม่มีใครเรียก unlock()
   * สักที่ในแอป
   *
   * ดักที่ document แทนที่จะไปไล่ผูกกับปุ่มใดปุ่มหนึ่ง เพราะเสียงแรกที่ผู้เล่น
   * ควรได้ยินคือเสียง "วางการ์ด" ซึ่งเกิดจากการลาก ไม่ใช่การกดปุ่ม ถ้าผูกกับ
   * ปุ่มเริ่มเกมอย่างเดียว คนที่เข้าหน้าเล่นตรง ๆ จากลิงก์จะยังเงียบอยู่ดี
   *
   * `pointerdown` ครอบทั้งเมาส์และนิ้ว ส่วน `keydown` ไว้ให้คนที่เล่นด้วย
   * คีย์บอร์ดล้วน — ทั้งสองนับเป็น user gesture ที่ถูกต้องตามข้อกำหนดของ iOS
   * `once: true` ทำให้ถอดตัวเองหลังทำงานครั้งเดียว ไม่ต้องเช็กสถานะซ้ำทุกคลิก
   */
  useEffect(() => {
    if (!enabled) return;

    const unlock = () => {
      void engineRef.current?.unlock();
    };

    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    document.addEventListener("touchend", unlock, { once: true });

    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchend", unlock);
    };
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
