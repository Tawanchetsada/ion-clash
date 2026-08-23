"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SaveStatusKind } from "../components/game/SaveStatus";
import {
  createAutosaveScheduler,
  DEFAULT_AUTOSAVE_DELAY_MS,
  type AutosaveScheduler,
} from "../storage/autosave";
import {
  createGameSaveRepository,
  saveFileName,
  type GameSaveRepository,
  type ImportResult,
} from "../storage/repository";
import type { GameSaveV1 } from "../storage/schema";

export type SaveContextValue = {
  /** null = ยังโหลดไม่เสร็จ (SSR หรือก่อน mount) — ห้าม render ปุ่มที่ขึ้นกับเซฟจนกว่าจะไม่ null */
  save: GameSaveV1 | null;
  status: SaveStatusKind;
  /** เขียนทันที ใช้ตอนจบด่าน */
  commit(next: GameSaveV1): void;
  /** เขียนแบบหน่วง 400ms ใช้กับ checkpoint ระหว่างเล่น */
  scheduleCommit(next: GameSaveV1): void;
  retry(): void;
  exportJson(): void;
  importJson(text: string): ImportResult;
  applyImport(merged: GameSaveV1): void;
  reset(): void;
};

const SaveContext = createContext<SaveContextValue | null>(null);

export type SaveProviderProps = {
  children: ReactNode;
  repository?: GameSaveRepository | undefined;
  debounceMs?: number | undefined;
};

export function SaveProvider({
  children,
  repository: injectedRepo,
  debounceMs = DEFAULT_AUTOSAVE_DELAY_MS,
}: SaveProviderProps) {
  const repoRef = useRef<GameSaveRepository | null>(injectedRepo ?? null);
  const [save, setSave] = useState<GameSaveV1 | null>(null);
  const [status, setStatus] = useState<SaveStatusKind>("idle");

  const saveRef = useRef<GameSaveV1 | null>(null);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const schedulerRef = useRef<AutosaveScheduler | null>(null);

  // Initialize repository lazily or on mount
  function getRepo(): GameSaveRepository {
    if (!repoRef.current) {
      repoRef.current = createGameSaveRepository();
    }
    return repoRef.current;
  }

  const executeSave = useCallback((targetSave: GameSaveV1) => {
    setStatus("saving");
    const repo = getRepo();
    const result = repo.save(targetSave);
    if (result.ok) {
      setStatus("saved");
    } else {
      setStatus("error");
    }
  }, []);

  // Setup mount loading and external change subscription
  useEffect(() => {
    const repo = getRepo();
    const loaded = repo.load();
    setSave(loaded);
    saveRef.current = loaded;
    setStatus("idle");

    const scheduler = createAutosaveScheduler({
      save: () => {
        if (saveRef.current) {
          executeSave(saveRef.current);
        }
      },
      delayMs: debounceMs,
    });
    schedulerRef.current = scheduler;

    const unsubscribe = repo.subscribeExternalChange((externalSave) => {
      setSave(externalSave);
      saveRef.current = externalSave;
    });

    return () => {
      unsubscribe();
      scheduler.dispose();
      schedulerRef.current = null;
    };
  }, [debounceMs, executeSave]);

  const commit = useCallback(
    (next: GameSaveV1) => {
      setSave(next);
      saveRef.current = next;
      // If there was a pending debounced save, flush it
      if (schedulerRef.current) {
        schedulerRef.current.flushNow();
      }
      executeSave(next);
    },
    [executeSave],
  );

  const scheduleCommit = useCallback((next: GameSaveV1) => {
    setSave(next);
    saveRef.current = next;
    setStatus("saving");
    if (schedulerRef.current) {
      schedulerRef.current.schedule();
    } else {
      // Fallback if not yet initialized
      const repo = getRepo();
      const res = repo.save(next);
      setStatus(res.ok ? "saved" : "error");
    }
  }, []);

  const retry = useCallback(() => {
    if (saveRef.current) {
      executeSave(saveRef.current);
    }
  }, [executeSave]);

  const exportJson = useCallback(() => {
    const repo = getRepo();
    const blob = repo.exportJson();
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = saveFileName(new Date());
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const importJson = useCallback((text: string): ImportResult => {
    const repo = getRepo();
    return repo.importJson(text);
  }, []);

  const applyImport = useCallback(
    (merged: GameSaveV1) => {
      commit(merged);
    },
    [commit],
  );

  const reset = useCallback(() => {
    const repo = getRepo();
    repo.reset();
    const fresh = repo.load();
    setSave(fresh);
    saveRef.current = fresh;
    setStatus("idle");
  }, []);

  const contextValue: SaveContextValue = {
    save,
    status,
    commit,
    scheduleCommit,
    retry,
    exportJson,
    importJson,
    applyImport,
    reset,
  };

  return (
    <SaveContext.Provider value={contextValue}>{children}</SaveContext.Provider>
  );
}

export function useSave(): SaveContextValue {
  const ctx = useContext(SaveContext);
  if (!ctx) {
    throw new Error("useSave ต้องถูกใช้ภายใต้ <SaveProvider>");
  }
  return ctx;
}
