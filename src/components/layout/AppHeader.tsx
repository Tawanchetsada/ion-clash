"use client";

import Link from "next/link";
import { MESSAGES } from "../../config/messages";
import { SettingsIcon } from "../ui/Icon";
import { useAudioOptional } from "../../audio/AudioProvider";

export type AppHeaderProps = {
  levelLabelTh?: string;
  onHome?: () => void;
  onLevels?: () => void;
  onHowToPlay?: () => void;
  /** ซ่อนปุ่มตั้งค่า — ใช้เฉพาะหน้าคลัง component ที่ไม่มี router จริง */
  hideSettings?: boolean;
};

/**
 * แถบบนสุดของทุกหน้า — ชื่อเกม เลขด่าน (ถ้ามี) ปุ่มหน้าหลัก/ภาพรวมด่าน/วิธีเล่น และปุ่มตั้งค่า
 */
export function AppHeader({
  levelLabelTh,
  onHome,
  onLevels,
  onHowToPlay,
  hideSettings = false,
}: AppHeaderProps) {
  const audio = useAudioOptional();

  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-navy px-4 py-2.5 text-white shadow-card">
      <Link
        href="/"
        onClick={(e) => {
          audio?.playUiTap();
          if (onHome) {
            e.preventDefault();
            onHome();
          }
        }}
        className="flex cursor-pointer flex-col text-left py-1 transition-all hover:opacity-90"
      >
        <span className="text-lg font-extrabold tracking-wide text-white leading-tight">
          ION <span className="text-gold">CLASH</span>
        </span>
        <span className="text-xs font-medium text-white/70 leading-tight">
          {MESSAGES.ui.gameSubtitle}
        </span>
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        {levelLabelTh && (
          <span className="rounded-card bg-white/10 px-3 py-1 text-sm">{levelLabelTh}</span>
        )}

        <nav aria-label={MESSAGES.ui.mainNav} className="flex items-center gap-2">
          {onLevels && (
            <button
              type="button"
              onClick={() => {
                audio?.playUiTap();
                onLevels();
              }}
              className="min-h-11 min-w-11 rounded-card px-3 py-2 text-sm hover:bg-white/10"
            >
              {MESSAGES.ui.levelOverview}
            </button>
          )}
          {onHowToPlay && (
            <button
              type="button"
              onClick={() => {
                audio?.playUiTap();
                onHowToPlay();
              }}
              className="min-h-11 min-w-11 rounded-card px-3 py-2 text-sm hover:bg-white/10"
            >
              {MESSAGES.ui.howToPlay}
            </button>
          )}
          {!hideSettings && (
            <Link
              href="/settings"
              aria-label={MESSAGES.ui.settings}
              title={MESSAGES.ui.settings}
              onClick={() => audio?.playUiTap()}
              className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-card px-3 py-2 text-sm hover:bg-white/10"
            >
              <SettingsIcon className="text-base" />
              <span aria-hidden="true" className="hidden sm:inline">
                {MESSAGES.ui.settings}
              </span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
