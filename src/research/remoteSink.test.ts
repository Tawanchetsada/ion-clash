import { describe, expect, it, vi } from "vitest";
import { emptyErrorTally } from "../domain/chemistry/types";
import { createFakeStorage } from "../storage/__fixtures__/fakeStorage";
import { createRemoteSink, RESEARCH_QUEUE_KEY } from "./remoteSink";
import type { ResearchEvent } from "./types";

describe("RemoteResearchSink", () => {
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

  it("เมื่อ enabled: false จะไม่เรียก fetch และไม่เก็บลงคิว", () => {
    const fake = createFakeStorage();
    const mockFetch = vi.fn();
    const sink = createRemoteSink({
      endpoint: "https://example.com/api",
      enabled: false,
      storage: fake,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    sink.record(sampleEvent);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(fake.getItem(RESEARCH_QUEUE_KEY)).toBeNull();
  });

  it("เมื่อ endpoint ไม่มีค่า จะไม่เรียก fetch", () => {
    const fake = createFakeStorage();
    const mockFetch = vi.fn();
    const sink = createRemoteSink({
      endpoint: undefined,
      enabled: true,
      storage: fake,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    sink.record(sampleEvent);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(fake.getItem(RESEARCH_QUEUE_KEY)).toBeNull();
  });

  it("ส่งสำเร็จ: เรียก fetch และไม่มีอะไรค้างในคิว", async () => {
    const fake = createFakeStorage();
    const mockFetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const sink = createRemoteSink({
      endpoint: "https://example.com/api",
      enabled: true,
      storage: fake,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    sink.record(sampleEvent);

    // รอ microtask ให้ promise ทำงาน
    await new Promise((r) => setTimeout(r, 10));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(fake.getItem(RESEARCH_QUEUE_KEY)).toBeNull();
  });

  it("ส่งล้มเหลว (500 หรือ throw): event ถูกเก็บเข้าคิว", async () => {
    const fake = createFakeStorage();
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network Error"));
    const sink = createRemoteSink({
      endpoint: "https://example.com/api",
      enabled: true,
      storage: fake,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    sink.record(sampleEvent);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const queueRaw = fake.getItem(RESEARCH_QUEUE_KEY);
    expect(queueRaw).not.toBeNull();
    const queued = JSON.parse(queueRaw!);
    expect(queued).toEqual([sampleEvent]);
  });

  it("flush() ส่ง event ที่ค้างในคิวซ้ำ และเคลียร์คิวเมื่อสำเร็จ", async () => {
    const fake = createFakeStorage({
      [RESEARCH_QUEUE_KEY]: JSON.stringify([sampleEvent]),
    });

    const mockFetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const sink = createRemoteSink({
      endpoint: "https://example.com/api",
      enabled: true,
      storage: fake,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    await sink.flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(fake.getItem(RESEARCH_QUEUE_KEY)).toBeNull();
  });

  it("timeout แล้วไม่ throw และเข้าคิว", async () => {
    const fake = createFakeStorage();
    // จำลอง fetch ที่ค้างยาว
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_, reject) => {
        init.signal.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      });
    });

    const sink = createRemoteSink({
      endpoint: "https://example.com/api",
      enabled: true,
      storage: fake,
      fetchImpl: mockFetch as unknown as typeof fetch,
      timeoutMs: 50, // สั้นลงสำหรับเทสต์
    });

    expect(() => sink.record(sampleEvent)).not.toThrow();

    await new Promise((r) => setTimeout(r, 100));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const queueRaw = fake.getItem(RESEARCH_QUEUE_KEY);
    expect(queueRaw).not.toBeNull();
  });
});
