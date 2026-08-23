"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageShell } from "../../components/layout/PageShell";
import { LevelGrid } from "../../components/levels/LevelGrid";
import { levelGridView } from "../../presentation/levels";
import { useSave } from "../../session/SaveProvider";
import { StarIcon } from "../../components/ui/Icon";

export default function LevelsPage() {
  const router = useRouter();
  const { save } = useSave();

  useEffect(() => {
    if (save && save.playerName.trim() === "") {
      router.replace("/");
    }
  }, [save, router]);

  if (save === null || save.playerName.trim() === "") {
    return (
      <PageShell>
        <AppHeader
          onHome={() => router.push("/")}
          onHowToPlay={() => router.push("/how-to-play")}
        />
        <main className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-gold" />
          <p className="mt-4 text-sm text-navy/70">กำลังโหลดรายการด่าน…</p>
        </main>
      </PageShell>
    );
  }

  const groups = levelGridView(save);
  const completedEntries = Object.values(save.completedLevels).filter(
    (lvl) => lvl.completed,
  );
  const completedCount = completedEntries.length;
  const totalStars = completedEntries.reduce((sum, lvl) => sum + lvl.stars, 0);

  return (
    <PageShell>
      <AppHeader
        onHome={() => router.push("/")}
        onHowToPlay={() => router.push("/how-to-play")}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">เลือกด่าน</h1>
            <p className="text-sm text-navy/70">
              50 ด่านปฏิกิริยาการตกตะกอน แบ่งตาม 5 ระดับความยาก
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm font-semibold text-navy">
            <div className="rounded-card bg-navy/5 px-3 py-1.5 border border-border">
              <span>ผ่านแล้ว: </span>
              <span className="font-bold text-blue">{completedCount}/50</span>
            </div>
            <div className="rounded-card bg-gold-surface px-3 py-1.5 border border-gold/40">
              <span>ดาวรวม: </span>
              <span className="inline-flex items-center gap-1 font-bold text-navy">
                <StarIcon className="text-gold" />
                {totalStars}
              </span>
            </div>
          </div>
        </header>

        <LevelGrid
          groups={groups}
          onOpenLevel={(levelId) => {
            router.push(`/level/${levelId}/intro`);
          }}
        />
      </main>
    </PageShell>
  );
}
