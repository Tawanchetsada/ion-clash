import { describe, expect, it, vi } from "vitest";
import { AudioEngine } from "./engine";
import { SOUND_FILES } from "./sounds";
import type { MinimalAudioContext } from "./engine";

function fakeContext(state: "suspended" | "running" = "suspended") {
  const resume = vi.fn().mockImplementation(async () => {
    ctx.state = "running";
  });
  const start = vi.fn();
  const connect = vi.fn();
  const createBufferSource = vi.fn(() => ({ buffer: null as unknown, connect, start }));

  const ctx: MinimalAudioContext = {
    state,
    resume,
    decodeAudioData: vi.fn(async (data: ArrayBuffer) => ({ decoded: true, byteLength: data.byteLength })),
    createBufferSource,
    destination: {},
  };

  return { ctx, resume, start, connect, createBufferSource };
}

describe("AudioEngine", () => {
  it("unlock() เรียก resume() เมื่อ context ยังถูก suspend อยู่ (กติกา user gesture ของ iOS)", async () => {
    const { ctx, resume } = fakeContext("suspended");
    const engine = new AudioEngine({ createContext: () => ctx });

    await engine.unlock();

    expect(resume).toHaveBeenCalledOnce();
  });

  it("unlock() ไม่เรียก resume() ซ้ำถ้า context ทำงานอยู่แล้ว", async () => {
    const { ctx, resume } = fakeContext("running");
    const engine = new AudioEngine({ createContext: () => ctx });

    await engine.unlock();

    expect(resume).not.toHaveBeenCalled();
  });

  it("preload() โหลดและถอดรหัสครบทั้ง 5 ไฟล์", async () => {
    const { ctx } = fakeContext();
    const fetchAudio = vi.fn(async () => new ArrayBuffer(8));
    const engine = new AudioEngine({ createContext: () => ctx, fetchAudio });

    await engine.preload();

    expect(fetchAudio).toHaveBeenCalledTimes(Object.keys(SOUND_FILES).length);
    for (const url of Object.values(SOUND_FILES)) {
      expect(fetchAudio).toHaveBeenCalledWith(url);
    }
  });

  it("play() เงียบ ๆ ไม่ throw เมื่อยังไม่ preload — เสียงเป็นส่วนเสริมเท่านั้น", () => {
    const { ctx, start } = fakeContext();
    const engine = new AudioEngine({ createContext: () => ctx });

    expect(() => engine.play("correct", { enabled: true })).not.toThrow();
    expect(start).not.toHaveBeenCalled();
  });

  it("play() ไม่เล่นเสียงเมื่อ enabled: false แม้โหลดเสร็จแล้ว", async () => {
    const { ctx, start } = fakeContext();
    const fetchAudio = vi.fn(async () => new ArrayBuffer(8));
    const engine = new AudioEngine({ createContext: () => ctx, fetchAudio });
    await engine.preload();

    engine.play("correct", { enabled: false });

    expect(start).not.toHaveBeenCalled();
  });

  it("play() หลัง preload สร้าง buffer source และ start จริง", async () => {
    const { ctx, start, connect } = fakeContext();
    const fetchAudio = vi.fn(async () => new ArrayBuffer(8));
    const engine = new AudioEngine({ createContext: () => ctx, fetchAudio });
    await engine.preload();

    engine.play("gold", { enabled: true });

    expect(connect).toHaveBeenCalledWith(ctx.destination);
    expect(start).toHaveBeenCalledOnce();
  });
});
