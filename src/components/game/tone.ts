import type { CardTone } from "../../presentation/cards";

/** สีของการ์ดตามบทบาทเคมี — ใช้ร่วมกันทุก component ในกลุ่ม game */
export const TONE_CLASS: Readonly<Record<CardTone, string>> = {
  cation: "bg-blue text-white",
  anion: "bg-green text-white",
  gold: "bg-gold text-navy",
  neutral: "border border-border bg-panel text-navy",
};
