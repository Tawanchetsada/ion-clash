import { createDefaultSave, resolveClock } from "./defaults";
import {
  createLocalStorageAdapter,
  getBrowserStorage,
} from "./localStorageAdapter";
import { migrate } from "./migration";
import { mergeSaves } from "./merge";
import { SAVE_KEY } from "./keys";
import { gameSaveV1Schema, normalizeSave, storedSaveSchema } from "./schema";
import type { SaveClock } from "./defaults";
import type {
  LocalStorageAdapter,
  SaveResult,
  StorageLike,
} from "./localStorageAdapter";
import type { GameSaveV1 } from "./schema";

/**
 * ทางเข้าเดียวที่เกมใช้คุยกับที่เก็บข้อมูล
 *
 * UI และ reducer เห็นแค่ interface นี้ ไม่รู้ว่าข้างหลังเป็น localStorage
 * ซึ่งเป็นเหตุผลเดียวที่ Cloud Save ในงานวิจัยเฟสสองจะเพิ่มได้ภายหลัง
 * โดยไม่ต้องรื้อตรรกะเกม
 */

export type ImportPreview = {
  completedCount: number;
  highestLevel: number;
  updatedAt: string;
  playerName: string;
};

export type ImportResult =
  | { ok: true; merged: GameSaveV1; preview: ImportPreview }
  | { ok: false; reason: "parse" | "schema" };

export interface GameSaveRepository {
  load(): GameSaveV1;
  save(next: GameSaveV1): SaveResult;
  reset(): void;
  exportJson(): Blob;
  /** ตรวจและรวมให้ แต่ **ยังไม่เขียน** — ผู้ใช้ต้องยืนยันจาก preview ก่อน */
  importJson(text: string): ImportResult;
  /** ซิงก์ระหว่างแท็บ คืนฟังก์ชันไว้ยกเลิกการติดตาม */
  subscribeExternalChange(listener: (merged: GameSaveV1) => void): () => void;
}

export type RepositoryDeps = {
  storage?: StorageLike | null | undefined;
  clock?: SaveClock | undefined;
};

/** ชื่อไฟล์ตอนส่งออก เช่น ion-clash-save-2026-08-22.json */
export function saveFileName(date: Date): string {
  const iso = date.toISOString();
  return `ion-clash-save-${iso.slice(0, 10)}.json`;
}

export function buildImportPreview(save: GameSaveV1): ImportPreview {
  const completed = Object.entries(save.completedLevels).filter(
    ([, progress]) => progress.completed,
  );
  return {
    completedCount: completed.length,
    highestLevel: completed.reduce(
      (highest, [id]) => Math.max(highest, Number(id)),
      0,
    ),
    updatedAt: save.updatedAt,
    playerName: save.playerName,
  };
}

/**
 * ตรวจค่าดิบให้กลายเป็นเซฟที่ใช้ได้ — คืน null เมื่ออ่านไม่ออกจริง ๆ
 * ลำดับคือ แปลงเวอร์ชัน แล้วตรวจรูปร่างหลวม ๆ แล้วซ่อม แล้วตรวจเข้มปิดท้าย
 */
function parseSave(
  raw: unknown,
  fallback: { installId: string; now: string },
): GameSaveV1 | null {
  const migrated = migrate(raw);
  if (!migrated.ok) return null;

  if (!storedSaveSchema.safeParse(migrated.value).success) return null;

  const normalized = normalizeSave(migrated.value, fallback);
  const strict = gameSaveV1Schema.safeParse(normalized);
  return strict.success ? strict.data : null;
}

export function createGameSaveRepository(
  deps: RepositoryDeps = {},
): GameSaveRepository {
  const clock = resolveClock(deps.clock);
  const storage =
    deps.storage === undefined ? getBrowserStorage() : deps.storage;
  const adapter: LocalStorageAdapter | null =
    storage === null ? null : createLocalStorageAdapter(storage);

  function fallbackValues(): { installId: string; now: string } {
    return { installId: clock.uuid(), now: clock.now().toISOString() };
  }

  function load(): GameSaveV1 {
    // ไม่มี storage แปลว่าอยู่บนเซิร์ฟเวอร์หรือถูกปิดกั้น — เล่นได้ในหน่วยความจำ
    if (adapter === null) return createDefaultSave(deps.clock);

    const raw = adapter.read();
    if (raw === null) return createDefaultSave(deps.clock);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      adapter.quarantine(raw, clock.now().toISOString());
      return createDefaultSave(deps.clock);
    }

    const save = parseSave(parsedJson, fallbackValues());
    if (save === null) {
      adapter.quarantine(raw, clock.now().toISOString());
      return createDefaultSave(deps.clock);
    }
    return save;
  }

  function save(next: GameSaveV1): SaveResult {
    if (adapter === null) return { ok: false, reason: "security" };

    const valid = gameSaveV1Schema.safeParse(next);
    if (!valid.success) return { ok: false, reason: "serialize" };

    let serialized: string;
    try {
      serialized = JSON.stringify(valid.data);
    } catch {
      return { ok: false, reason: "serialize" };
    }
    return adapter.write(serialized);
  }

  return {
    load,
    save,

    reset(): void {
      adapter?.clear();
    },

    exportJson(): Blob {
      return new Blob([JSON.stringify(load(), null, 2)], {
        type: "application/json",
      });
    },

    importJson(text: string): ImportResult {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(text);
      } catch {
        return { ok: false, reason: "parse" };
      }

      const incoming = parseSave(parsedJson, fallbackValues());
      if (incoming === null) return { ok: false, reason: "schema" };

      const merged = mergeSaves(load(), incoming);
      return { ok: true, merged, preview: buildImportPreview(merged) };
    },

    subscribeExternalChange(
      listener: (merged: GameSaveV1) => void,
    ): () => void {
      if (typeof window === "undefined" || adapter === null) {
        return (): void => {
          // ไม่มีอะไรให้ยกเลิก
        };
      }

      const onStorage = (event: StorageEvent): void => {
        if (event.key !== null && event.key !== SAVE_KEY) return;
        // อ่านใหม่ทั้งหมดแล้ว merge เพื่อกันความก้าวหน้าถอยหลังจากอีกแท็บ
        listener(load());
      };

      window.addEventListener("storage", onStorage);
      return (): void => {
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
