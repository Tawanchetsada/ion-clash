import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFakeStorage,
  createQuotaError,
} from "../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../storage/repository";
import type { GameSaveV1 } from "../storage/schema";
import { SaveProvider, useSave } from "./SaveProvider";

describe("SaveProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("โหลด save สำเร็จหลัง mount และมี status เป็น idle", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const { result } = renderHook(() => useSave(), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo}>{children}</SaveProvider>
      ),
    });

    expect(result.current.save).not.toBeNull();
    expect(result.current.save?.unlockedLevel).toBe(1);
    expect(result.current.status).toBe("idle");
  });

  it("throw error ถ้าเรียก useSave นอก SaveProvider", () => {
    // Suppress console.error during this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useSave())).toThrow(
      "useSave ต้องถูกใช้ภายใต้ <SaveProvider>",
    );
    spy.mockRestore();
  });

  it("commit บันทึกทันทีและเปลี่ยนสถานะเป็น saved", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const { result } = renderHook(() => useSave(), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo}>{children}</SaveProvider>
      ),
    });

    const initial = result.current.save!;
    const updated: GameSaveV1 = {
      ...initial,
      unlockedLevel: 5,
    };

    act(() => {
      result.current.commit(updated);
    });

    expect(result.current.status).toBe("saved");
    expect(result.current.save?.unlockedLevel).toBe(5);

    // Verify storage received it
    const reloaded = repo.load();
    expect(reloaded.unlockedLevel).toBe(5);
  });

  it("scheduleCommit รวมการเขียนหลายครั้ง (debounce 400ms) เป็นครั้งเดียว", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    const saveSpy = vi.spyOn(repo, "save");

    const { result } = renderHook(() => useSave(), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo} debounceMs={400}>
          {children}
        </SaveProvider>
      ),
    });

    saveSpy.mockClear();

    const initial = result.current.save!;

    act(() => {
      result.current.scheduleCommit({ ...initial, unlockedLevel: 2 });
    });
    expect(result.current.status).toBe("saving");
    expect(saveSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
      result.current.scheduleCommit({ ...initial, unlockedLevel: 3 });
    });
    expect(saveSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saved");
    expect(result.current.save?.unlockedLevel).toBe(3);
  });

  it("เมื่อ storage โยน quota error จะได้ status === 'error' แต่ save ยังใช้ได้และเกมไม่ crash", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const { result } = renderHook(() => useSave(), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo}>{children}</SaveProvider>
      ),
    });

    // Make storage fail on next setItem
    storage.failWith(createQuotaError());

    const initial = result.current.save!;
    const updated: GameSaveV1 = {
      ...initial,
      unlockedLevel: 2,
    };

    act(() => {
      result.current.commit(updated);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.save?.unlockedLevel).toBe(2);

    // Can retry after storage recovers
    storage.failWith(null);
    act(() => {
      result.current.retry();
    });

    expect(result.current.status).toBe("saved");
  });

  it("reset ล้างข้อมูลและโหลดค่า default ใหม่", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const { result } = renderHook(() => useSave(), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo}>{children}</SaveProvider>
      ),
    });

    act(() => {
      result.current.commit({
        ...result.current.save!,
        playerName: "Student1",
        unlockedLevel: 10,
      });
    });
    expect(result.current.save?.playerName).toBe("Student1");

    act(() => {
      result.current.reset();
    });

    expect(result.current.save?.playerName).toBe("");
    expect(result.current.save?.unlockedLevel).toBe(1);
  });
});
