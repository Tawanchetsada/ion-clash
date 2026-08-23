import type { StorageLike } from "../storage/localStorageAdapter";
import type { ResearchSink } from "./sink";
import type { ResearchEvent } from "./types";

export const RESEARCH_QUEUE_KEY = "ion-clash:research:queue:v1";
const DEFAULT_TIMEOUT_MS = 5000;

export type RemoteSinkOptions = {
  endpoint: string | undefined;
  enabled: boolean;
  storage: StorageLike | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export function createRemoteSink(options: RemoteSinkOptions): ResearchSink {
  const {
    endpoint,
    enabled,
    storage,
    fetchImpl = typeof fetch !== "undefined" ? fetch : undefined,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  function loadQueue(): ResearchEvent[] {
    if (!storage) return [];
    try {
      const raw = storage.getItem(RESEARCH_QUEUE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as ResearchEvent[];
      }
      return [];
    } catch {
      return [];
    }
  }

  function saveQueue(queue: readonly ResearchEvent[]): void {
    if (!storage) return;
    try {
      if (queue.length === 0) {
        storage.removeItem(RESEARCH_QUEUE_KEY);
      } else {
        storage.setItem(RESEARCH_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch {
      // ignore
    }
  }

  function enqueue(event: ResearchEvent): void {
    const queue = loadQueue();
    queue.push(event);
    saveQueue(queue);
  }

  async function sendEvent(event: ResearchEvent): Promise<boolean> {
    if (!enabled || !endpoint || !fetchImpl) {
      return false;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
        mode: "no-cors",
        signal: controller.signal,
      });

      // ในโหมด no-cors response type คือ opaque (status 0) ถือว่าส่งสำเร็จ
      // แต่ถ้ามี status > 0 และ >= 400 ให้ถือว่าล้มเหลว
      if (res.status > 0 && res.status >= 400) {
        return false;
      }
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    record(event: ResearchEvent): void {
      if (!enabled || !endpoint) {
        return;
      }

      // Fire-and-forget: ยิงทันที หากล้มเหลวให้เก็บเข้าคิว
      sendEvent(event).then((success) => {
        if (!success) {
          enqueue(event);
        }
      }).catch(() => {
        enqueue(event);
      });
    },

    async flush(): Promise<void> {
      if (!enabled || !endpoint || !fetchImpl) {
        return;
      }

      const queue = loadQueue();
      if (queue.length === 0) return;

      const remaining: ResearchEvent[] = [];
      for (const event of queue) {
        const success = await sendEvent(event);
        if (!success) {
          remaining.push(event);
        }
      }

      saveQueue(remaining);
    },
  };
}
