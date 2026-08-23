"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
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

  /*
   * โหลดไฟล์เสียงและปลดล็อก AudioContext ที่การสัมผัสหน้าจอครั้งแรก ไม่ใช่ตอน mount
   *
   * **เรื่องปลดล็อก:** เบราว์เซอร์ทุกตัวสร้าง AudioContext มาในสถานะ `suspended`
   * ถ้าไม่ได้สร้างระหว่าง user gesture และ `source.start()` บน context ที่ยัง
   * suspended อยู่ **จะไม่มีเสียงออกลำโพงเลย โดยไม่มี error ใด ๆ** — อาการคือ
   * เกมทำงานปกติทุกอย่างแต่เงียบสนิท ซึ่งเป็นสิ่งที่เกิดขึ้นจริงตลอดมาเพราะ
   * ไม่มีใครเรียก `unlock()` สักที่ในแอป
   *
   * **เรื่องเวลาโหลด:** เดิม `preload()` ยิงตอน mount ทำให้มี fetch ค้างอยู่
   * ระหว่างที่ผู้ใช้ยังไม่ได้ทำอะไรเลย ถ้าเปลี่ยนหน้าทันทีหลังเปิด (ซึ่งเทสต์ E2E
   * ทำตลอด) fetch ถูกยกเลิกกลางคัน แล้ว WebKit รายงานเป็น error ระดับหน้าว่า
   * "cannot load ... due to access control checks" ทั้งที่เกมไม่ได้พังอะไร
   * — เจอจริงบน CI (Linux WebKit) เท่านั้น ในเครื่องพัฒนาไม่เคยเกิด
   * โหลดตอนแตะครั้งแรกจึงดีกว่าทุกทาง: ไม่มี fetch ค้างตอนเปิดหน้า ไม่กิน
   * แบนด์วิดท์ของคนที่เปิดผ่านแล้วปิดไป และตรงกับจังหวะที่ iOS ต้องการพอดี
   *
   * ดักที่ document แทนที่จะไปผูกกับปุ่มใดปุ่มหนึ่ง เพราะเสียงแรกที่ผู้เล่นควร
   * ได้ยินคือเสียง "วางการ์ด" ซึ่งเกิดจากการลาก ไม่ใช่การกดปุ่ม ถ้าผูกกับปุ่ม
   * เริ่มเกมอย่างเดียว คนที่เข้าหน้าเล่นตรง ๆ จากลิงก์จะยังเงียบอยู่ดี
   */
  const startedRef = useRef(false);

  const start = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    startedRef.current = true;
    void engine.unlock();
    engine.preload().catch(() => {
      // โหลดเสียงไม่สำเร็จ — เกมเล่นต่อได้ปกติ เสียงเป็นส่วนเสริมเท่านั้น
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // ผู้เล่นเปิดเสียงทีหลังในหน้าตั้งค่า — แตะหน้าจอไปแล้วแน่นอน โหลดได้เลย
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
  }, [enabled, start]);

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
