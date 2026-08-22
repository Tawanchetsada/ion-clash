import type { StorageLike } from "../localStorageAdapter";

/**
 * localStorage ปลอมสำหรับเทสต์
 *
 * จำเป็นเพราะต้องยิง QuotaExceededError กับ SecurityError ได้ตามสั่ง
 * ซึ่งทำกับ localStorage จริงของ jsdom ไม่ได้ และเป็นเส้นทางที่ต้อง
 * ทดสอบให้ครบที่สุด เพราะเป็นสิ่งที่จะเกิดจริงในห้องเรียน
 */

export type FakeStorage = StorageLike & {
  readonly entries: Map<string, string>;
  /** ให้ setItem ครั้งต่อ ๆ ไปโยน error ตามที่กำหนด */
  failWith(error: Error | null): void;
};

export function createQuotaError(): Error {
  const error = new Error("quota exceeded");
  error.name = "QuotaExceededError";
  return error;
}

export function createSecurityError(): Error {
  const error = new Error("storage blocked");
  error.name = "SecurityError";
  return error;
}

export function createFakeStorage(
  initial: Record<string, string> = {},
): FakeStorage {
  const entries = new Map<string, string>(Object.entries(initial));
  let failure: Error | null = null;

  return {
    entries,

    failWith(error: Error | null): void {
      failure = error;
    },

    get length(): number {
      return entries.size;
    },

    key(index: number): string | null {
      return [...entries.keys()][index] ?? null;
    },

    getItem(key: string): string | null {
      return entries.get(key) ?? null;
    },

    setItem(key: string, value: string): void {
      if (failure) throw failure;
      entries.set(key, value);
    },

    removeItem(key: string): void {
      entries.delete(key);
    },
  };
}
