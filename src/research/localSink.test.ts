import { describe, expect, it } from "vitest";
import { emptyErrorTally } from "../domain/chemistry/types";
import { RESEARCH_KEY } from "../storage/keys";
import {
  createFakeStorage,
  createQuotaError,
} from "../storage/__fixtures__/fakeStorage";
import { createLocalSink } from "./localSink";
import type { ResearchEvent } from "./types";

describe("LocalResearchSink", () => {
  const sampleEvent: ResearchEvent = {
    playerName: "Student-01",
    installId: "inst-1",
    levelId: 1,
    attemptNo: 1,
    startedAt: "2026-08-23T08:00:00.000Z",
    finishedAt: "2026-08-23T08:02:00.000Z",
    elapsedMs: 120000,
    completed: true,
    score: 100,
    stars: 3,
    hintsUsed: 0,
    wrongAttempts: 0,
    errorsByCode: emptyErrorTally(),
  };

  it("บันทึกลง storage และอ่านกลับได้ถูกต้อง", () => {
    const fake = createFakeStorage();
    const sink = createLocalSink(fake);

    expect(sink.readAll()).toEqual([]);

    sink.record(sampleEvent);

    const stored = sink.readAll();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(sampleEvent);

    // ตรวจสอบว่าเก็บใน RESEARCH_KEY จริง
    const rawInStorage = fake.getItem(RESEARCH_KEY);
    expect(rawInStorage).not.toBeNull();
    expect(JSON.parse(rawInStorage!)).toEqual([sampleEvent]);
  });

  it("สะสมหลาย event ต่อกันได้", () => {
    const fake = createFakeStorage();
    const sink = createLocalSink(fake);

    sink.record(sampleEvent);
    sink.record({
      ...sampleEvent,
      levelId: 2,
      score: 80,
    });

    const stored = sink.readAll();
    expect(stored).toHaveLength(2);
    expect(stored[0]?.levelId).toBe(1);
    expect(stored[1]?.levelId).toBe(2);
  });

  it("เมื่อ storage เป็น null ยังทำงานในหน่วยความจำและไม่ throw", () => {
    const sink = createLocalSink(null);

    expect(() => sink.record(sampleEvent)).not.toThrow();

    const stored = sink.readAll();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(sampleEvent);
  });

  it("เมื่อ storage โยน QuotaExceededError จะ fallback ลงหน่วยความจำและไม่ throw", () => {
    const fake = createFakeStorage();
    const sink = createLocalSink(fake);

    // บันทึก event แรกสำเร็จ
    sink.record(sampleEvent);

    // จำลอง quota เต็ม
    fake.failWith(createQuotaError());

    // บันทึก event ที่สอง ต้องไม่ throw
    expect(() => {
      sink.record({
        ...sampleEvent,
        levelId: 2,
      });
    }).not.toThrow();

    // ข้อมูลทั้งหมดยังคงอยู่ใน memory
    const stored = sink.readAll();
    expect(stored).toHaveLength(2);
  });

  it("clear() ล้างข้อมูลทั้งใน storage และในหน่วยความจำ", () => {
    const fake = createFakeStorage();
    const sink = createLocalSink(fake);

    sink.record(sampleEvent);
    expect(sink.readAll()).toHaveLength(1);

    sink.clear();
    expect(sink.readAll()).toHaveLength(0);
    expect(fake.getItem(RESEARCH_KEY)).toBeNull();
  });
});
