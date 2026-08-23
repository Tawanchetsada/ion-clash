import type { CardTone } from "../../presentation/cards";

/** สีของการ์ดตามบทบาทเคมี — ใช้ร่วมกันทุก component ในกลุ่ม game */
export const TONE_CLASS: Readonly<Record<CardTone, string>> = {
  cation: "bg-blue text-white",
  anion: "bg-green-ink text-white",
  gold: "bg-gold text-navy",
  // เส้นขอบเป็นหน้าที่ของ GameCardFace (border-2) — ถ้าใส่ `border` (1px)
  // ซ้ำที่นี่ด้วย จะได้คลาสความหนาสองค่าชนกันแล้วผลลัพธ์ขึ้นกับลำดับใน CSS
  neutral: "bg-panel text-navy",
};
