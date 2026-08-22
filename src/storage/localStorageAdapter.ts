import {
  BACKUP_KEY,
  CORRUPT_KEY_PREFIX,
  MAX_CORRUPT_ENTRIES,
  SAVE_KEY,
  corruptKey,
} from "./keys";

/**
 * ชั้นที่แตะ localStorage จริง — ไฟล์เดียวในโปรเจกต์ที่ได้รับอนุญาต
 *
 * **ห้าม throw ออกจากไฟล์นี้เด็ดขาด** ทุกความล้มเหลวต้องกลายเป็นค่าที่คืนได้
 * เพราะ storage ถูกปิดกั้นได้ทั้งจากโหมดส่วนตัวและพื้นที่เต็ม ถ้าปล่อยให้
 * throw ขึ้นไป เกมจะล่มกลางคาบเรียนซึ่งรับไม่ได้ในวันทดลองจริง
 */

export type StorageFailure = "quota" | "security" | "serialize" | "unknown";

export type SaveResult = { ok: true } | { ok: false; reason: StorageFailure };

/** ใช้แค่ส่วนที่จำเป็น เพื่อให้ยัด storage ปลอมในเทสต์ได้ง่าย */
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
};

const QUOTA_ERROR_NAMES = new Set([
  "QuotaExceededError",
  "NS_ERROR_DOM_QUOTA_REACHED",
]);

export function normalizeStorageError(error: unknown): StorageFailure {
  if (error instanceof Error) {
    if (QUOTA_ERROR_NAMES.has(error.name)) return "quota";
    if (error.name === "SecurityError") return "security";
    if (error instanceof TypeError) return "serialize";
  }
  // DOMException เก่าบางรุ่นบอกด้วย code ไม่ใช่ name
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 22
  ) {
    return "quota";
  }
  return "unknown";
}

/** ตัวเข้าถึง localStorage ที่ปลอดภัยต่อ SSR — คืน null เมื่อไม่มี window */
export function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // โหมดส่วนตัวบางเบราว์เซอร์ throw ตั้งแต่ตอนเข้าถึง property
    return null;
  }
}

export type LocalStorageAdapter = {
  read(): string | null;
  write(value: string): SaveResult;
  readBackup(): string | null;
  /** เก็บค่าดิบที่อ่านไม่ออกไว้กู้ทีหลัง แล้วล้างคีย์หลัก */
  quarantine(raw: string, timestamp: string): void;
  clear(): void;
  listCorruptKeys(): string[];
};

export function createLocalStorageAdapter(
  storage: StorageLike,
): LocalStorageAdapter {
  function listCorruptKeys(): string[] {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key !== null && key.startsWith(CORRUPT_KEY_PREFIX)) {
        keys.push(key);
      }
    }
    return keys.sort();
  }

  /**
   * ไฟล์เสียที่ค้างอยู่ต้องมีเพดาน ไม่งั้นถ้าเซฟพังค้างแล้วนักเรียนรีเฟรชรัว ๆ
   * คีย์จะงอกทุกครั้งจนกินพื้นที่เต็ม แล้วกลายเป็นพังซ้ำซ้อนกู้ไม่ได้เลย
   */
  function pruneCorrupt(): void {
    const keys = listCorruptKeys();
    const excess = keys.length - MAX_CORRUPT_ENTRIES;
    for (let index = 0; index < excess; index += 1) {
      const key = keys[index];
      if (key === undefined) continue;
      try {
        storage.removeItem(key);
      } catch {
        // ลบไม่ได้ก็ปล่อย ไม่ใช่เหตุให้ทั้งระบบพัง
      }
    }
  }

  return {
    listCorruptKeys,

    read(): string | null {
      try {
        return storage.getItem(SAVE_KEY);
      } catch {
        return null;
      }
    },

    readBackup(): string | null {
      try {
        return storage.getItem(BACKUP_KEY);
      } catch {
        return null;
      }
    },

    write(value: string): SaveResult {
      try {
        // สำรองของเดิมก่อนเสมอ เผื่อการเขียนรอบนี้พังกลางทาง
        const previous = storage.getItem(SAVE_KEY);
        if (previous !== null) {
          try {
            storage.setItem(BACKUP_KEY, previous);
          } catch {
            // สำรองไม่ได้ก็ยังต้องพยายามเขียนของใหม่ต่อ
          }
        }
        storage.setItem(SAVE_KEY, value);
        return { ok: true };
      } catch (error) {
        return { ok: false, reason: normalizeStorageError(error) };
      }
    },

    quarantine(raw: string, timestamp: string): void {
      try {
        storage.setItem(corruptKey(timestamp), raw);
        pruneCorrupt();
      } catch {
        // เก็บไฟล์เสียไม่ได้ก็ต้องเดินต่อ ห้าม throw ซ้อนความล้มเหลวเดิม
      }
      try {
        storage.removeItem(SAVE_KEY);
      } catch {
        // เช่นเดียวกัน
      }
    },

    clear(): void {
      for (const key of [SAVE_KEY, BACKUP_KEY]) {
        try {
          storage.removeItem(key);
        } catch {
          // ไม่มีอะไรให้ทำต่อ
        }
      }
    },
  };
}
