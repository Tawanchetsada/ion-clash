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
 * แม่แบบคำใบ้ 3 ระดับตาม D-05 — ระดับ 1 คงที่ทุกด่าน ระดับ 2 และ 3 เติม
 * ชื่อไอออนบวกตัวการกับข้อความกฎการละลายที่ตัดสินด่านนี้จริง (จาก
 * solubility.ts ซึ่งเป็น source of truth เดียว) ไม่มีสูตรของตะกอนปรากฏใน
 * ข้อความใด ๆ ตามข้อห้ามข้อ 11
 */
function generateHints(precipitate: CompoundDef): readonly [string, string, string] {
  const causalCation = getIon(precipitate.cationId);
  const { rule } = explainPhase(precipitate.cationId, precipitate.anionId);

  return [
    "ปฏิกิริยานี้เกิดจากการแลกคู่ระหว่างไอออนบวกกับไอออนลบที่มาจากคนละสาร ลองจับคู่ใหม่แล้วดูว่าคู่ไหนไม่ละลายน้ำ",
    `ลองพิจารณาว่า${causalCation.nameStemTh}ไอออนจับกับไอออนลบตัวใดแล้วได้สารที่ไม่ละลายน้ำ`,
    `กฎ: ${rule.descriptionTh} ลองใช้กฎนี้ตัดสินว่าผลิตภัณฑ์ตัวใดเป็นตะกอน`,
  ];
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
    hints: generateHints(precipitate),
  };
}
