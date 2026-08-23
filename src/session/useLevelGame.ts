"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import type { BuiltLevel } from "../data/buildLevel";
import { applyCheckpoint, toCheckpoint } from "../domain/game/checkpoint";
import type { GameEvent } from "../domain/game/events";
import {
  createInitialState,
  reduce,
} from "../domain/game/gameMachine";
import {
  isPrecipitateRevealed,
  levelResultOf,
  progressStep,
  type ProgressStep,
} from "../domain/game/selectors";
import type { GameState } from "../domain/game/types";
import { clearCheckpoint, recordLevelResult, saveCheckpoint } from "../storage/progress";
import type { LevelCheckpoint } from "../storage/schema";
import { useSave } from "./SaveProvider";

export type UseLevelGame = {
  state: GameState;
  level: BuiltLevel;
  dispatch(event: GameEvent): void;
  step: ProgressStep | null;
  hintText: string | null;
};

type InternalAction =
  | { type: "GAME_EVENT"; event: GameEvent }
  | { type: "RESTORE_CHECKPOINT"; checkpoint: LevelCheckpoint; at: number }
  | { type: "RESET_STATE" };

// Safe audio trigger if under AudioProvider
type SoundFn = (key: "place" | "correct" | "wrong" | "gold" | "levelup") => void;

export function useLevelGame(
  level: BuiltLevel,
  options?: {
    playAudio?: SoundFn | undefined;
  },
): UseLevelGame {
  const { save, commit, scheduleCommit } = useSave();

  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const [state, rawDispatch] = useReducer(
    (s: GameState, action: InternalAction) => {
      if (action.type === "GAME_EVENT") {
        return reduce(s, action.event, level);
      }
      if (action.type === "RESTORE_CHECKPOINT") {
        const restored = applyCheckpoint(action.checkpoint, level, action.at);
        return restored ?? s;
      }
      if (action.type === "RESET_STATE") {
        return createInitialState(level);
      }
      return s;
    },
    undefined,
    () => {
      if (
        save?.activeCheckpoint &&
        save.activeCheckpoint.levelId === level.id
      ) {
        const restored = applyCheckpoint(
          save.activeCheckpoint,
          level,
          Date.now(),
        );
        if (restored) return restored;
      }
      return createInitialState(level);
    },
  );

  // Restore checkpoint when save loads asynchronously after mount
  const restoredCheckpointRef = useRef(false);
  useEffect(() => {
    if (
      !restoredCheckpointRef.current &&
      save?.activeCheckpoint &&
      save.activeCheckpoint.levelId === level.id &&
      state.phase === "levelIntro" &&
      state.startedAt === null
    ) {
      restoredCheckpointRef.current = true;
      rawDispatch({
        type: "RESTORE_CHECKPOINT",
        checkpoint: save.activeCheckpoint,
        at: Date.now(),
      });
    }
  }, [save, level, state.phase, state.startedAt]);

  const dispatch = useCallback((event: GameEvent) => {
    const now = Date.now();
    let enriched = event;
    if (
      event.type === "START_LEVEL" ||
      event.type === "COMPLETE_LEVEL" ||
      event.type === "REPLAY" ||
      event.type === "PAUSE" ||
      event.type === "RESUME"
    ) {
      if (event.at === undefined) {
        enriched = { ...event, at: now } as GameEvent;
      }
    }
    rawDispatch({ type: "GAME_EVENT", event: enriched });
  }, []);

  // Checkpoint autosave — triggers ONLY on state changes, reading current save from ref
  useEffect(() => {
    const currentSave = saveRef.current;
    if (!currentSave || state.phase === "levelComplete") return;
    const cp = toCheckpoint(state, {
      at: Date.now(),
      savedAt: new Date().toISOString(),
    });
    if (cp !== null) {
      const updated = saveCheckpoint(currentSave, cp);
      scheduleCommit(updated);
    }
  }, [state, scheduleCommit]);

  // Tab visibility pause/resume
  useEffect(() => {
    if (typeof document === "undefined") return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        dispatch({ type: "PAUSE", at: Date.now() });
      } else {
        dispatch({ type: "RESUME", at: Date.now() });
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [dispatch]);

  // Handle level completion
  const completedHandledRef = useRef(false);
  useEffect(() => {
    if (state.phase === "levelComplete" && !completedHandledRef.current) {
      completedHandledRef.current = true;
      const currentSave = saveRef.current;
      if (currentSave) {
        const result = levelResultOf(state, Date.now());
        const withResult = recordLevelResult(currentSave, result);
        const finalSave = clearCheckpoint(withResult);
        commit(finalSave);
      }
      options?.playAudio?.("levelup");
    }
    if (state.phase !== "levelComplete") {
      completedHandledRef.current = false;
    }
  }, [state, commit, options]);

  // Audio effects for feedback and gold reveal
  const prevFeedbackRef = useRef(state.lastFeedback);
  const prevGoldRef = useRef(isPrecipitateRevealed(state));

  useEffect(() => {
    if (state.lastFeedback && state.lastFeedback !== prevFeedbackRef.current) {
      if (state.lastFeedback.kind === "success") {
        options?.playAudio?.("correct");
      } else if (state.lastFeedback.kind === "error") {
        options?.playAudio?.("wrong");
      }
    }
    prevFeedbackRef.current = state.lastFeedback;

    const isGold = isPrecipitateRevealed(state);
    if (isGold && !prevGoldRef.current) {
      options?.playAudio?.("gold");
    }
    prevGoldRef.current = isGold;
  }, [state, options]);

  const step = progressStep(state.phase);
  const hintText =
    state.hintsUsed > 0 ? (level.hints[state.hintsUsed - 1] ?? null) : null;

  return {
    state,
    level,
    dispatch,
    step,
    hintText,
  };
}
