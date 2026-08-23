"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { toCsv, toTsv } from "../research/csv";
import { createLocalSink, type LocalResearchSink } from "../research/localSink";
import { createRemoteSink } from "../research/remoteSink";
import { createCompositeSink, type ResearchSink } from "../research/sink";
import type { ResearchEvent } from "../research/types";
import { getBrowserStorage } from "../storage/localStorageAdapter";
import { useSave } from "./SaveProvider";

export type ResearchContextValue = {
  record(event: ResearchEvent): void;
  flush(): Promise<void>;
  getAllEvents(): readonly ResearchEvent[];
  clearEvents(): void;
  exportTsv(): string;
  exportCsv(): string;
};

const ResearchContext = createContext<ResearchContextValue | null>(null);

export type ResearchProviderProps = {
  children: ReactNode;
  sink?: ResearchSink | undefined;
  localSink?: LocalResearchSink | undefined;
  endpoint?: string | undefined;
};

export function ResearchProvider({
  children,
  sink: injectedSink,
  localSink: injectedLocalSink,
  endpoint = process.env.NEXT_PUBLIC_RESEARCH_ENDPOINT,
}: ResearchProviderProps) {
  const { save } = useSave();
  const consent = save?.settings.researchConsent ?? false;

  const storage = useMemo(() => getBrowserStorage(), []);

  const localSink = useMemo(() => {
    return injectedLocalSink ?? createLocalSink(storage);
  }, [injectedLocalSink, storage]);

  const remoteSink = useMemo(() => {
    return createRemoteSink({
      endpoint,
      enabled: consent,
      storage,
    });
  }, [endpoint, consent, storage]);

  const compositeSink = useMemo(() => {
    if (injectedSink) return injectedSink;
    return createCompositeSink([localSink, remoteSink]);
  }, [injectedSink, localSink, remoteSink]);

  const record = useCallback(
    (event: ResearchEvent) => {
      try {
        compositeSink.record(event);
      } catch {
        // Safe fail
      }
    },
    [compositeSink],
  );

  const flush = useCallback(async () => {
    try {
      await compositeSink.flush();
    } catch {
      // Safe fail
    }
  }, [compositeSink]);

  const getAllEvents = useCallback(() => {
    return localSink.readAll();
  }, [localSink]);

  const clearEvents = useCallback(() => {
    localSink.clear();
  }, [localSink]);

  const exportTsv = useCallback(() => {
    return toTsv(localSink.readAll());
  }, [localSink]);

  const exportCsv = useCallback(() => {
    return toCsv(localSink.readAll());
  }, [localSink]);

  const value: ResearchContextValue = useMemo(
    () => ({
      record,
      flush,
      getAllEvents,
      clearEvents,
      exportTsv,
      exportCsv,
    }),
    [record, flush, getAllEvents, clearEvents, exportTsv, exportCsv],
  );

  return (
    <ResearchContext.Provider value={value}>
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch(): ResearchContextValue {
  const ctx = useContext(ResearchContext);
  if (!ctx) {
    throw new Error("useResearch ต้องถูกใช้ภายใต้ <ResearchProvider>");
  }
  return ctx;
}

export function useOptionalResearch(): ResearchContextValue | null {
  return useContext(ResearchContext);
}

