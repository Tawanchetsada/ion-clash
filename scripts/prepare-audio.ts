import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

/**
 * ลดขนาดไฟล์เสียง WAV ต้นฉบับจาก Kenney (Calinou/kenney-* บน GitHub, CC0)
 * ให้รวมกันไม่เกิน 100 KB ตามงบ performance ในสเปก
 *
 * เครื่องนี้ไม่มี ffmpeg และ Kenney แจกต้นฉบับเป็น .ogg ซึ่ง Safari บน iPad
 * เล่นไม่ได้เลย จึงต้องเขียนตัวลดขนาด WAV เองแบบไม่พึ่งไลบรารีใด — WAV เป็น
 * แค่ header บวก PCM ดิบ ตัดต่อและคำนวณใหม่ได้ตรง ๆ ด้วย Node ล้วน
 *
 * ขั้นตอน: stereo -> mono (เฉลี่ยสองแชนแนล) -> ลด sample rate ครึ่งหนึ่งด้วย
 * box filter (เฉลี่ยคู่ตัวอย่างแทนการสุ่มทิ้ง กันเสียงแตก) -> ตัดความเงียบ
 * หัวและท้ายไฟล์ทิ้ง เสียง UI สั้น ๆ พวกนี้ไม่ต้องการความละเอียดสูง
 *
 * ไฟล์ต้นฉบับ (scripts/audio-src/) ไม่ถูก commit เข้า repo เพราะเป็นแค่วัตถุดิบ
 * ที่โหลดซ้ำได้เสมอ — สคริปต์นี้โหลดให้เองถ้ายังไม่มีในเครื่อง
 */

const SRC_DIR = join(import.meta.dirname, "audio-src");
const OUT_DIR = join(import.meta.dirname, "..", "public", "audio");
const CREDITS_PATH = join(OUT_DIR, "CREDITS.md");
const TARGET_SAMPLE_RATE = 22_050;
const SILENCE_AMPLITUDE = 400; // จาก max 32767 — ต่ำกว่านี้ถือว่าเงียบ

const KENNEY_INTERFACE_SOUNDS =
  "https://raw.githubusercontent.com/Calinou/kenney-interface-sounds/master/addons/kenney_interface_sounds";

/** ไฟล์ต้นฉบับ 5 ไฟล์ — ชื่อซ้ายคือไฟล์ผลลัพธ์ ตรงกับ src/audio/sounds.ts */
const SOURCES: Readonly<Record<string, string>> = {
  "place.wav": `${KENNEY_INTERFACE_SOUNDS}/drop_002.wav`,
  "correct.wav": `${KENNEY_INTERFACE_SOUNDS}/confirmation_001.wav`,
  "wrong.wav": `${KENNEY_INTERFACE_SOUNDS}/error_002.wav`,
  "gold.wav": `${KENNEY_INTERFACE_SOUNDS}/confirmation_003.wav`,
  "levelup.wav": `${KENNEY_INTERFACE_SOUNDS}/confirmation_004.wav`,
};

async function ensureSources(): Promise<void> {
  mkdirSync(SRC_DIR, { recursive: true });

  for (const [fileName, url] of Object.entries(SOURCES)) {
    const path = join(SRC_DIR, fileName);
    if (existsSync(path)) continue;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`โหลด ${url} ไม่สำเร็จ (${response.status})`);
    }
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
    console.log(`โหลดแล้ว: ${fileName}`);
  }
}

type WavChunks = {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
  data: Buffer;
};

function parseWav(buffer: Buffer): WavChunks {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("ไม่ใช่ไฟล์ WAV ที่ถูกต้อง");
  }

  let offset = 12;
  let fmt: { numChannels: number; sampleRate: number; bitsPerSample: number } | null = null;
  let data: Buffer | null = null;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const bodyStart = offset + 8;

    if (chunkId === "fmt ") {
      fmt = {
        numChannels: buffer.readUInt16LE(bodyStart + 2),
        sampleRate: buffer.readUInt32LE(bodyStart + 4),
        bitsPerSample: buffer.readUInt16LE(bodyStart + 14),
      };
    } else if (chunkId === "data") {
      data = buffer.subarray(bodyStart, bodyStart + chunkSize);
    }

    offset = bodyStart + chunkSize + (chunkSize % 2); // chunk คี่ไบต์มี padding 1 ไบต์
  }

  if (!fmt || !data) throw new Error("ไม่พบ chunk fmt หรือ data");
  if (fmt.bitsPerSample !== 16) {
    throw new Error(`รองรับเฉพาะ PCM 16-bit ไฟล์นี้เป็น ${fmt.bitsPerSample}-bit`);
  }

  return { numChannels: fmt.numChannels, sampleRate: fmt.sampleRate, bitsPerSample: 16, data };
}

/**
 * อ่านตัวอย่างเสียงทีละ 2 ไบต์ด้วย `readInt16LE` แทนการสร้าง Int16Array ทับ
 * `Buffer.buffer` ตรง ๆ — Node จัดสรร Buffer เล็ก ๆ จาก pool ภายในที่ byteOffset
 * อาจเป็นเลขคี่ได้ ซึ่งจะทำให้สร้าง Int16Array (ต้อง align 2 ไบต์) พังกลางทาง
 */
function readSamples(buffer: Buffer): Int16Array {
  const count = Math.floor(buffer.length / 2);
  const samples = new Int16Array(count);
  for (let i = 0; i < count; i++) {
    samples[i] = buffer.readInt16LE(i * 2);
  }
  return samples;
}

/** stereo -> mono ด้วยการเฉลี่ยสองแชนแนล เป็น no-op ถ้าเป็น mono อยู่แล้ว */
function toMono(samples: Int16Array, numChannels: number): Int16Array {
  if (numChannels === 1) return samples;
  if (numChannels !== 2) throw new Error(`รองรับแค่ mono หรือ stereo ได้ ${numChannels} แชนแนล`);

  const mono = new Int16Array(samples.length / 2);
  for (let i = 0; i < mono.length; i++) {
    const left = samples[i * 2] ?? 0;
    const right = samples[i * 2 + 1] ?? 0;
    mono[i] = Math.round((left + right) / 2);
  }
  return mono;
}

/** ลด sample rate ลงครึ่งหนึ่งด้วย box filter — เฉลี่ยคู่ตัวอย่างแทนการสุ่มทิ้ง */
function halveSampleRate(samples: Int16Array): Int16Array {
  const out = new Int16Array(Math.ceil(samples.length / 2));
  for (let i = 0; i < out.length; i++) {
    const a = samples[i * 2] ?? 0;
    const b = samples[i * 2 + 1] ?? a;
    out[i] = Math.round((a + b) / 2);
  }
  return out;
}

/** ตัดความเงียบหัวและท้ายไฟล์ทิ้ง — เสียง UI สั้น ๆ ไม่ต้องการช่วงเงียบนำ/ตาม */
function trimSilence(samples: Int16Array): Int16Array {
  let start = 0;
  while (start < samples.length && Math.abs(samples[start] ?? 0) < SILENCE_AMPLITUDE) start++;

  let end = samples.length;
  while (end > start && Math.abs(samples[end - 1] ?? 0) < SILENCE_AMPLITUDE) end--;

  return samples.subarray(start, end);
}

function writeWav(samples: Int16Array, sampleRate: number, outPath: string): void {
  const dataBytes = samples.length * 2;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // PCM fmt chunk size
  header.writeUInt16LE(1, 20); // audioFormat = PCM
  header.writeUInt16LE(1, 22); // numChannels = mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byteRate = sampleRate * blockAlign
  header.writeUInt16LE(2, 32); // blockAlign = 16-bit mono
  header.writeUInt16LE(16, 34); // bitsPerSample
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataBytes, 40);

  const body = Buffer.alloc(dataBytes);
  for (let i = 0; i < samples.length; i++) {
    body.writeInt16LE(samples[i] ?? 0, i * 2);
  }

  writeFileSync(outPath, Buffer.concat([header, body]));
}

function processFile(fileName: string): number {
  const inPath = join(SRC_DIR, fileName);
  const wav = parseWav(readFileSync(inPath));

  let samples = toMono(readSamples(wav.data), wav.numChannels);
  let sampleRate = wav.sampleRate;

  while (sampleRate > TARGET_SAMPLE_RATE * 1.5) {
    samples = halveSampleRate(samples);
    sampleRate = Math.round(sampleRate / 2);
  }

  samples = trimSilence(samples);

  const outPath = join(OUT_DIR, fileName);
  writeWav(samples, sampleRate, outPath);
  return statSync(outPath).size;
}

async function main(): Promise<void> {
  await ensureSources();
  mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(SRC_DIR).filter((entry) => entry.endsWith(".wav"));
  if (files.length === 0) {
    throw new Error(`ไม่พบไฟล์ .wav ต้นฉบับใน ${SRC_DIR}`);
  }

  let total = 0;
  for (const file of files) {
    const size = processFile(file);
    total += size;
    console.log(`${basename(file)}: ${size} bytes`);
  }
  console.log(`รวม: ${total} bytes (${(total / 1024).toFixed(1)} KB)`);

  if (total > 100 * 1024) {
    throw new Error("ไฟล์เสียงรวมกันเกิน 100 KB ตามงบ performance ในสเปก");
  }

  writeFileSync(
    CREDITS_PATH,
    `# ที่มาของไฟล์เสียง

ไฟล์ .wav ในโฟลเดอร์นี้ลดขนาดจากต้นฉบับของ Kenney (CC0 — ไม่ต้องให้เครดิต แต่บันทึกไว้
เพื่อให้ตามรอยได้สำหรับเล่มวิทยานิพนธ์ ตาม D-17 ใน development-plan/00-decisions.md)

| ไฟล์ | ต้นฉบับ | ที่มา |
|---|---|---|
| place.wav | drop_002.wav | Kenney Interface Sounds (ผ่าน Calinou/kenney-interface-sounds, .wav) |
| correct.wav | confirmation_001.wav | Kenney Interface Sounds |
| wrong.wav | error_002.wav | Kenney Interface Sounds |
| gold.wav | confirmation_003.wav | Kenney Interface Sounds |
| levelup.wav | confirmation_004.wav | Kenney Interface Sounds |

ต้นฉบับที่ kenney.nl แจกเป็น .ogg ล้วน ซึ่ง Safari บน iPad เล่นไม่ได้ — ใช้ไฟล์ .wav
ที่แปลงไว้แล้วแบบไม่สูญเสียคุณภาพจาก https://github.com/Calinou/kenney-interface-sounds
และ https://github.com/Calinou/kenney-ui-audio แทน แล้วลดขนาดต่อด้วย
\`scripts/prepare-audio.ts\` (mono, ลด sample rate ครึ่งหนึ่ง, ตัดความเงียบหัวท้าย)

สัญญาอนุญาตต้นฉบับ: CC0 1.0 Universal — https://kenney.nl/assets/interface-sounds และ
https://kenney.nl/assets/ui-audio
`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
