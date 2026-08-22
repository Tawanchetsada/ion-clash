import { z } from "zod";
import { starsForScore } from "../config/scoring";

/**
 * Schema ของไฟล์บันทึกความก้าวหน้า
 *
 * มีสองชุดโดยตั้งใจ เพราะ "รูปแบบที่ยอมรับตอนอ่านจากเครื่อง" กับ
 * "รูปแบบที่ถูกต้องในหน่วยความจำ" ไม่ใช่สิ่งเดียวกัน
 *
 *   storedSaveSchema  — หลวม ตรวจแค่ชนิดข้อมูล ใช้ตอนอ่านจากดิสก์
 *   gameSaveV1Schema  — เข้ม ตรวจช่วงค่าครบ ใช้เป็นด่านสุดท้ายหลังซ่อม
 *
 * **หลักการ: ปฏิเสธเฉพาะสิ่งที่อ่านไม่ออกจริง ๆ ที่เหลือให้ซ่อม**
 *
 * เหตุผลที่ไม่ใช้ schema เข้มตัวเดียวแล้วปฏิเสธทุกอย่างที่ไม่ตรง คือค่าคะแนน
 * ทั้งหมดถูกออกแบบให้ผู้วิจัยปรับได้หลังทดลองนำร่อง (D-12) วันที่แก้เกณฑ์ดาว
 * ไฟล์เซฟของนักเรียนทุกคนจะมีดาวไม่ตรงเกณฑ์ใหม่ทันที ถ้าถือว่าเป็นไฟล์เสีย
 * ข้อมูลการทดลองจะหายทั้งหมดเพราะแค่ปรับตัวเลข จึงต้องคำนวณดาวใหม่ให้แทน
 */

/** ด่านมี id 1..50 — ผูกกับข้อมูลจริงด้วยเทสต์ ไม่ผูกตอนรัน */
export const MAX_LEVEL_ID = 50;

export const CHECKPOINT_STATES = [
  "arrangeProductIons",
  "balanceEquation",
  "validateProducts",
  "cancelSpectatorIons",
] as const;

// ---------------------------------------------------------------- เข้มงวด

export const levelProgressSchema = z.object({
  completed: z.boolean(),
  bestScore: z.number().int().min(0).max(100),
  stars: z.literal([0, 1, 2, 3]),
  bestTimeMs: z.number().int().nonnegative().nullable(),
  attempts: z.number().int().nonnegative(),
  completedAt: z.iso.datetime().nullable(),
});

export const levelCheckpointSchema = z.object({
  levelId: z.number().int().min(1).max(MAX_LEVEL_ID),
  state: z.enum(CHECKPOINT_STATES),
  slotAssignments: z.array(
    z.object({ slotId: z.string(), ionInstanceId: z.string().nullable() }),
  ),
  coefficients: z.tuple([
    z.number().int().positive().nullable(),
    z.number().int().positive().nullable(),
    z.number().int().positive().nullable(),
    z.number().int().positive().nullable(),
  ]),
  canceledPairs: z.array(
    z.object({ leftInstanceId: z.string(), rightInstanceId: z.string() }),
  ),
  hintsUsed: z.number().int().min(0).max(3),
  wrongAttempts: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
  savedAt: z.iso.datetime(),
});

export const settingsSchema = z.object({
  sound: z.boolean(),
  music: z.boolean(),
  reducedMotion: z.boolean(),
});

export const gameSaveV1Schema = z.object({
  version: z.literal(1),
  installId: z.string().min(1),
  /** ชื่อผู้เล่นตาม D-14 — ต่างจาก spec เดิมที่ระบุว่าไม่เก็บชื่อ */
  playerName: z.string(),
  unlockedLevel: z.number().int().min(1).max(MAX_LEVEL_ID),
  completedLevels: z.record(z.string(), levelProgressSchema),
  lastPlayedLevel: z.number().int().min(1).max(MAX_LEVEL_ID),
  activeCheckpoint: levelCheckpointSchema.nullable(),
  settings: settingsSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type LevelProgress = z.infer<typeof levelProgressSchema>;
export type LevelCheckpoint = z.infer<typeof levelCheckpointSchema>;
export type GameSettings = z.infer<typeof settingsSchema>;
export type GameSaveV1 = z.infer<typeof gameSaveV1Schema>;
export type CheckpointState = (typeof CHECKPOINT_STATES)[number];

// ------------------------------------------------------------------ หลวม

/**
 * ด่านเดียวที่ไฟล์ต้องผ่านตอนอ่านคือ "เป็นวัตถุ และเป็นเซฟเวอร์ชัน 1"
 * ที่เหลือ normalizeSave ซ่อมได้ทั้งหมด
 *
 * เคยเขียนไว้ละเอียดกว่านี้โดยใส่ทุกฟิลด์เป็น z.unknown() แล้วพบว่า
 * **Zod v4 ถือว่า z.unknown() เป็นฟิลด์บังคับ** ไม่ใช่ฟิลด์ที่ขาดได้
 * ผลคือเซฟที่ขาดฟิลด์ใดฟิลด์หนึ่ง เช่นไฟล์เก่าที่บันทึกไว้ก่อนเพิ่มฟิลด์ใหม่
 * จะถูกตัดสินว่าเป็นไฟล์เสียแล้วโดนกักทั้งไฟล์ ซึ่งทำลายความก้าวหน้าของ
 * นักเรียนด้วยเหตุผลที่ซ่อมได้ง่าย ๆ — ตรงข้ามกับที่ชั้นนี้ตั้งใจจะทำ
 */
export const storedSaveSchema = z.looseObject({
  version: z.literal(1),
});

// --------------------------------------------------------------- ตัวช่วย

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function nonNegativeIntOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value);
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** คืนวันที่รูปแบบมาตรฐาน หรือ null ถ้าอ่านไม่ออก */
function isoOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function isValidLevelId(key: string): boolean {
  const id = Number(key);
  return Number.isInteger(id) && id >= 1 && id <= MAX_LEVEL_ID;
}

function normalizeProgress(raw: unknown): LevelProgress {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const bestScore = clampInt(source["bestScore"], 0, 100, 0);

  return {
    completed: boolOr(source["completed"], false),
    bestScore,
    // คำนวณใหม่เสมอ ไม่เชื่อค่าที่บันทึกไว้ — เกณฑ์ดาวเปลี่ยนได้
    stars: starsForScore(bestScore),
    bestTimeMs: nonNegativeIntOrNull(source["bestTimeMs"]),
    attempts: clampInt(source["attempts"], 0, Number.MAX_SAFE_INTEGER, 0),
    completedAt: isoOrNull(source["completedAt"]),
  };
}

function normalizeCheckpoint(raw: unknown): LevelCheckpoint | null {
  if (typeof raw !== "object" || raw === null) return null;
  const source = raw as Record<string, unknown>;

  const levelId = source["levelId"];
  if (typeof levelId !== "number" || !isValidLevelId(String(levelId))) {
    return null;
  }

  const state = source["state"];
  if (
    typeof state !== "string" ||
    !(CHECKPOINT_STATES as readonly string[]).includes(state)
  ) {
    return null;
  }

  const rawCoefficients = Array.isArray(source["coefficients"])
    ? source["coefficients"]
    : [];
  const coefficient = (index: number): number | null => {
    const value = rawCoefficients[index];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
      return null;
    }
    return Math.round(value);
  };

  const slotAssignments = Array.isArray(source["slotAssignments"])
    ? source["slotAssignments"].flatMap((entry): LevelCheckpoint["slotAssignments"] => {
        if (typeof entry !== "object" || entry === null) return [];
        const slot = entry as Record<string, unknown>;
        if (typeof slot["slotId"] !== "string") return [];
        const ionInstanceId = slot["ionInstanceId"];
        return [
          {
            slotId: slot["slotId"],
            ionInstanceId:
              typeof ionInstanceId === "string" ? ionInstanceId : null,
          },
        ];
      })
    : [];

  const canceledPairs = Array.isArray(source["canceledPairs"])
    ? source["canceledPairs"].flatMap((entry): LevelCheckpoint["canceledPairs"] => {
        if (typeof entry !== "object" || entry === null) return [];
        const pair = entry as Record<string, unknown>;
        if (
          typeof pair["leftInstanceId"] !== "string" ||
          typeof pair["rightInstanceId"] !== "string"
        ) {
          return [];
        }
        return [
          {
            leftInstanceId: pair["leftInstanceId"],
            rightInstanceId: pair["rightInstanceId"],
          },
        ];
      })
    : [];

  return {
    levelId: Math.round(levelId),
    state: state as CheckpointState,
    slotAssignments,
    coefficients: [
      coefficient(0),
      coefficient(1),
      coefficient(2),
      coefficient(3),
    ],
    canceledPairs,
    hintsUsed: clampInt(source["hintsUsed"], 0, 3, 0),
    wrongAttempts: clampInt(
      source["wrongAttempts"],
      0,
      Number.MAX_SAFE_INTEGER,
      0,
    ),
    elapsedMs: clampInt(source["elapsedMs"], 0, Number.MAX_SAFE_INTEGER, 0),
    savedAt: isoOrNull(source["savedAt"]) ?? new Date(0).toISOString(),
  };
}

/**
 * ซ่อมเซฟให้อยู่ในรูปที่ถูกต้อง แทนการปฏิเสธทิ้ง
 *
 * ทุกอย่างที่เพี้ยนถูกดึงกลับเข้าช่วง ไม่ใช่ทำให้ทั้งไฟล์ใช้ไม่ได้
 * ความก้าวหน้าของนักเรียนสำคัญกว่าความบริสุทธิ์ของข้อมูล
 */
export function normalizeSave(
  raw: unknown,
  fallback: { installId: string; now: string },
): GameSaveV1 {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  const completedLevels: Record<string, LevelProgress> = {};
  const rawLevels = source["completedLevels"];
  if (typeof rawLevels === "object" && rawLevels !== null) {
    for (const [key, value] of Object.entries(rawLevels)) {
      // ตัด key ที่ไม่ใช่เลขด่านจริงทิ้ง เช่นด่านที่ถูกถอดออกภายหลัง
      if (!isValidLevelId(key)) continue;
      completedLevels[String(Number(key))] = normalizeProgress(value);
    }
  }

  // ความก้าวหน้าต้องไม่ถอยหลัง — ปลดล็อกอย่างน้อยถึงด่านถัดจากที่ผ่านแล้ว
  const highestCompleted = Object.entries(completedLevels).reduce(
    (highest, [key, progress]) =>
      progress.completed ? Math.max(highest, Number(key)) : highest,
    0,
  );
  const unlockedLevel = Math.min(
    MAX_LEVEL_ID,
    Math.max(
      clampInt(source["unlockedLevel"], 1, MAX_LEVEL_ID, 1),
      highestCompleted + 1,
    ),
  );

  const rawSettings = (
    typeof source["settings"] === "object" && source["settings"] !== null
      ? source["settings"]
      : {}
  ) as Record<string, unknown>;

  const checkpoint = normalizeCheckpoint(source["activeCheckpoint"]);
  const installId =
    typeof source["installId"] === "string" && source["installId"].length > 0
      ? source["installId"]
      : fallback.installId;

  return {
    version: 1,
    installId,
    playerName:
      typeof source["playerName"] === "string" ? source["playerName"] : "",
    unlockedLevel,
    completedLevels,
    lastPlayedLevel: clampInt(source["lastPlayedLevel"], 1, MAX_LEVEL_ID, 1),
    // checkpoint ของด่านที่ยังไม่ปลดล็อกใช้ไม่ได้ ถือว่าไม่มี
    activeCheckpoint:
      checkpoint && checkpoint.levelId <= unlockedLevel ? checkpoint : null,
    settings: {
      sound: boolOr(rawSettings["sound"], true),
      music: boolOr(rawSettings["music"], false),
      reducedMotion: boolOr(rawSettings["reducedMotion"], false),
    },
    createdAt: isoOrNull(source["createdAt"]) ?? fallback.now,
    updatedAt: isoOrNull(source["updatedAt"]) ?? fallback.now,
  };
}
