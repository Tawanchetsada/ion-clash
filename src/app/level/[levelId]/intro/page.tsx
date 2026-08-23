"use client";

import { use, useEffect, useRef, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { PageShell } from "../../../../components/layout/PageShell";
import { CompoundCard } from "../../../../components/game/CompoundCard";
import { Button } from "../../../../components/ui/Button";
import { Dialog } from "../../../../components/ui/Dialog";
import { compoundCardView } from "../../../../presentation/cards";
import { useSave } from "../../../../session/SaveProvider";
import { useToast } from "../../../../session/ToastProvider";
import { useLevelGuard } from "../../../../session/useLevelGuard";
import { EquationArrow } from "../../../../components/game/EquationArrow";

type PageParams = { levelId: string };

export default function LevelIntroPage({
  params,
}: {
  params: Promise<PageParams> | PageParams;
}) {
  const resolvedParams =
    params && typeof (params as Promise<PageParams>).then === "function"
      ? use(params as Promise<PageParams>)
      : (params as PageParams);

  const router = useRouter();
  const toast = useToast();
  const { save } = useSave();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const verdict = useLevelGuard(resolvedParams?.levelId ?? "");
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (verdict.status === "locked" && !redirectedRef.current) {
      redirectedRef.current = true;
      toast.show(`ผ่านด่าน ${verdict.requiredLevel} ก่อนเพื่อปลดล็อกด่านนี้`);
      router.replace("/levels");
    }
    if (verdict.status !== "locked") {
      redirectedRef.current = false;
    }
  }, [verdict, toast, router]);

  if (verdict.status === "invalid") {
    notFound();
  }

  if (verdict.status === "loading" || verdict.status === "locked") {
    return (
      <PageShell>
        <AppHeader onHome={() => router.push("/")} />
        <main className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-gold" />
          <p className="mt-4 text-sm text-navy/70">กำลังตรวจสอบข้อมูลด่าน…</p>
        </main>
      </PageShell>
    );
  }

  if (verdict.status === "broken") {
    return (
      <PageShell>
        <AppHeader onHome={() => router.push("/")} />
        <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md rounded-card bg-white p-6 shadow-card border border-error/30">
            <h1 className="text-xl font-bold text-error">ไม่สามารถสร้างข้อมูลด่านนี้ได้</h1>
            <p className="mt-2 text-sm text-navy/70">รหัสข้อผิดพลาด: {verdict.code}</p>
            <Button
              variant="gold"
              className="mt-4"
              onClick={() => router.push("/levels")}
            >
              กลับหน้าเลือกด่าน
            </Button>
          </div>
        </main>
      </PageShell>
    );
  }

  const { level } = verdict;
  const reactant1View = compoundCardView(level.reactantA, { revealed: false });
  const reactant2View = compoundCardView(level.reactantB, { revealed: false });

  const hasCheckpoint =
    save?.activeCheckpoint !== null &&
    save?.activeCheckpoint !== undefined &&
    save.activeCheckpoint.levelId === level.id;

  const handleLeave = () => {
    if (hasCheckpoint) {
      setShowExitConfirm(true);
    } else {
      router.push("/levels");
    }
  };

  return (
    <PageShell>
      <AppHeader
        levelLabelTh={`ด่านที่ ${level.id}`}
        onHome={handleLeave}
        onHowToPlay={() => router.push("/how-to-play")}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8 px-4 py-8 text-center">
        <div>
          <span className="inline-block rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy mb-2">
            ด่านที่ {level.id} · ระดับ {level.difficulty}
          </span>
          <h1 className="text-3xl font-bold text-navy">
            ปฏิกิริยาระหว่างสารละลายอิเล็กโทรไลต์
          </h1>
          <p className="mt-2 text-sm text-navy/70">
            เมื่อผสมสารละลาย 2 ชนิดนี้เข้าด้วยกัน จะเกิดตะกอนอะไรขึ้น?
          </p>
        </div>

        {/* Reactants Equation Display */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-white p-4 shadow-card sm:flex-row sm:gap-4 sm:p-6">
          <div className="flex items-center gap-3">
            <CompoundCard view={reactant1View} />
            <span className="text-2xl font-bold text-navy">+</span>
            <CompoundCard view={reactant2View} />
          </div>

          <EquationArrow />

          {/* Mystery Product */}
          <div
            role="group"
            aria-label="ผลิตภัณฑ์ที่ต้องค้นหา"
            className="flex flex-col items-center justify-center rounded-card border-2 border-dashed border-navy/30 bg-canvas px-6 py-4"
          >
            <span className="text-2xl font-bold text-navy">?</span>
            <span className="text-xs text-navy/80">ผลิตภัณฑ์</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="gold"
            className="px-8 py-3 text-lg"
            onClick={() => router.push(`/level/${level.id}/play`)}
          >
            เริ่มแยกไอออน
          </Button>

          <button
            type="button"
            onClick={handleLeave}
            className="text-sm font-semibold text-navy/70 hover:underline min-h-11 min-w-11 inline-flex items-center justify-center"
          >
            กลับหน้าเลือกด่าน
          </button>
        </div>
      </main>

      <Dialog
        open={showExitConfirm}
        titleTh="ออกจากด่านหรือไม่?"
        onClose={() => setShowExitConfirm(false)}
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-sm text-navy/80">
            คุณมีความก้าวหน้าที่บันทึกไว้ในด่านนี้ หากออกตอนนี้ระบบจะเก็บความก้าวหน้าล่าสุดไว้ให้คุณเล่นต่อได้
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => router.push("/levels")}
            >
              ออกจากด่าน
            </Button>
            <Button
              variant="gold"
              onClick={() => setShowExitConfirm(false)}
            >
              เล่นต่อ
            </Button>
          </div>
        </div>
      </Dialog>
    </PageShell>
  );
}
