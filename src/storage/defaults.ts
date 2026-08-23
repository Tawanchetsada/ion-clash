import type { GameSaveV1 } from "./schema";

/**
 * ฉีดนาฬิกาและตัวสร้าง id เข้ามาได้ เพื่อให้เทสต์ได้ผลคงที่
 * ถ้าปล่อยให้เรียก Date.now() กับ randomUUID() ตรง ๆ การเทียบว่า
 * export แล้ว import กลับได้เท่าเดิมจะเขียนเทสต์ไม่ได้เลย
 */
export type SaveClock = {
  now?: (() => Date) | undefined;
  uuid?: (() => string) | undefined;
};

function defaultUuid(): string {
  // มีทั้งใน browser, jsdom 29 และ Node 22+
  return globalThis.crypto.randomUUID();
}

export function resolveClock(clock: SaveClock = {}): {
  now: () => Date;
  uuid: () => string;
} {
  return {
    now: clock.now ?? ((): Date => new Date()),
    uuid: clock.uuid ?? defaultUuid,
  };
}

/**
 * เซฟเริ่มต้นของเครื่องใหม่ — ปลดล็อกเฉพาะด่าน 1 เท่านั้น
 *
 * เสียงเปิดไว้ แต่เพลงพื้นหลังปิดตามค่าเริ่มต้นใน D-17 เพราะเป็นสื่อการเรียนรู้
 * ที่ต้องใช้สมาธิ ผู้เล่นเปิดเองได้ในหน้าตั้งค่า
 */
export function createDefaultSave(clock: SaveClock = {}): GameSaveV1 {
  const { now, uuid } = resolveClock(clock);
  const timestamp = now().toISOString();

  return {
    version: 1,
    installId: uuid(),
    playerName: "",
    unlockedLevel: 1,
    completedLevels: {},
    lastPlayedLevel: 1,
    activeCheckpoint: null,
    settings: {
      sound: true,
      music: true,
      reducedMotion: false,
      researchConsent: false,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
