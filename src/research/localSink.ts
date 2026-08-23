import { RESEARCH_KEY } from "../storage/keys";
import type { StorageLike } from "../storage/localStorageAdapter";
import type { ResearchSink } from "./sink";
import type { ResearchEvent } from "./types";

export type LocalResearchSink = ResearchSink & {
  readAll(): readonly ResearchEvent[];
  clear(): void;
};

export function createLocalSink(
  storage: StorageLike | null,
): LocalResearchSink {
  let memoryEvents: ResearchEvent[] = [];

  // โหลดข้อมูลเริ่มต้นจาก storage
  if (storage) {
    try {
      const raw = storage.getItem(RESEARCH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryEvents = parsed as ResearchEvent[];
        }
      }
    } catch {
      // ข้ามหากอ่านไม่สำเร็จ
    }
  }

  return {
    record(event: ResearchEvent): void {
      memoryEvents = [...memoryEvents, event];
      if (storage) {
        try {
          storage.setItem(RESEARCH_KEY, JSON.stringify(memoryEvents));
        } catch {
          // เมื่อเกิด QuotaExceededError หรือ error อื่น ให้เก็บต่อใน memoryEvents โดยไม่ throw
        }
      }
    },

    async flush(): Promise<void> {
      return Promise.resolve();
    },

    readAll(): readonly ResearchEvent[] {
      return [...memoryEvents];
    },

    clear(): void {
      memoryEvents = [];
      if (storage) {
        try {
          storage.removeItem(RESEARCH_KEY);
        } catch {
          // ignore
        }
      }
    },
  };
}
