"use client";

import type { ReactNode } from "react";
import { AudioProvider } from "../audio/AudioProvider";
import { AnnouncerProvider } from "../components/interaction/LiveAnnouncer";
import { MotionProvider } from "../components/interaction/MotionProvider";
import { SaveProvider, useSave } from "../session/SaveProvider";
import { ToastProvider } from "../session/ToastProvider";

function SettingsBridge({ children }: { children: ReactNode }) {
  const { save } = useSave();
  const sound = save?.settings.sound ?? true;
  const reducedMotion = save?.settings.reducedMotion ?? false;

  return (
    <AudioProvider enabled={sound}>
      <MotionProvider enabled={!reducedMotion}>
        <AnnouncerProvider>
          <ToastProvider>{children}</ToastProvider>
        </AnnouncerProvider>
      </MotionProvider>
    </AudioProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SaveProvider>
      <SettingsBridge>{children}</SettingsBridge>
    </SaveProvider>
  );
}
