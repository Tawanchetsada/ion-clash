import { describe, expect, it } from "vitest";
import { CURRENT_VERSION, migrate } from "./migration";
import type { Migration } from "./migration";

describe("การอัปเกรดเซฟข้ามเวอร์ชัน", () => {
  it("เซฟเวอร์ชันปัจจุบันผ่านไปตรง ๆ", () => {
    const result = migrate({ version: CURRENT_VERSION, playerName: "ก" });
    expect(result).toEqual({
      ok: true,
      value: { version: CURRENT_VERSION, playerName: "ก" },
    });
  });

  it("ไม่แก้ไขวัตถุต้นฉบับ", () => {
    const original = { version: 1, playerName: "ข" };
    migrate(original);
    expect(original).toEqual({ version: 1, playerName: "ข" });
  });

  it.each([null, [], "ข้อความ", 42])("ค่าที่ไม่ใช่วัตถุถูกปฏิเสธ: %s", (raw) => {
    expect(migrate(raw)).toEqual({ ok: false, reason: "not-an-object" });
  });

  it.each([0, -1, 1.5, "1", undefined])(
    "เวอร์ชันที่ใช้ไม่ได้ถูกปฏิเสธ: %s",
    (version) => {
      expect(migrate({ version })).toEqual({ ok: false, reason: "bad-version" });
    },
  );

  it("เซฟจากเวอร์ชันใหม่กว่าโปรแกรมถูกปฏิเสธ ไม่เดาว่าจะแปลงถอยหลังได้", () => {
    expect(migrate({ version: CURRENT_VERSION + 1 })).toEqual({
      ok: false,
      reason: "bad-version",
    });
  });

  it("ไล่ chain หลายขั้นตามลำดับ", () => {
    // ทดสอบตัวไล่ chain ด้วยเวอร์ชันสมมติ เพราะ v2 จริงยังไม่มี
    const steps: number[] = [];
    const bump =
      (from: number): Migration =>
      (raw) => {
        steps.push(from);
        return { ...raw, version: from + 1 };
      };

    const result = migrate(
      { version: 1, keep: "ค่าเดิม" },
      {
        currentVersion: 4,
        migrations: new Map([
          [1, bump(1)],
          [2, bump(2)],
          [3, bump(3)],
        ]),
      },
    );

    expect(steps).toEqual([1, 2, 3]);
    expect(result).toEqual({
      ok: true,
      value: { version: 4, keep: "ค่าเดิม" },
    });
  });

  it("chain ที่ขาดตอนกลางทางถูกปฏิเสธ ไม่ข้ามขั้น", () => {
    const result = migrate(
      { version: 1 },
      {
        currentVersion: 3,
        migrations: new Map([[2, (raw): Record<string, unknown> => raw]]),
      },
    );

    expect(result).toEqual({ ok: false, reason: "no-migration-path" });
  });
});
