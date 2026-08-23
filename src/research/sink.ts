import type { ResearchEvent } from "./types";

export interface ResearchSink {
  record(event: ResearchEvent): void;
  flush(): Promise<void>;
}

export function createCompositeSink(
  sinks: readonly ResearchSink[],
): ResearchSink {
  return {
    record(event: ResearchEvent) {
      for (const sink of sinks) {
        try {
          sink.record(event);
        } catch {
          // ป้องกันไม่ให้ sink ตัวหนึ่งทำลายการทำงานของตัวอื่น
        }
      }
    },
    async flush() {
      await Promise.allSettled(sinks.map((sink) => sink.flush()));
    },
  };
}
