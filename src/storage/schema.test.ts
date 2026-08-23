import { describe, expect, it } from "vitest";
import { LEVELS } from "../data/levels";
import { emptyErrorTally } from "../domain/chemistry/types";
import { createDefaultSave } from "./defaults";
import {
  MAX_LEVEL_ID,
  gameSaveV1Schema,
  normalizeSave,
  storedSaveSchema,
} from "./schema";

const FALLBACK = {
  installId: "fallback-id",
  now: "2026-08-22T00:00:00.000Z",
};

function normalized(raw: unknown): ReturnType<typeof normalizeSave> {
  return normalizeSave(raw, FALLBACK);
}

describe("schema ของไฟล์บันทึก", () => {
  it("เลขด่านสูงสุดตรงกับจำนวนด่านจริง", () => {
    // ผูกกันตอนเทสต์ ไม่ผูกตอนรัน ชั้น storage จะได้ไม่ต้อง import ชั้น data
    expect(MAX_LEVEL_ID).toBe(LEVELS.length);
  });

  it("เซฟเริ่มต้นผ่าน schema เข้มงวด", () => {
    expect(gameSaveV1Schema.safeParse(createDefaultSave()).success).toBe(true);
  });

  it("ผลลัพธ์ของ normalizeSave ผ่าน schema เข้มงวดเสมอ แม้ป้อนขยะเข้าไป", () => {
    for (const junk of [null, {}, [], "ข้อความ", 42, { version: 1 }]) {
      expect(gameSaveV1Schema.safeParse(normalized(junk)).success).toBe(true);
    }
  });

  it("เซฟที่ขาดฟิลด์ยังผ่านด่านตรวจตอนอ่าน ไม่ถูกตัดสินว่าเป็นไฟล์เสีย", () => {
    // กันการถอยหลัง: เคยเขียน storedSaveSchema ด้วย z.unknown() ทุกฟิลด์
    // แล้วพบว่า Zod v4 ถือว่าฟิลด์เหล่านั้นบังคับ ไฟล์เก่าที่บันทึกไว้ก่อน
    // เพิ่มฟิลด์ใหม่จึงถูกกักทั้งไฟล์ ทั้งที่ซ่อมได้
    const partial = { version: 1, unlockedLevel: 4 };
    expect(storedSaveSchema.safeParse(partial).success).toBe(true);
    expect(normalized(partial).unlockedLevel).toBe(4);
  });
});

describe("normalizeSave ซ่อมแทนการปฏิเสธ", () => {
  it("คำนวณดาวใหม่จากคะแนน ไม่เชื่อค่าดาวที่บันทึกไว้", () => {
    // นี่คือหัวใจ — วันที่ผู้วิจัยปรับเกณฑ์ดาว ไฟล์เซฟเก่าต้องไม่กลายเป็นไฟล์เสีย
    const save = normalized({
      version: 1,
      completedLevels: {
        "1": { completed: true, bestScore: 95, stars: 0, attempts: 1 },
        "2": { completed: true, bestScore: 45, stars: 3, attempts: 2 },
      },
    });

    expect(save.completedLevels["1"]?.stars).toBe(3);
    expect(save.completedLevels["2"]?.stars).toBe(1);
  });

  it("ดึงคะแนนที่เกินช่วงกลับเข้า 0-100", () => {
    const save = normalized({
      version: 1,
      completedLevels: {
        "1": { completed: true, bestScore: 9999, attempts: 1 },
        "2": { completed: true, bestScore: -50, attempts: 1 },
      },
    });

    expect(save.completedLevels["1"]?.bestScore).toBe(100);
    expect(save.completedLevels["2"]?.bestScore).toBe(0);
  });

  it("ตัด key ที่ไม่ใช่เลขด่านจริงทิ้ง", () => {
    const save = normalized({
      version: 1,
      completedLevels: {
        "1": { completed: true, bestScore: 80, attempts: 1 },
        "0": { completed: true, bestScore: 80, attempts: 1 },
        "51": { completed: true, bestScore: 80, attempts: 1 },
        abc: { completed: true, bestScore: 80, attempts: 1 },
      },
    });

    expect(Object.keys(save.completedLevels)).toEqual(["1"]);
  });

  it("ดัน unlockedLevel ให้ไม่ต่ำกว่าด่านที่ผ่านแล้ว", () => {
    const save = normalized({
      version: 1,
      unlockedLevel: 2,
      completedLevels: {
        "7": { completed: true, bestScore: 80, attempts: 1 },
      },
    });

    expect(save.unlockedLevel).toBe(8);
  });

  it("unlockedLevel ไม่เกินด่านสุดท้าย", () => {
    const save = normalized({
      version: 1,
      unlockedLevel: 999,
      completedLevels: {
        "50": { completed: true, bestScore: 100, attempts: 1 },
      },
    });

    expect(save.unlockedLevel).toBe(MAX_LEVEL_ID);
  });

  it("ทิ้ง checkpoint ของด่านที่ยังไม่ปลดล็อก", () => {
    const save = normalized({
      version: 1,
      unlockedLevel: 3,
      activeCheckpoint: {
        levelId: 40,
        state: "balanceEquation",
        slotAssignments: [],
        coefficients: [1, 1, 1, 1],
        canceledPairs: [],
        hintsUsed: 0,
        wrongAttempts: 0,
        elapsedMs: 0,
        savedAt: "2026-08-22T00:00:00.000Z",
      },
    });

    expect(save.activeCheckpoint).toBeNull();
  });

  it("เก็บ checkpoint ที่ถูกต้องไว้ครบ", () => {
    const save = normalized({
      version: 1,
      unlockedLevel: 13,
      activeCheckpoint: {
        levelId: 13,
        state: "balanceEquation",
        slotAssignments: [{ slotId: "p0", ionInstanceId: "inst-a" }],
        coefficients: [1, 2, null, 2],
        canceledPairs: [{ leftInstanceId: "l1", rightInstanceId: "r1" }],
        hintsUsed: 2,
        wrongAttempts: 3,
        elapsedMs: 45_000,
        savedAt: "2026-08-22T10:00:00.000Z",
      },
    });

    expect(save.activeCheckpoint).toMatchObject({
      levelId: 13,
      state: "balanceEquation",
      coefficients: [1, 2, null, 2],
      hintsUsed: 2,
    });
    expect(save.activeCheckpoint?.slotAssignments).toHaveLength(1);
  });

  it("checkpoint ที่สถานะไม่รู้จักถือว่าไม่มี", () => {
    const save = normalized({
      version: 1,
      activeCheckpoint: { levelId: 1, state: "netIonicResult" },
    });

    expect(save.activeCheckpoint).toBeNull();
  });

  it("checkpoint ที่ไม่มี errorsByCode ถูกซ่อมด้วยศูนย์ ไม่ถูกกัก", () => {
    // ไฟล์เซฟที่บันทึกก่อนเพิ่มฟิลด์นี้ต้องยังใช้ได้ ไม่ใช่กลายเป็นไฟล์เสีย
    const save = normalized({
      version: 1,
      unlockedLevel: 5,
      activeCheckpoint: {
        levelId: 5,
        state: "arrangeProductIons",
        slotAssignments: [],
        coefficients: [null, null, null, null],
        canceledPairs: [],
        hintsUsed: 1,
        wrongAttempts: 2,
        elapsedMs: 1000,
        savedAt: "2026-08-22T10:00:00.000Z",
      },
    });

    expect(save.activeCheckpoint?.errorsByCode).toEqual(emptyErrorTally());
    expect(gameSaveV1Schema.safeParse(save).success).toBe(true);
  });

  it("errorsByCode เก็บค่าที่รู้จักและทิ้งรหัสแปลกปลอม", () => {
    const save = normalized({
      version: 1,
      unlockedLevel: 5,
      activeCheckpoint: {
        levelId: 5,
        state: "cancelSpectatorIons",
        slotAssignments: [],
        coefficients: [null, null, null, null],
        canceledPairs: [],
        hintsUsed: 0,
        wrongAttempts: 4,
        errorsByCode: { "E-PAIR": 3, "E-SPECTATOR": 1, "E-ไม่มีจริง": 99 },
        elapsedMs: 1000,
        savedAt: "2026-08-22T10:00:00.000Z",
      },
    });

    expect(save.activeCheckpoint?.errorsByCode).toEqual({
      ...emptyErrorTally(),
      "E-PAIR": 3,
      "E-SPECTATOR": 1,
    });
    expect(gameSaveV1Schema.safeParse(save).success).toBe(true);
  });

  it("วันที่อ่านไม่ออกถูกแทนด้วยค่าสำรอง", () => {
    const save = normalized({ version: 1, createdAt: "ไม่ใช่วันที่" });
    expect(save.createdAt).toBe(FALLBACK.now);
  });

  it("เก็บ installId เดิมไว้ถ้ายังใช้ได้", () => {
    const save = normalized({ version: 1, installId: "เครื่องเดิม" });
    expect(save.installId).toBe("เครื่องเดิม");
  });

  it("ค่าตั้งค่าที่หายไปใช้ค่าเริ่มต้น เพลงปิดตาม D-17 และความยินยอมวิจัยเป็น false", () => {
    const save = normalized({ version: 1 });
    expect(save.settings).toEqual({
      sound: true,
      music: false,
      reducedMotion: false,
      researchConsent: false,
    });
  });

  it("เซฟเวอร์ชันเก่าที่ไม่มี researchConsent โหลดได้และได้ false โดยไม่ถูกปฏิเสธ", () => {
    const legacySave = {
      version: 1,
      installId: "legacy-user",
      playerName: "เด็กดี",
      unlockedLevel: 5,
      completedLevels: {},
      lastPlayedLevel: 5,
      activeCheckpoint: null,
      settings: {
        sound: true,
        music: true,
        reducedMotion: true,
      },
    };

    const save = normalized(legacySave);
    expect(save.settings.researchConsent).toBe(false);
    expect(save.settings.sound).toBe(true);
    expect(save.settings.music).toBe(true);
    expect(save.settings.reducedMotion).toBe(true);
    expect(gameSaveV1Schema.safeParse(save).success).toBe(true);
  });
});
