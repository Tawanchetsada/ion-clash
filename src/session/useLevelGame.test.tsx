import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getLevel } from "../data/levels";
import { createFakeStorage } from "../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../storage/repository";
import type { LevelCheckpoint } from "../storage/schema";
import type { ResearchEvent } from "../research/types";
import { ResearchProvider } from "./ResearchProvider";
import { SaveProvider } from "./SaveProvider";
import { useLevelGame } from "./useLevelGame";

describe("useLevelGame", () => {
  const level1 = getLevel(1);

  it("เริ่มต้นที่ phase levelIntro และ dispatch START_LEVEL เพื่อเริ่มเล่น", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const { result } = renderHook(() => useLevelGame(level1), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo}>{children}</SaveProvider>
      ),
    });

    expect(result.current.state.phase).toBe("levelIntro");
    expect(result.current.step).toBe(1);

    act(() => {
      result.current.dispatch({ type: "START_LEVEL", at: Date.now() });
    });

    expect(result.current.state.phase).toBe("dissociateReactants");
  });

  it("กู้คืน checkpoint ที่ค้างอยู่จาก save เมื่อเปิดด่าน", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const initial = repo.load();
    const checkpoint: LevelCheckpoint = {
      levelId: 1,
      state: "arrangeProductIons",
      slotAssignments: [
        { slotId: "L1:slot:0", ionInstanceId: "L1:react:a:cat" },
      ],
      coefficients: [1, 1, 1, 1],
      canceledPairs: [],
      hintsUsed: 1,
      wrongAttempts: 0,
      errorsByCode: {
        "E-CHARGE": 0,
        "E-PAIR": 0,
        "E-PHASE": 0,
        "E-BALANCE": 0,
        "E-RATIO": 0,
        "E-SPECTATOR": 0,
      },
      elapsedMs: 5000,
      savedAt: new Date().toISOString(),
    };

    repo.save({
      ...initial,
      activeCheckpoint: checkpoint,
    });

    const { result } = renderHook(() => useLevelGame(level1), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo}>{children}</SaveProvider>
      ),
    });

    expect(result.current.state.phase).toBe("arrangeProductIons");
    expect(result.current.state.hintsUsed).toBe(1);
  });

  it("เล่นจนจบด่าน บันทึก completedLevels และเคลียร์ activeCheckpoint", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const { result } = renderHook(() => useLevelGame(level1), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo}>{children}</SaveProvider>
      ),
    });

    // Start -> Dissociate
    act(() => {
      result.current.dispatch({ type: "START_LEVEL", at: Date.now() });
    });
    // Dissociate -> Arrange
    act(() => {
      result.current.dispatch({ type: "CONTINUE" });
    });

    // Place all 4 ions correctly
    act(() => {
      result.current.dispatch({
        type: "PLACE_ION",
        slotId: "L1:slot:0",
        instanceId: "L1:react:a:cat", // Ag+
      });
      result.current.dispatch({
        type: "PLACE_ION",
        slotId: "L1:slot:1",
        instanceId: "L1:react:b:an", // Cl-
      });
      result.current.dispatch({
        type: "PLACE_ION",
        slotId: "L1:slot:2",
        instanceId: "L1:react:b:cat", // Na+
      });
      result.current.dispatch({
        type: "PLACE_ION",
        slotId: "L1:slot:3",
        instanceId: "L1:react:a:an", // NO3-
      });
    });

    // Check arrangement
    act(() => {
      result.current.dispatch({ type: "CHECK" });
    });
    expect(result.current.state.phase).toBe("validateProducts");

    // Confirm products
    act(() => {
      result.current.dispatch({ type: "CONFIRM_PRODUCTS" });
    });
    expect(result.current.state.phase).toBe("cancelSpectatorIons");

    // Cancel spectator pairs (Na+ and NO3-)
    act(() => {
      result.current.dispatch({
        type: "SELECT_LEFT",
        instanceId: "L1:ci:l:ion:sodium-plus",
      });
      result.current.dispatch({
        type: "SELECT_RIGHT",
        instanceId: "L1:ci:r:ion:sodium-plus",
      });
      result.current.dispatch({
        type: "SELECT_LEFT",
        instanceId: "L1:ci:l:ion:nitrate",
      });
      result.current.dispatch({
        type: "SELECT_RIGHT",
        instanceId: "L1:ci:r:ion:nitrate",
      });
    });

    // Confirm cancellation
    act(() => {
      result.current.dispatch({ type: "CONFIRM" });
    });
    expect(result.current.state.phase).toBe("netIonicResult");

    // Complete level
    act(() => {
      result.current.dispatch({ type: "COMPLETE_LEVEL", at: Date.now() });
    });
    expect(result.current.state.phase).toBe("levelComplete");

    const saved = repo.load();
    expect(saved.completedLevels["1"]).toBeDefined();
    expect(saved.completedLevels["1"]?.completed).toBe(true);
    expect(saved.completedLevels["1"]?.stars).toBeGreaterThanOrEqual(1);
    expect(saved.unlockedLevel).toBe(2);
    expect(saved.activeCheckpoint).toBeNull();
  });

  it("บันทึก ResearchEvent ครบทุกฟิลด์เมื่อจบด่าน และบันทึกครั้งเดียวแม้ component re-render", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    repo.save({
      ...repo.load(),
      playerName: "Student-Test",
      settings: {
        sound: true,
        music: false,
        reducedMotion: false,
        researchConsent: true,
      },
    });

    const recordedEvents: ResearchEvent[] = [];
    const mockSink = {
      record: (ev: ResearchEvent) => recordedEvents.push(ev),
      flush: async () => {},
    };

    const { result, rerender } = renderHook(() => useLevelGame(level1), {
      wrapper: ({ children }) => (
        <SaveProvider repository={repo}>
          <ResearchProvider sink={mockSink}>{children}</ResearchProvider>
        </SaveProvider>
      ),
    });

    // Start -> Dissociate -> Arrange
    act(() => {
      result.current.dispatch({ type: "START_LEVEL", at: Date.now() });
    });
    act(() => {
      result.current.dispatch({ type: "CONTINUE" });
    });

    // Place ions
    act(() => {
      result.current.dispatch({
        type: "PLACE_ION",
        slotId: "L1:slot:0",
        instanceId: "L1:react:a:cat",
      });
      result.current.dispatch({
        type: "PLACE_ION",
        slotId: "L1:slot:1",
        instanceId: "L1:react:b:an",
      });
      result.current.dispatch({
        type: "PLACE_ION",
        slotId: "L1:slot:2",
        instanceId: "L1:react:b:cat",
      });
      result.current.dispatch({
        type: "PLACE_ION",
        slotId: "L1:slot:3",
        instanceId: "L1:react:a:an",
      });
    });

    act(() => {
      result.current.dispatch({ type: "CHECK" });
    });
    act(() => {
      result.current.dispatch({ type: "CONFIRM_PRODUCTS" });
    });

    // Cancel spectator pairs
    act(() => {
      result.current.dispatch({
        type: "SELECT_LEFT",
        instanceId: "L1:ci:l:ion:sodium-plus",
      });
      result.current.dispatch({
        type: "SELECT_RIGHT",
        instanceId: "L1:ci:r:ion:sodium-plus",
      });
      result.current.dispatch({
        type: "SELECT_LEFT",
        instanceId: "L1:ci:l:ion:nitrate",
      });
      result.current.dispatch({
        type: "SELECT_RIGHT",
        instanceId: "L1:ci:r:ion:nitrate",
      });
    });

    act(() => {
      result.current.dispatch({ type: "CONFIRM" });
    });

    // Complete level
    act(() => {
      result.current.dispatch({ type: "COMPLETE_LEVEL", at: Date.now() });
    });

    expect(result.current.state.phase).toBe("levelComplete");

    // Re-render multiple times
    rerender();
    rerender();
    rerender();

    // Verify record was called exactly once
    expect(recordedEvents).toHaveLength(1);
    const event = recordedEvents[0]!;
    expect(event.playerName).toBe("Student-Test");
    expect(event.levelId).toBe(1);
    expect(event.completed).toBe(true);
    expect(event.score).toBe(100);
    expect(event.stars).toBe(3);
    expect(event.errorsByCode).toBeDefined();
    expect(event.errorsByCode["E-CHARGE"]).toBe(0);
    expect(event.errorsByCode["E-PAIR"]).toBe(0);
    expect(event.errorsByCode["E-PHASE"]).toBe(0);
    expect(event.errorsByCode["E-BALANCE"]).toBe(0);
    expect(event.errorsByCode["E-RATIO"]).toBe(0);
    expect(event.errorsByCode["E-SPECTATOR"]).toBe(0);
  });
});
