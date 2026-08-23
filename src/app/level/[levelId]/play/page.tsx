"use client";

import { use, useEffect, useRef, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { useAudio } from "../../../../audio/AudioProvider";
import { FeedbackPanel } from "../../../../components/game/FeedbackPanel";
import { HintButton } from "../../../../components/game/HintButton";
import { SolubilityDialog } from "../../../../components/game/SolubilityDialog";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { PageShell } from "../../../../components/layout/PageShell";
import { StepIndicator } from "../../../../components/layout/StepIndicator";
import { Button } from "../../../../components/ui/Button";
import { Dialog } from "../../../../components/ui/Dialog";
import { MESSAGES } from "../../../../config/messages";
import { useToast } from "../../../../session/ToastProvider";
import { useLevelGame } from "../../../../session/useLevelGame";
import { useLevelGuard } from "../../../../session/useLevelGuard";
import { Step1 } from "./steps/Step1";
import { Step2 } from "./steps/Step2";
import { Step3 } from "./steps/Step3";
import { Step4 } from "./steps/Step4";
import { Step5 } from "./steps/Step5";

type PageParams = { levelId: string };

export default function PlayPage({
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
  const audio = useAudio();

  const verdict = useLevelGuard(resolvedParams?.levelId ?? "");
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (verdict.status === "locked" && !redirectedRef.current) {
      redirectedRef.current = true;
      toast.show(MESSAGES.toast.unlocked(verdict.requiredLevel));
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
              {MESSAGES.ui.backToLevels}
            </Button>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PlayContent
      level={verdict.level}
      playAudio={(key) => audio.play(key)}
    />
  );
}

function PlayContent({
  level,
  playAudio,
}: {
  level: Parameters<typeof useLevelGame>[0];
  playAudio: (key: "place" | "correct" | "wrong" | "gold" | "levelup") => void;
}) {
  const router = useRouter();
  const { state, dispatch, step, hintText } = useLevelGame(level, { playAudio });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const isMidLevel =
    state.phase !== "levelIntro" && state.phase !== "levelComplete";

  const handleLeave = () => {
    if (isMidLevel) {
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        {/* Top Progress, Rules & Hint Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <StepIndicator current={step} />

          <div className="flex items-center gap-3">
            {/* Rules Button (Does NOT deduct points) */}
            <Button
              variant="outline"
              onClick={() => setShowRules(true)}
            >
              {MESSAGES.ui.rules}
            </Button>

            {/* Hint Button */}
            {state.phase !== "levelComplete" && (
              <HintButton
                hintsUsed={state.hintsUsed}
                maxHints={level.hints.length}
                disabled={state.phase === "levelIntro"}
                onUseHint={() => dispatch({ type: "USE_HINT" })}
              />
            )}
          </div>
        </div>

        {/* Revealed Hint Box */}
        {hintText && state.phase !== "levelComplete" && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-card bg-gold/15 p-4 text-navy border border-gold/40"
          >
            <span aria-hidden="true" className="text-lg font-bold">
              💡
            </span>
            <div className="flex flex-col text-sm">
              <span className="font-bold">{MESSAGES.ui.hintTitle(state.hintsUsed)}</span>
              <span>{hintText}</span>
            </div>
          </div>
        )}

        {/* Feedback Panel */}
        <FeedbackPanel feedback={state.lastFeedback} />

        {/* Step-specific components */}
        {(state.phase === "levelIntro" ||
          state.phase === "dissociateReactants") && (
          <Step1 state={state} level={level} dispatch={dispatch} />
        )}

        {(state.phase === "arrangeProductIons" ||
          state.phase === "balanceEquation") && (
          <Step2
            state={state}
            level={level}
            dispatch={dispatch}
            onPlaySound={(key) => playAudio(key)}
          />
        )}

        {state.phase === "validateProducts" && (
          <Step3 state={state} level={level} dispatch={dispatch} />
        )}

        {state.phase === "cancelSpectatorIons" && (
          <Step4 state={state} level={level} dispatch={dispatch} />
        )}

        {(state.phase === "netIonicResult" ||
          state.phase === "levelComplete") && (
          <Step5
            state={state}
            level={level}
            dispatch={dispatch}
            onNextLevel={() => router.push(`/level/${level.id + 1}/intro`)}
            onLevels={() => router.push("/levels")}
            onReplay={() => dispatch({ type: "REPLAY", at: Date.now() })}
          />
        )}
      </main>

      {/* Solubility Rules Dialog */}
      <SolubilityDialog open={showRules} onClose={() => setShowRules(false)} />

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={showExitConfirm}
        titleTh={MESSAGES.ui.exitDialog.title}
        onClose={() => setShowExitConfirm(false)}
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-sm text-navy/80">
            {MESSAGES.ui.exitDialog.description}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => router.push("/levels")}
            >
              {MESSAGES.ui.exitDialog.confirm}
            </Button>
            <Button
              variant="gold"
              onClick={() => setShowExitConfirm(false)}
            >
              {MESSAGES.ui.exitDialog.cancel}
            </Button>
          </div>
        </div>
      </Dialog>
    </PageShell>
  );
}
