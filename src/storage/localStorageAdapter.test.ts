import { describe, expect, it } from "vitest";
import {
  createFakeStorage,
  createQuotaError,
  createSecurityError,
} from "./__fixtures__/fakeStorage";
import {
  BACKUP_KEY,
  CORRUPT_KEY_PREFIX,
  MAX_CORRUPT_ENTRIES,
  SAVE_KEY,
} from "./keys";
import {
  createLocalStorageAdapter,
  normalizeStorageError,
} from "./localStorageAdapter";

describe("การแปลงข้อผิดพลาดของ storage", () => {
  it("แยกประเภทได้ถูกต้อง", () => {
    expect(normalizeStorageError(createQuotaError())).toBe("quota");
    expect(normalizeStorageError(createSecurityError())).toBe("security");
    expect(normalizeStorageError(new TypeError("วนซ้ำ"))).toBe("serialize");
    expect(normalizeStorageError(new Error("อะไรก็ไม่รู้"))).toBe("unknown");
    expect(normalizeStorageError("ข้อความเปล่า")).toBe("unknown");
  });

  it("รองรับ DOMException รุ่นเก่าที่บอกด้วย code 22", () => {
    expect(normalizeStorageError({ code: 22 })).toBe("quota");
  });
});

describe("การอ่านเขียน localStorage", () => {
  it("เขียนแล้วอ่านกลับได้", () => {
    const storage = createFakeStorage();
    const adapter = createLocalStorageAdapter(storage);

    expect(adapter.write("ข้อมูล")).toEqual({ ok: true });
    expect(adapter.read()).toBe("ข้อมูล");
  });

  it("สำรองของเดิมก่อนเขียนทับเสมอ", () => {
    const storage = createFakeStorage({ [SAVE_KEY]: "ของเดิม" });
    const adapter = createLocalStorageAdapter(storage);

    adapter.write("ของใหม่");

    expect(storage.getItem(SAVE_KEY)).toBe("ของใหม่");
    expect(storage.getItem(BACKUP_KEY)).toBe("ของเดิม");
    expect(adapter.readBackup()).toBe("ของเดิม");
  });

  it("เขียนครั้งแรกไม่ต้องมี backup", () => {
    const storage = createFakeStorage();
    createLocalStorageAdapter(storage).write("แรก");
    expect(storage.getItem(BACKUP_KEY)).toBeNull();
  });

  it.each([
    ["quota", createQuotaError()],
    ["security", createSecurityError()],
  ])("พื้นที่เต็มหรือถูกปิดกั้นคืน error ไม่ throw (%s)", (reason, error) => {
    const storage = createFakeStorage();
    storage.failWith(error);
    const adapter = createLocalStorageAdapter(storage);

    expect(() => adapter.write("ข้อมูล")).not.toThrow();
    expect(adapter.write("ข้อมูล")).toEqual({ ok: false, reason });
  });

  it("อ่านไม่ได้คืน null แทนการ throw", () => {
    const storage = createFakeStorage();
    const adapter = createLocalStorageAdapter({
      ...storage,
      getItem: () => {
        throw createSecurityError();
      },
    });

    expect(() => adapter.read()).not.toThrow();
    expect(adapter.read()).toBeNull();
  });
});

describe("การกักไฟล์ที่อ่านไม่ออก", () => {
  it("เก็บค่าดิบไว้แล้วล้างคีย์หลัก", () => {
    const storage = createFakeStorage({ [SAVE_KEY]: "{พัง" });
    const adapter = createLocalStorageAdapter(storage);

    adapter.quarantine("{พัง", "2026-08-22T09:00:00.000Z");

    expect(storage.getItem(SAVE_KEY)).toBeNull();
    expect(storage.getItem(`${CORRUPT_KEY_PREFIX}2026-08-22T09:00:00.000Z`)).toBe(
      "{พัง",
    );
  });

  it("เก็บไฟล์เสียไม่เกินเพดาน ลบชุดเก่าสุดก่อน", () => {
    // ถ้าไม่มีเพดาน นักเรียนที่เซฟพังค้างแล้วรีเฟรชรัว ๆ จะสร้างคีย์
    // ใหม่ทุกครั้งจนพื้นที่เต็ม แล้วกลายเป็นพังซ้ำซ้อนกู้ไม่ได้เลย
    const storage = createFakeStorage();
    const adapter = createLocalStorageAdapter(storage);

    for (let index = 1; index <= MAX_CORRUPT_ENTRIES + 3; index += 1) {
      adapter.quarantine(
        `พัง-${index}`,
        `2026-08-22T09:0${index}:00.000Z`,
      );
    }

    const remaining = adapter.listCorruptKeys();
    expect(remaining).toHaveLength(MAX_CORRUPT_ENTRIES);
    // ที่เหลือต้องเป็นชุดใหม่ล่าสุด
    expect(remaining.at(-1)).toContain("09:06");
  });

  it("กักไม่สำเร็จก็ต้องไม่ throw ซ้อนความล้มเหลวเดิม", () => {
    const storage = createFakeStorage({ [SAVE_KEY]: "{พัง" });
    storage.failWith(createQuotaError());
    const adapter = createLocalStorageAdapter(storage);

    expect(() =>
      adapter.quarantine("{พัง", "2026-08-22T09:00:00.000Z"),
    ).not.toThrow();
    // ยังต้องล้างคีย์หลักให้ได้ เพื่อให้รอบหน้าเริ่มจากเซฟใหม่
    expect(storage.getItem(SAVE_KEY)).toBeNull();
  });
});

describe("การล้างข้อมูล", () => {
  it("ลบทั้งคีย์หลักและ backup", () => {
    const storage = createFakeStorage({
      [SAVE_KEY]: "ก",
      [BACKUP_KEY]: "ข",
    });
    createLocalStorageAdapter(storage).clear();

    expect(storage.getItem(SAVE_KEY)).toBeNull();
    expect(storage.getItem(BACKUP_KEY)).toBeNull();
  });
});
