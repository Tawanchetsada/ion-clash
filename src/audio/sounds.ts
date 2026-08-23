export type SoundKey = "place" | "correct" | "wrong" | "gold" | "levelup";

/**
 * 5 เสียงตามข้อ 5.7 — วางการ์ด, ตอบถูก, ตอบผิด, ตะกอนเกิดเป็นการ์ดทอง, ผ่านด่าน
 * ไฟล์จริงอยู่ที่ public/audio/ ผลิตจาก scripts/prepare-audio.ts (ดู CREDITS.md
 * ในโฟลเดอร์นั้นสำหรับที่มา — Kenney CC0 ตาม D-17)
 */
export const SOUND_FILES: Readonly<Record<SoundKey, string>> = {
  place: "/audio/place.wav",
  correct: "/audio/correct.wav",
  wrong: "/audio/wrong.wav",
  gold: "/audio/gold.wav",
  levelup: "/audio/levelup.wav",
};
