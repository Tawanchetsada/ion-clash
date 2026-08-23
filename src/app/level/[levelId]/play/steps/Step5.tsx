"use client";

import type { BuiltLevel } from "../../../../../data/buildLevel";
import { renderIon } from "../../../../../domain/chemistry/formula";
import { getIon } from "../../../../../domain/chemistry/ions";
import type { GameEvent } from "../../../../../domain/game/events";
import { scoreOf, starsOf } from "../../../../../domain/game/selectors";
import type { GameState } from "../../../../../domain/game/types";
import { CelebrationBurst } from "../../../../../components/game/CelebrationBurst";
import { EquationView } from "../../../../../components/game/EquationView";
import { SaveStatus } from "../../../../../components/game/SaveStatus";
import { Button } from "../../../../../components/ui/Button";
import { StarIcon, StarOutlineIcon } from "../../../../../components/ui/Icon";
import { MESSAGES } from "../../../../../config/messages";
import { useSave } from "../../../../../session/SaveProvider";

export type Step5Props = {
  state: GameState;
  level: BuiltLevel;
  dispatch: (event: GameEvent) => void;
  onNextLevel: () => void;
  onLevels: () => void;
  onReplay: () => void;
};

export function Step5({
  state,
  level,
  dispatch,
  onNextLevel,
  onLevels,
  onReplay,
}: Step5Props) {
  const { status: saveStatus, retry, exportJson } = useSave();
  const isComplete = state.phase === "levelComplete";

  const score = scoreOf(state);
  const stars = starsOf(state);
  const elapsedSec = Math.round(state.elapsedMs / 1000);

  // Net ionic terms with states of matter (aq / s)
  const reactantTerms = level.netIonic.reactants.map((term) => ({
    ast:
      term.kind === "ion"
        ? renderIon(getIon(term.ionId), term.count)
        : term.compound.formula,
    phase: term.kind === "ion" ? term.phase : term.compound.phase,
  }));

  const productTerms = level.netIonic.products.map((term) => ({
    ast:
      term.kind === "ion"
        ? renderIon(getIon(term.ionId), term.count)
        : term.compound.formula,
    phase: term.kind === "ion" ? term.phase : term.compound.phase,
  }));

  const spectatorNames = level.spectators
    .map((s) => getIon(s.ionId).nameTh)
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-6 text-center w-full max-w-2xl mx-auto">
      {/* Celebration Fireworks Burst from left and right screen edges */}
      {isComplete && <CelebrationBurst />}

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">
          {isComplete ? `ผ่านด่านที่ ${level.id} สำเร็จ` : "ขั้นที่ 5 · สมการไอออนิกสุทธิ"}
        </h2>
        <p className="text-xs sm:text-sm text-navy/70 max-w-md mx-auto">
          {isComplete
            ? "ยินดีด้วย! คุณได้สรุปสมการไอออนิกสุทธิและบันทึกคะแนนเรียบร้อยแล้ว"
            : "สมการที่แสดงเฉพาะไอออนและสารที่มีส่วนร่วมในการเกิดปฏิกิริยาจริง"}
        </p>
      </div>

      {/* เมื่อผ่านด่านแล้ว: แสดงดาวและคะแนนไว้ด้านบนสุด ใต้หัวข้อผ่านด่านสำเร็จ */}
      {isComplete && (
        <div className="flex flex-col items-center gap-5 w-full rounded-2xl bg-white p-5 sm:p-6 shadow-card border border-border animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* 3 Stars in Arc / Crown layout (เฉพาะตัวดาว ไม่มีวงกลมล้อมรอบ) */}
          <div
            className="flex items-end justify-center gap-2 sm:gap-4 py-2"
            aria-label={`ได้รับ ${stars} ดาว`}
          >
            {/* ดาวที่ 1 (ซ้าย) */}
            <div className={`transition-all duration-500 delay-100 ${stars >= 1 ? "scale-100" : "scale-90 opacity-30 text-navy/20"}`}>
              {stars >= 1 ? (
                <StarIcon className="text-[44px] sm:text-[54px] text-gold drop-shadow-sm" />
              ) : (
                <StarOutlineIcon className="text-[44px] sm:text-[54px] text-navy/25" />
              )}
            </div>

            {/* ดาวที่ 2 (ดวงกลาง - ใหญ่และยกสูงขึ้น) */}
            <div className={`-translate-y-2 sm:-translate-y-3.5 transition-all duration-500 delay-300 ${stars >= 2 ? "scale-110 sm:scale-120" : "scale-90 opacity-30 text-navy/20"}`}>
              {stars >= 2 ? (
                <StarIcon className="text-[64px] sm:text-[76px] text-gold drop-shadow-md" />
              ) : (
                <StarOutlineIcon className="text-[64px] sm:text-[76px] text-navy/25" />
              )}
            </div>

            {/* ดาวที่ 3 (ขวา) */}
            <div className={`transition-all duration-500 delay-500 ${stars >= 3 ? "scale-100" : "scale-90 opacity-30 text-navy/20"}`}>
              {stars >= 3 ? (
                <StarIcon className="text-[44px] sm:text-[54px] text-gold drop-shadow-sm" />
              ) : (
                <StarOutlineIcon className="text-[44px] sm:text-[54px] text-navy/25" />
              )}
            </div>
          </div>

          {/* Badge ระดับผลงาน */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-surface border border-gold/40 px-3.5 py-1 text-xs font-bold text-navy">
            <span>ระดับผลงาน:</span>
            <span className="text-gold-dark font-extrabold">
              {stars === 3 ? "ยอดเยี่ยม (3 ดาว)" : stars === 2 ? "ดีมาก (2 ดาว)" : "ผ่านเกณฑ์ (1 ดาว)"}
            </span>
          </div>

          {/* ตารางสรุปคะแนนและเวลา */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
            <div className="rounded-xl bg-canvas p-3.5 border border-navy/10 text-center shadow-2xs">
              <div className="text-xs font-semibold text-navy/60">คะแนนที่ได้</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-navy mt-0.5">
                <span className="text-green-ink">{score}</span>
                <span className="text-xs text-navy/50 font-normal"> / 100</span>
              </div>
            </div>
            <div className="rounded-xl bg-canvas p-3.5 border border-navy/10 text-center shadow-2xs">
              <div className="text-xs font-semibold text-navy/60">เวลาที่ใช้</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-navy mt-0.5">
                {elapsedSec} <span className="text-sm font-semibold text-navy/70">วินาที</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Net Ionic Equation Display Box */}
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-gold-surface p-5 sm:p-6 shadow-card border-2 border-gold max-w-2xl w-full">
        <span className="text-xs font-bold text-navy tracking-wide">สมการไอออนิกสุทธิ (Net Ionic Equation):</span>
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xl sm:text-2xl font-bold text-navy">
          {reactantTerms.map((item, idx) => (
            <span key={idx} className="flex items-center gap-2">
              {idx > 0 && <span>+</span>}
              <span className="inline-flex items-baseline gap-1">
                <EquationView ast={item.ast} />
                <span className="text-base sm:text-lg font-semibold text-navy/80">({item.phase})</span>
              </span>
            </span>
          ))}
          <span className="mx-1">→</span>
          {productTerms.map((item, idx) => (
            <span key={idx} className="flex items-center gap-2">
              {idx > 0 && <span>+</span>}
              <span className="inline-flex items-baseline gap-1">
                <EquationView ast={item.ast} />
                <span className="text-base sm:text-lg font-semibold text-navy/80">({item.phase})</span>
              </span>
            </span>
          ))}
        </div>

        <div className="mt-2 flex flex-col gap-1 text-xs text-navy/80 border-t border-gold/30 pt-3 w-full">
          <div>
            <span className="font-bold">ตะกอนที่เกิดขึ้น: </span>
            <span>
              {level.precipitate.nameTh} ({level.precipitate.formula.map((p) => p.value).join("")} (s))
            </span>
          </div>
          {spectatorNames && (
            <div>
              <span className="font-bold">ไอออนผู้ชมที่ถูกตัด: </span>
              <span>{spectatorNames}</span>
            </div>
          )}
        </div>
      </div>

      {/* When in netIonicResult phase (ยังไม่ได้กดบันทึกคะแนน) */}
      {!isComplete && (
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "PREV_STEP" })}
          >
            {MESSAGES.ui.backToStep4}
          </Button>
          <Button
            variant="gold"
            className="px-8 py-3 text-lg"
            onClick={() => dispatch({ type: "COMPLETE_LEVEL", at: Date.now() })}
          >
            {MESSAGES.ui.completeAndScore}
          </Button>
        </div>
      )}

      {/* When in levelComplete phase (ปุ่มนำทางหลังจากผ่านด่าน) */}
      {isComplete && (
        <div className="flex flex-col items-center gap-4 w-full">
          {/* สถานะการบันทึกข้อมูล */}
          <div className="flex items-center justify-center">
            <SaveStatus
              status={saveStatus}
              onRetry={retry}
              onExport={exportJson}
            />
          </div>

          {/* แถบปุ่มกดนำทาง */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-lg">
            {level.id < 50 && (
              <Button
                variant="gold"
                className="w-full sm:flex-1 py-3 text-base font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all"
                onClick={onNextLevel}
              >
                เล่นด่าน {level.id + 1} ต่อ
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full sm:w-auto px-6 py-3"
              onClick={onLevels}
            >
              เลือกด่าน
            </Button>
            <Button
              variant="navy"
              className="w-full sm:w-auto px-6 py-3"
              onClick={onReplay}
            >
              เล่นด่านนี้อีกครั้ง
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

