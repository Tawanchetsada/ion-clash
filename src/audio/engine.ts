import { SOUND_FILES } from "./sounds";
import type { SoundKey } from "./sounds";

/**
 * ส่วนของ AudioContext ที่ engine ใช้จริง — พิมพ์แบบขั้นต่ำเพื่อรับ mock
 * ในเทสต์ jsdom ได้ (jsdom ไม่มี Web Audio API จริง)
 */
export type MinimalAudioContext = {
  state: "suspended" | "running" | "closed";
  resume: () => Promise<void>;
  decodeAudioData: (data: ArrayBuffer) => Promise<unknown>;
  createBufferSource: () => {
    buffer: unknown;
    connect: (destination: unknown) => void;
    start: (when?: number) => void;
  };
  destination: unknown;
};

export type AudioEngineOptions = {
  createContext?: () => MinimalAudioContext;
  fetchAudio?: (url: string) => Promise<ArrayBuffer>;
};

/**
 * ตัวเล่นเสียงเบื้องหลัง — รับ factory ของ AudioContext และตัวโหลดไฟล์เข้ามา
 * (dependency injection) เพื่อให้ทดสอบได้ใน jsdom โดยไม่ต้องมี Web Audio จริง
 *
 * iOS ต้องปลดล็อก AudioContext ด้วย user gesture ก่อนเล่นเสียงครั้งแรกเสมอ
 * (ข้อ 5.7) — `unlock()` จึงแยกจาก `preload()` ผู้เรียกต้องเรียก unlock()
 * จาก event handler ของการกดปุ่มจริง ไม่ใช่จาก useEffect ที่รันเอง
 */
export class AudioEngine {
  private context: MinimalAudioContext | null = null;
  private readonly buffers = new Map<SoundKey, unknown>();
  private readonly createContext: () => MinimalAudioContext;
  private readonly fetchAudio: (url: string) => Promise<ArrayBuffer>;

  constructor(options: AudioEngineOptions = {}) {
    this.createContext =
      options.createContext ?? ((): MinimalAudioContext => new AudioContext() as unknown as MinimalAudioContext);
    this.fetchAudio =
      options.fetchAudio ?? ((url: string): Promise<ArrayBuffer> => fetch(url).then((r) => r.arrayBuffer()));
  }

  async unlock(): Promise<void> {
    this.context ??= this.createContext();
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  async preload(): Promise<void> {
    this.context ??= this.createContext();
    const context = this.context;

    await Promise.all(
      (Object.entries(SOUND_FILES) as [SoundKey, string][]).map(async ([key, url]) => {
        const data = await this.fetchAudio(url);
        const buffer = await context.decodeAudioData(data);
        this.buffers.set(key, buffer);
      }),
    );
  }

  /**
   * เล่นเสียง — เงียบ ๆ ไม่ throw เมื่อยังไม่ปลดล็อกหรือยังโหลดไม่เสร็จ
   * เพราะเสียงเป็นส่วนเสริมเท่านั้น ห้ามทำให้เกมพังเมื่อเสียงมีปัญหา
   */
  play(key: SoundKey, options: { enabled: boolean }): void {
    if (!options.enabled) return;
    const context = this.context;
    const buffer = this.buffers.get(key);
    if (!context || buffer === undefined) return;

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start();
  }
}
