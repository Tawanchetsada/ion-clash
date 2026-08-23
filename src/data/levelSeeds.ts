/**
 * ระดับความยาก — ต้องตรงกับช่วงเลขด่านเสมอ (ดู expectedDifficulty ใน levels.ts)
 * เป็นป้ายเชิงหลักสูตรตามตำแหน่งในลำดับการเรียน ไม่ใช่ค่าที่คำนวณจากความ
 * ซับซ้อนของสูตร เพราะหน้าเลือกด่านจัดกลุ่มตามช่วงเลขด่านกลุ่มละ 10 เป๊ะ
 */
export type Difficulty = "easy" | "basic" | "medium" | "hard" | "challenge";

/**
 * อ้างอิงถึง ionId ในทะเบียนของ Phase 1 (src/domain/chemistry/ions.ts)
 * เป็น string ธรรมดา ไม่ใช่ literal union เพราะ getIon() throw เมื่อพิมพ์ผิด
 * อยู่แล้ว และ levels.test.ts วนตรวจครบทั้ง 50 ด่านทุกครั้งที่รัน CI
 */
export type LevelSeed = {
  /** 1..50 คงที่ตลอดไป — ไฟล์ save ของนักเรียนอ้างอิงเลขนี้ ห้ามเปลี่ยน */
  id: number;
  difficulty: Difficulty;
  reactantA: { cation: string; anion: string };
  reactantB: { cation: string; anion: string };
};

/**
 * ร่างสมการ 50 ด่านตาม development-plan/03-phase-2-level-data.md ข้อ 2.2
 * ร่างจากกฎการละลายมาตรฐาน ม.4 — ยังไม่ผ่านการรับรองจากอาจารย์ (D-01)
 *
 * ลำดับ cation/anion ในแต่ละ reactant คือลำดับที่ปรากฏในสมการโมเลกุลของ
 * เอกสารตรง ๆ ไม่ต้องสลับ เพราะ buildReaction แลกคู่ให้เองและ precipitateOf
 * ค้นหาตะกอนจากทั้งสองผลิตภัณฑ์อยู่แล้ว ไม่ขึ้นกับว่าใครเป็น reactantA/B
 */
export const LEVEL_SEEDS: readonly LevelSeed[] = [
  // 01-10 · ง่าย · ตะกอนจาก Ag+ เท่านั้น ประจุ ±1 อัตราส่วน 1:1:1:1
  { id: 1, difficulty: "easy", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "chloride" } },
  { id: 2, difficulty: "easy", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "chloride" } },
  { id: 3, difficulty: "easy", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "ammonium", anion: "chloride" } },
  { id: 4, difficulty: "easy", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "bromide" } },
  { id: 5, difficulty: "easy", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "bromide" } },
  { id: 6, difficulty: "easy", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "ammonium", anion: "bromide" } },
  { id: 7, difficulty: "easy", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "iodide" } },
  { id: 8, difficulty: "easy", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "iodide" } },
  { id: 9, difficulty: "easy", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "thiocyanate" } },
  { id: 10, difficulty: "easy", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "thiocyanate" } },

  // 11-20 · พื้นฐาน · เริ่มมีประจุ ±2 และไอออนหลายอะตอม
  { id: 11, difficulty: "basic", reactantA: { cation: "barium-2plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "sulfate" } },
  { id: 12, difficulty: "basic", reactantA: { cation: "barium-2plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "sulfate" } },
  { id: 13, difficulty: "basic", reactantA: { cation: "lead-2plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "iodide" } },
  { id: 14, difficulty: "basic", reactantA: { cation: "lead-2plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "chloride" } },
  { id: 15, difficulty: "basic", reactantA: { cation: "calcium-2plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "carbonate" } },
  { id: 16, difficulty: "basic", reactantA: { cation: "calcium-2plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "carbonate" } },
  { id: 17, difficulty: "basic", reactantA: { cation: "barium-2plus", anion: "chloride" }, reactantB: { cation: "potassium-plus", anion: "carbonate" } },
  { id: 18, difficulty: "basic", reactantA: { cation: "magnesium-2plus", anion: "sulfate" }, reactantB: { cation: "sodium-plus", anion: "carbonate" } },
  { id: 19, difficulty: "basic", reactantA: { cation: "copper-2plus", anion: "sulfate" }, reactantB: { cation: "sodium-plus", anion: "sulfide" } },
  { id: 20, difficulty: "basic", reactantA: { cation: "lead-2plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "sulfate" } },

  // 21-30 · ปานกลาง · ตะกอนไฮดรอกไซด์ทั้งช่วง ต้องใส่วงเล็บและดุลหลายค่า
  //
  // ทั้ง 10 ด่านให้ตะกอน M(OH)n ซึ่งบังคับให้ผู้เรียนใส่วงเล็บทุกด่าน และไล่
  // ไอออนคู่เดิมสามแบบต่อโลหะหนึ่งตัว (คลอไรด์ / ไนเตรต / ซัลเฟต) เพื่อฝึก
  // ให้เห็นว่าไอออนผู้ชมเปลี่ยนแต่สมการสุทธิเหมือนเดิม
  //   Mg(OH)2 -> 21, 22, 28   Cu(OH)2 -> 23, 24, 25
  //   Fe(OH)2 -> 26, 27, 29   Pb(OH)2 -> 30
  { id: 21, difficulty: "medium", reactantA: { cation: "magnesium-2plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 22, difficulty: "medium", reactantA: { cation: "magnesium-2plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "hydroxide" } },
  { id: 23, difficulty: "medium", reactantA: { cation: "copper-2plus", anion: "sulfate" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 24, difficulty: "medium", reactantA: { cation: "copper-2plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 25, difficulty: "medium", reactantA: { cation: "copper-2plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 26, difficulty: "medium", reactantA: { cation: "iron-2plus", anion: "sulfate" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 27, difficulty: "medium", reactantA: { cation: "iron-2plus", anion: "chloride" }, reactantB: { cation: "potassium-plus", anion: "hydroxide" } },
  { id: 28, difficulty: "medium", reactantA: { cation: "magnesium-2plus", anion: "sulfate" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 29, difficulty: "medium", reactantA: { cation: "iron-2plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 30, difficulty: "medium", reactantA: { cation: "lead-2plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "hydroxide" } },

  // 31-40 · ยาก · โลหะแทรนซิชันหลายเลขออกซิเดชัน
  { id: 31, difficulty: "hard", reactantA: { cation: "iron-3plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 32, difficulty: "hard", reactantA: { cation: "iron-3plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "hydroxide" } },
  { id: 33, difficulty: "hard", reactantA: { cation: "aluminium-3plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 34, difficulty: "hard", reactantA: { cation: "aluminium-3plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 35, difficulty: "hard", reactantA: { cation: "iron-3plus", anion: "sulfate" }, reactantB: { cation: "sodium-plus", anion: "hydroxide" } },
  { id: 36, difficulty: "hard", reactantA: { cation: "aluminium-3plus", anion: "sulfate" }, reactantB: { cation: "potassium-plus", anion: "hydroxide" } },
  { id: 37, difficulty: "hard", reactantA: { cation: "iron-2plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "carbonate" } },
  { id: 38, difficulty: "hard", reactantA: { cation: "iron-2plus", anion: "sulfate" }, reactantB: { cation: "sodium-plus", anion: "sulfide" } },
  { id: 39, difficulty: "hard", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "sulfide" } },
  { id: 40, difficulty: "hard", reactantA: { cation: "aluminium-3plus", anion: "sulfate" }, reactantB: { cation: "barium-2plus", anion: "chloride" } },

  // 41-50 · ท้าทาย · ฟอสเฟตและสัมประสิทธิ์ใหญ่
  { id: 41, difficulty: "challenge", reactantA: { cation: "silver-plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "phosphate" } },
  { id: 42, difficulty: "challenge", reactantA: { cation: "calcium-2plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "phosphate" } },
  { id: 43, difficulty: "challenge", reactantA: { cation: "calcium-2plus", anion: "nitrate" }, reactantB: { cation: "potassium-plus", anion: "phosphate" } },
  { id: 44, difficulty: "challenge", reactantA: { cation: "magnesium-2plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "phosphate" } },
  { id: 45, difficulty: "challenge", reactantA: { cation: "copper-2plus", anion: "sulfate" }, reactantB: { cation: "sodium-plus", anion: "phosphate" } },
  { id: 46, difficulty: "challenge", reactantA: { cation: "iron-3plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "phosphate" } },
  { id: 47, difficulty: "challenge", reactantA: { cation: "aluminium-3plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "phosphate" } },
  { id: 48, difficulty: "challenge", reactantA: { cation: "barium-2plus", anion: "chloride" }, reactantB: { cation: "sodium-plus", anion: "phosphate" } },
  { id: 49, difficulty: "challenge", reactantA: { cation: "lead-2plus", anion: "nitrate" }, reactantB: { cation: "sodium-plus", anion: "phosphate" } },
  { id: 50, difficulty: "challenge", reactantA: { cation: "iron-3plus", anion: "sulfate" }, reactantB: { cation: "sodium-plus", anion: "phosphate" } },
];
