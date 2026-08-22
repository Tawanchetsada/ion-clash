import { describe, expect, it } from "vitest";
import { createDefaultSave } from "./defaults";
import { gameSaveV1Schema } from "./schema";

const clock = {
  now: (): Date => new Date("2026-08-22T09:00:00.000Z"),
  uuid: (): string => "fixed-install-id",
};

describe("เซฟเริ่มต้น", () => {
  it("ปลดล็อกเฉพาะด่าน 1 และยังไม่มีด่านที่ผ่าน", () => {
    const save = createDefaultSave(clock);
    expect(save.unlockedLevel).toBe(1);
    expect(save.lastPlayedLevel).toBe(1);
    expect(save.completedLevels).toEqual({});
    expect(save.activeCheckpoint).toBeNull();
  });

  it("ฉีดนาฬิกาและ id เข้าไปแล้วได้ผลคงที่ทุกครั้ง", () => {
    expect(createDefaultSave(clock)).toEqual(createDefaultSave(clock));
    expect(createDefaultSave(clock).installId).toBe("fixed-install-id");
    expect(createDefaultSave(clock).createdAt).toBe("2026-08-22T09:00:00.000Z");
  });

  it("ผ่าน schema เข้มงวด", () => {
    expect(gameSaveV1Schema.safeParse(createDefaultSave(clock)).success).toBe(
      true,
    );
  });

  it("ไม่ฉีดอะไรเข้าไปก็ยังสร้างได้และ id ไม่ซ้ำกัน", () => {
    const first = createDefaultSave();
    const second = createDefaultSave();
    expect(gameSaveV1Schema.safeParse(first).success).toBe(true);
    expect(first.installId).not.toBe(second.installId);
  });
});
