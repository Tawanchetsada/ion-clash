"use client";

import type { BuiltLevel } from "../data/buildLevel";
import { getLevel } from "../data/levels";
import { isLevelUnlocked } from "../storage/progress";
import { MAX_LEVEL_ID } from "../storage/schema";
import { useSave } from "./SaveProvider";

export type GuardVerdict =
  | { status: "loading" }
  | { status: "ok"; level: BuiltLevel }
  | { status: "invalid" }
  | { status: "locked"; requiredLevel: number }
  | { status: "broken"; code: string };

export function useLevelGuard(rawLevelId: string): GuardVerdict {
  const { save } = useSave();

  // 1. Check if rawLevelId is a valid integer between 1 and MAX_LEVEL_ID
  if (!/^\d+$/.test(rawLevelId)) {
    return { status: "invalid" };
  }

  const levelId = Number(rawLevelId);
  if (!Number.isInteger(levelId) || levelId < 1 || levelId > MAX_LEVEL_ID) {
    return { status: "invalid" };
  }

  // 2. Check if save has loaded
  if (save === null) {
    return { status: "loading" };
  }

  // 3. Check if level is unlocked
  if (!isLevelUnlocked(save, levelId)) {
    return { status: "locked", requiredLevel: Math.max(1, levelId - 1) };
  }

  // 4. Try building / getting level
  try {
    const level = getLevel(levelId);
    return { status: "ok", level };
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "BUILD_LEVEL_ERROR";
    return { status: "broken", code };
  }
}
