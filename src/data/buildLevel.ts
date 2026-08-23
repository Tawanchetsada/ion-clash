import { buildCompoundById } from "../domain/chemistry/compounds";
import { getIon } from "../domain/chemistry/ions";
import {
  aqueousProductOf,
  buildReaction,
  precipitateOf,
} from "../domain/chemistry/reaction";
import { explainPhase } from "../domain/chemistry/solubility";
import { buildCompleteIonic, findSpectators } from "../domain/chemistry/spectators";
import { buildNetIonic } from "../domain/chemistry/netIonic";
import type {
  CompoundDef,
  Coefficients,
  IonicEquation,
  NetIonicEquation,
  SpectatorPair,
} from "../domain/chemistry/types";
import type { Difficulty, LevelSeed } from "./levelSeeds";

export type BuiltLevel = {
  id: number;
  difficulty: Difficulty;
  reactantA: CompoundDef;
  reactantB: CompoundDef;
  productA: CompoundDef;
  productB: CompoundDef;
  coefficients: Coefficients;
  precipitate: CompoundDef;
  aqueousProduct: CompoundDef;
  completeIonic: IonicEquation;
  netIonic: NetIonicEquation;
  spectators: readonly SpectatorPair[];
  /** [ระดับ 1, ระดับ 2, ระดับ 3] ตาม D-05 — สร้างจากแม่แบบที่อนุมัติแล้ว
   * บวกข้อมูลโครงสร้างของด่านนี้ ไม่ใช่เนื้อหาที่เดาเอง Phase 8 ปรับสำนวน
   * เพิ่มเติมได้ทีหลังโดยไม่ต้องแก้ฟังก์ชันนี้ */
  hints: readonly [string, string, string];
};

/**
 * แม่แบบคำใบ้ 3 ระดับตาม D-05 และ Phase 8:
 * - ระดับ 1: แตกต่างกันตาม 5 ช่วงความยาก (ง่าย / พื้นฐาน / ปานกลาง / ยาก / ท้าทาย)
 * - ระดับ 2: ชี้ไอออนบวกตัวการด้วยชื่อไทยมาตรฐาน
 * - ระดับ 3: หากเป็นด่านที่ต้องดุล ให้คำใบ้เรื่องประจุและสัมประสิทธิ์ หากไม่ต้องดุลให้คำใบ้กฎการละลาย
 * ไม่มีสูตรของตะกอนปรากฏในข้อความใด ๆ ตามข้อห้ามข้อ 11
 */
function generateHints(
  difficulty: Difficulty,
  precipitate: CompoundDef,
  coefficients: Coefficients,
): readonly [string, string, string] {
  const causalCation = getIon(precipitate.cationId);
  const causalAnion = getIon(precipitate.anionId);
  const { rule } = explainPhase(precipitate.cationId, precipitate.anionId);

  let hint1 = "";
  switch (difficulty) {
    case "easy":
      hint1 =
        "ปฏิกิริยานี้เกิดจากการแลกคู่ระหว่างไอออนบวกกับไอออนลบที่มาจากคนละสาร ลองจับคู่ใหม่แล้วดูว่าคู่ไหนไม่ละลายน้ำ";
      break;
    case "basic":
      hint1 =
        "สารตั้งต้นแตกตัวเป็นไอออนในสารละลาย ลองสลับคู่ไอออนบวกกับไอออนลบเพื่อหาคู่ผลิตภัณฑ์ที่ตกตะกอน";
      break;
    case "medium":
      hint1 =
        "พิจารณาการแลกเปลี่ยนคู่ระหว่างแคตไอออนกับแอนไอออน แล้วสังเกตสมบัติการละลายน้ำของสารประกอบที่เกิดขึ้น";
      break;
    case "hard":
      hint1 =
        "พิจารณาชนิดและประจุของไอออนโลหะทรานซิชันในการแลกเปลี่ยนคู่ผลิตภัณฑ์ที่ไม่ละลายน้ำ";
      break;
    case "challenge":
      hint1 =
        "วิเคราะห์การแลกเปลี่ยนคู่ไอออนที่มีประจุหลากหลาย เพื่อระบุคู่สารประกอบที่เกิดเป็นตะกอน";
      break;
  }

  const hint2 = `ลองพิจารณาว่า${causalCation.nameStemTh}ไอออนจับกับไอออนลบตัวใดแล้วได้สารที่ไม่ละลายน้ำ`;

  const requiresBalancing =
    coefficients.a !== 1 ||
    coefficients.b !== 1 ||
    coefficients.c !== 1 ||
    coefficients.d !== 1;

  let hint3 = "";
  if (requiresBalancing) {
    hint3 = `ประจุของ${causalCation.nameStemTh}เป็น ${causalCation.charge > 0 ? "+" : ""}${causalCation.charge} จึงต้องพิจารณาว่าใช้${causalAnion.nameStemTh}กี่ตัวเพื่อให้ประจุรวมเป็นศูนย์และดุลสัมประสิทธิ์ของสมการให้ถูกต้อง`;
  } else {
    hint3 = `กฎ: ${rule.descriptionTh} ลองใช้กฎนี้ตัดสินว่าผลิตภัณฑ์ตัวใดเป็นตะกอน`;
  }

  return [hint1, hint2, hint3];
}

/**
 * ขยาย seed เป็นข้อมูลด่านครบชุด — คำนวณทุกอย่างที่คำนวณได้จาก Phase 1
 * แทนการ hard-code เพื่อไม่ให้ข้อมูลขัดแย้งกันเองเมื่อแก้กฎการละลาย
 *
 * throw ทันทีถ้าด่านใดผิดหลักเคมี (ไม่ balance ได้ / ไม่ได้ตะกอนตัวเดียว
 * / spectator ไม่เท่ากันสองข้าง) เพราะ levels.ts import ไฟล์นี้ตอน build
 * จึงเป็น build-time validation ในตัว ไม่ต้องรอ test แยก
 */
export function buildLevel(seed: LevelSeed): BuiltLevel {
  const reactantA = buildCompoundById(seed.reactantA.cation, seed.reactantA.anion);
  const reactantB = buildCompoundById(seed.reactantB.cation, seed.reactantB.anion);

  const model = buildReaction(reactantA, reactantB);
  const precipitate = precipitateOf(model);
  const aqueousProduct = aqueousProductOf(model);
  const completeIonic = buildCompleteIonic(model);
  const netIonic = buildNetIonic(model);
  const spectators = findSpectators(model);

  return {
    id: seed.id,
    difficulty: seed.difficulty,
    reactantA: model.reactantA,
    reactantB: model.reactantB,
    productA: model.productA,
    productB: model.productB,
    coefficients: model.coefficients,
    precipitate,
    aqueousProduct,
    completeIonic,
    netIonic,
    spectators,
    hints: generateHints(seed.difficulty, precipitate, model.coefficients),
  };
}
