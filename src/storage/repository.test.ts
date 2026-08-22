import { describe, expect, it, vi } from "vitest";
import {
  createFakeStorage,
  createQuotaError,
} from "./__fixtures__/fakeStorage";
import { CORRUPT_KEY_PREFIX, SAVE_KEY } from "./keys";
import { recordLevelResult } from "./progress";
import {
  buildImportPreview,
  createGameSaveRepository,
  saveFileName,
} from "./repository";
import { gameSaveV1Schema } from "./schema";
import type { FakeStorage } from "./__fixtures__/fakeStorage";
import type { GameSaveV1 } from "./schema";

const clock = {
  now: (): Date => new Date("2026-08-22T09:00:00.000Z"),
  uuid: (): string => "install-abc",
};

function makeRepo(storage: FakeStorage = createFakeStorage()) {
  return {
    storage,
    repo: createGameSaveRepository({ storage, clock }),
  };
}

async function blobText(blob: Blob): Promise<string> {
  return await blob.text();
}

describe("ชื่อไฟล์ส่งออก", () => {
  it("ใช้รูปแบบ ion-clash-save-YYYY-MM-DD.json", () => {
    expect(saveFileName(new Date("2026-08-22T15:30:00.000Z"))).toBe(
      "ion-clash-save-2026-08-22.json",
    );
  });
});

describe("การโหลด", () => {
  it("ไม่มีข้อมูลเดิมได้เซฟเริ่มต้น และยังไม่เขียนอะไรลงเครื่อง", () => {
    const { storage, repo } = makeRepo();
    const save = repo.load();

    expect(save.unlockedLevel).toBe(1);
    expect(storage.entries.size).toBe(0);
  });

  it("JSON พังถูกกักไว้แล้วเริ่มจากเซฟใหม่", () => {
    const { storage, repo } = makeRepo(
      createFakeStorage({ [SAVE_KEY]: "{ไม่ใช่ json" }),
    );

    const save = repo.load();

    expect(save.unlockedLevel).toBe(1);
    expect(storage.getItem(SAVE_KEY)).toBeNull();
    expect(
      [...storage.entries.keys()].some((key) =>
        key.startsWith(CORRUPT_KEY_PREFIX),
      ),
    ).toBe(true);
  });

  it("เวอร์ชันที่ไม่รู้จักถูกกักไว้เหมือนไฟล์เสีย", () => {
    const { storage, repo } = makeRepo(
      createFakeStorage({ [SAVE_KEY]: JSON.stringify({ version: 99 }) }),
    );

    expect(repo.load().unlockedLevel).toBe(1);
    expect(
      [...storage.entries.keys()].some((key) =>
        key.startsWith(CORRUPT_KEY_PREFIX),
      ),
    ).toBe(true);
  });

  it("ค่าที่เพี้ยนถูกซ่อม ไม่ถูกกัก — ความก้าวหน้าไม่หาย", () => {
    const { storage, repo } = makeRepo(
      createFakeStorage({
        [SAVE_KEY]: JSON.stringify({
          version: 1,
          unlockedLevel: 2,
          completedLevels: {
            "7": { completed: true, bestScore: 999, stars: 0, attempts: 2 },
          },
        }),
      }),
    );

    const save = repo.load();

    expect(save.completedLevels["7"]?.bestScore).toBe(100);
    expect(save.completedLevels["7"]?.stars).toBe(3);
    expect(save.unlockedLevel).toBe(8);
    expect(
      [...storage.entries.keys()].some((key) =>
        key.startsWith(CORRUPT_KEY_PREFIX),
      ),
    ).toBe(false);
  });
});

describe("การบันทึก", () => {
  it("บันทึกแล้วโหลดกลับได้ค่าเดิม", () => {
    const { repo } = makeRepo();
    const next = recordLevelResult(
      repo.load(),
      { levelId: 1, score: 95, timeMs: 30_000 },
      clock.now,
    );

    expect(repo.save(next)).toEqual({ ok: true });
    expect(repo.load()).toEqual(next);
  });

  it("พื้นที่เต็มคืน error ไม่ throw", () => {
    const { storage, repo } = makeRepo();
    storage.failWith(createQuotaError());

    const result = repo.save(repo.load());
    expect(result).toEqual({ ok: false, reason: "quota" });
  });

  it("ปฏิเสธข้อมูลที่ไม่ผ่าน schema แทนการเขียนของเสียลงเครื่อง", () => {
    const { storage, repo } = makeRepo();
    const broken = { ...repo.load(), unlockedLevel: 999 } as GameSaveV1;

    expect(repo.save(broken)).toEqual({ ok: false, reason: "serialize" });
    expect(storage.getItem(SAVE_KEY)).toBeNull();
  });
});

describe("ส่งออกและนำเข้า", () => {
  it("ส่งออกแล้วนำเข้ากลับได้ข้อมูลเท่าเดิม", async () => {
    const { repo } = makeRepo();
    const played = recordLevelResult(
      repo.load(),
      { levelId: 1, score: 95, timeMs: 30_000 },
      clock.now,
    );
    repo.save(played);

    const text = await blobText(repo.exportJson());
    const result = repo.importJson(text);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.merged).toEqual(played);
  });

  it("นำเข้าแล้ว **ยังไม่เขียน** จนกว่าจะยืนยัน", () => {
    const { storage, repo } = makeRepo();
    const incoming = recordLevelResult(
      repo.load(),
      { levelId: 4, score: 80, timeMs: 1000 },
      clock.now,
    );

    repo.importJson(JSON.stringify(incoming));

    expect(storage.getItem(SAVE_KEY)).toBeNull();
  });

  it("นำเข้าแล้วความก้าวหน้าเดิมไม่หาย", () => {
    const { repo } = makeRepo();
    const local = recordLevelResult(
      repo.load(),
      { levelId: 9, score: 100, timeMs: 5000 },
      clock.now,
    );
    repo.save(local);

    const incoming = recordLevelResult(
      createGameSaveRepository({
        storage: createFakeStorage(),
        clock,
      }).load(),
      { levelId: 2, score: 60, timeMs: 9000 },
      clock.now,
    );

    const result = repo.importJson(JSON.stringify(incoming));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.merged.completedLevels["9"]?.bestScore).toBe(100);
    expect(result.merged.completedLevels["2"]?.bestScore).toBe(60);
    expect(result.merged.unlockedLevel).toBe(10);
  });

  it.each([
    ["ไม่ใช่ json เลย", "parse"],
    ['{"version":99}', "schema"],
  ])("ไฟล์นำเข้าที่ใช้ไม่ได้คืนเหตุผล (%s)", (text, reason) => {
    expect(makeRepo().repo.importJson(text)).toEqual({ ok: false, reason });
  });

  it("preview บอกจำนวนด่านที่ผ่านและด่านสูงสุด", () => {
    const { repo } = makeRepo();
    let save = repo.load();
    save = recordLevelResult(save, { levelId: 1, score: 90, timeMs: 1 }, clock.now);
    save = recordLevelResult(save, { levelId: 5, score: 70, timeMs: 1 }, clock.now);

    expect(buildImportPreview(save)).toMatchObject({
      completedCount: 2,
      highestLevel: 5,
    });
  });
});

describe("การรีเซ็ต", () => {
  it("ล้างแล้วกลับไปเป็นเซฟเริ่มต้น", () => {
    const { repo } = makeRepo();
    repo.save(
      recordLevelResult(
        repo.load(),
        { levelId: 1, score: 90, timeMs: 1 },
        clock.now,
      ),
    );

    repo.reset();

    expect(repo.load().completedLevels).toEqual({});
    expect(repo.load().unlockedLevel).toBe(1);
  });
});

describe("ความปลอดภัยตอน render ฝั่งเซิร์ฟเวอร์", () => {
  it("ไม่มี storage ก็ยังโหลดได้ ไม่ throw", () => {
    const repo = createGameSaveRepository({ storage: null, clock });

    expect(() => repo.load()).not.toThrow();
    expect(gameSaveV1Schema.safeParse(repo.load()).success).toBe(true);
    expect(repo.save(repo.load())).toEqual({ ok: false, reason: "security" });
    expect(() => repo.reset()).not.toThrow();
  });

  it("ไม่มี storage แล้วสมัครฟังการเปลี่ยนแปลงได้ โดยไม่ทำอะไร", () => {
    const repo = createGameSaveRepository({ storage: null, clock });
    const unsubscribe = repo.subscribeExternalChange(() => {});
    expect(() => unsubscribe()).not.toThrow();
  });
});

describe("การซิงก์ระหว่างแท็บ", () => {
  it("แท็บอื่นเขียนแล้วแจ้งกลับด้วยข้อมูลล่าสุด", () => {
    const { storage, repo } = makeRepo();
    const listener = vi.fn();
    const unsubscribe = repo.subscribeExternalChange(listener);

    const fromOtherTab = recordLevelResult(
      repo.load(),
      { levelId: 3, score: 85, timeMs: 1000 },
      clock.now,
    );
    storage.setItem(SAVE_KEY, JSON.stringify(fromOtherTab));
    window.dispatchEvent(new StorageEvent("storage", { key: SAVE_KEY }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ unlockedLevel: 4 });

    unsubscribe();
    window.dispatchEvent(new StorageEvent("storage", { key: SAVE_KEY }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ไม่สนใจ event ของคีย์อื่น", () => {
    const { repo } = makeRepo();
    const listener = vi.fn();
    repo.subscribeExternalChange(listener);

    window.dispatchEvent(
      new StorageEvent("storage", { key: "คีย์ของแอปอื่น" }),
    );

    expect(listener).not.toHaveBeenCalled();
  });
});
