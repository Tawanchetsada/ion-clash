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
  const [exitTarget, setExitTarget] = useState<string>("/levels");

  const verdict = useLevelGuard(resolvedParams?.levelId ?? "");
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (save && save.playerName.trim() === "") {
      router.replace("/");
      return;
    }
    if (verdict.status === "locked" && !redirectedRef.current) {
      redirectedRef.current = true;
      toast.show(`ผ่านด่าน ${verdict.requiredLevel} ก่อนเพื่อปลดล็อกด่านนี้`);
      router.replace("/levels");
    }
    if (verdict.status !== "locked") {
      redirectedRef.current = false;
    }
  }, [save, verdict, toast, router]);

  if (verdict.status === "invalid") {
    notFound();
  }

  if (verdict.status === "loading" || verdict.status === "locked") {
    return (
      <PageShell>
        <AppHeader onHome={() => router.push("/")} onLevels={() => router.push("/levels")} />
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
        <AppHeader onHome={() => router.push("/")} onLevels={() => router.push("/levels")} />
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

  const handleLeave = (target: string = "/levels") => {
    if (hasCheckpoint) {
      setExitTarget(target);
      setShowExitConfirm(true);
    } else {
      router.push(target);
    }
  };

  const diffConfig = {
    easy: { label: "ง่าย", dot: "bg-emerald-500", text: "text-emerald-700" },
    basic: { label: "พื้นฐาน", dot: "bg-sky-500", text: "text-sky-700" },
    medium: { label: "ปานกลาง", dot: "bg-amber-500", text: "text-amber-700" },
    hard: { label: "ยาก", dot: "bg-orange-500", text: "text-orange-700" },
    challenge: { label: "ท้าทาย", dot: "bg-purple-500", text: "text-purple-700" },
  }[level.difficulty] ?? { label: level.difficulty, dot: "bg-navy", text: "text-navy" };

  return (
    <PageShell>
      <AppHeader
        levelLabelTh={`ด่านที่ ${level.id}`}
        onHome={() => handleLeave("/")}
        onLevels={() => handleLeave("/levels")}
        onHowToPlay={() => handleLeave("/how-to-play")}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8 px-4 py-8 text-center">
        <div className="flex flex-col items-center gap-2">
          {/* ด่านที่ และ ระดับความยาก — ขนาดใหญ่ ชัดเจน ไร้กรอบและจุดไฟ */}
          <div className="flex items-center justify-center gap-2 text-lg sm:text-xl font-extrabold text-navy">
            <span>ด่านที่ {level.id}</span>
            <span className="text-navy/30">·</span>
            <span className="text-navy/80">ระดับ{diffConfig.label}</span>
          </div>

          <h1 className="text-lg font-extrabold text-navy sm:text-2xl md:text-3xl tracking-tight">
            ปฏิกิริยาระหว่างสารละลายอิเล็กโทรไลต์
          </h1>
          <p className="max-w-md text-sm text-navy/70">
            เมื่อผสมสารละลาย 2 ชนิดนี้เข้าด้วยกัน จะเกิดตะกอนอะไรขึ้น?
          </p>
        </div>

        {/* Reactants Equation Display — แถวเดียวเสมอ */}
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 rounded-2xl border border-border bg-white p-4 shadow-card sm:p-6 max-w-full overflow-x-auto">
          <CompoundCard view={reactant1View} />
          <span className="text-xl sm:text-2xl font-bold text-navy shrink-0">+</span>
          <CompoundCard view={reactant2View} />

          <EquationArrow responsive={false} className="shrink-0 mx-1" />

          {/* Mystery Product */}
          <div
            role="group"
            aria-label="ผลิตภัณฑ์ที่ต้องค้นหา"
            className="flex min-w-[72px] sm:min-w-[96px] flex-col items-center justify-center rounded-card border-2 border-dashed border-navy/30 bg-canvas px-3 py-3 sm:px-6 sm:py-4 shrink-0"
          >
            <span className="text-xl sm:text-2xl font-bold text-navy">?</span>
            <span className="text-[11px] sm:text-xs text-navy/80">ผลิตภัณฑ์</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="gold"
            className="h-12 px-10 text-lg font-bold shadow-md hover:shadow-lg"
            onClick={() => router.push(`/level/${level.id}/play`)}
          >
            เริ่มเล่นเกม
          </Button>

          <button
            type="button"
            onClick={() => handleLeave("/levels")}
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
              onClick={() => router.push(exitTarget)}
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
