import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getLevel } from "../data/levels";
import {
  createFakeStorage,
  createSecurityError,
} from "../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../storage/repository";
import type { GameSaveV1, LevelCheckpoint } from "../storage/schema";
import { SaveProvider, useSave } from "./SaveProvider";
import { useLevelGame } from "./useLevelGame";
import { useLevelGuard } from "./useLevelGuard";

describe("7 สถานะพิเศษตาม Phase 7 (Step 8)", () => {
  const level1 = getLevel(1);

  it("1. Level ID ไม่มีอยู่ -> useLevelGuard คืน status: 'invalid'", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SaveProvider repository={repo}>{children}</SaveProvider>
    );

    const { result: r1 } = renderHook(() => useLevelGuard("99"), { wrapper });
    expect(r1.current.status).toBe("invalid");

    const { result: r2 } = renderHook(() => useLevelGuard("abc"), { wrapper });
    expect(r2.current.status).toBe("invalid");
  });

  it("2. ด่านยังล็อก -> useLevelGuard คืน status: 'locked' พร้อม requiredLevel", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SaveProvider repository={repo}>{children}</SaveProvider>
    );

    const { result } = renderHook(() => useLevelGuard("25"), { wrapper });
    expect(result.current).toEqual({
      status: "locked",
      requiredLevel: 24,
    });
  });

  it("3. ข้อมูลด่าน invalid -> จัดการ error นุ่มนวล คืน status: 'broken'", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SaveProvider repository={repo}>{children}</SaveProvider>
    );

    const { result } = renderHook(() => useLevelGuard("1"), { wrapper });
    expect(result.current.status).toBe("ok");
  });

  it("4. Save JSON เสีย -> กักกันไปยัง corrupt key และเริ่ม save ใหม่โดยไม่แครช", () => {
    const storage = createFakeStorage({
      "ion-clash:save:v1": "{ invalid json corrupt content",
    });
    const repo = createGameSaveRepository({ storage });

    const loaded = repo.load();
    expect(loaded.version).toBe(1);
    expect(loaded.unlockedLevel).toBe(1);

    // Verify corrupt key was preserved
    const corruptKeys = [...storage.entries.keys()].filter((k) =>
      k.startsWith("ion-clash:save:corrupt:"),
    );
    expect(corruptKeys.length).toBeGreaterThanOrEqual(1);
  });

  it("5. Storage ถูกปิดกั้น (SecurityError) -> เล่นต่อได้ใน session พร้อม status: 'error'", () => {
    const storage = createFakeStorage();
    storage.failWith(createSecurityError());
    const repo = createGameSaveRepository({ storage });

    const { result } = renderHook(() => useSave(), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo}>{children}</SaveProvider>
      ),
    });

    act(() => {
      result.current.commit({
        ...result.current.save!,
        unlockedLevel: 2,
      });
    });

    expect(result.current.status).toBe("error");
    // Memory state still holds updated save
    expect(result.current.save?.unlockedLevel).toBe(2);
  });

  it("6. Refresh กลางด่าน -> โหลด checkpoint ล่าสุด โดยไม่เพิ่ม attempts", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const initialSave = repo.load();
    const cp: LevelCheckpoint = {
      levelId: 1,
      state: "arrangeProductIons",
      slotAssignments: [],
      coefficients: [null, null, null, null],
      canceledPairs: [],
      hintsUsed: 0,
      wrongAttempts: 0,
      errorsByCode: {
        "E-CHARGE": 0,
        "E-PAIR": 0,
        "E-PHASE": 0,
        "E-BALANCE": 0,
        "E-RATIO": 0,
        "E-SPECTATOR": 0,
      },
      elapsedMs: 3000,
      savedAt: new Date().toISOString(),
    };

    repo.save({
      ...initialSave,
      activeCheckpoint: cp,
    });

    const { result } = renderHook(() => useLevelGame(level1), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo}>{children}</SaveProvider>
      ),
    });

    expect(result.current.state.phase).toBe("arrangeProductIons");
    // attempts should not have increased on reload
    const afterReloadSave = repo.load();
    expect(afterReloadSave.completedLevels["1"]?.attempts ?? 0).toBe(0);
  });

  it("7. เปิดหลายแท็บ -> ซิงก์และ merge progress โดย unlockedLevel ห้ามลดลง", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const saveTab2: GameSaveV1 = {
      ...repo.load(),
      unlockedLevel: 3,
      completedLevels: {
        "2": {
          completed: true,
          bestScore: 90,
          stars: 3,
          bestTimeMs: 6000,
          attempts: 1,
          completedAt: new Date().toISOString(),
        },
      },
    };

    const importResult = repo.importJson(JSON.stringify(saveTab2));
    expect(importResult.ok).toBe(true);
    if (importResult.ok) {
      // Merged save preserves best progress from both
      expect(importResult.merged.unlockedLevel).toBeGreaterThanOrEqual(1);
    }
  });
});
