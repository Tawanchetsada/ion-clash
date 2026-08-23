"use client";

import type { BuiltLevel } from "../../../../../data/buildLevel";
import { renderIon } from "../../../../../domain/chemistry/formula";
import { getIon } from "../../../../../domain/chemistry/ions";
import type { GameEvent } from "../../../../../domain/game/events";
import { scoreOf, starsOf } from "../../../../../domain/game/selectors";
import type { GameState } from "../../../../../domain/game/types";
import { EquationView } from "../../../../../components/game/EquationView";
import { SaveStatus } from "../../../../../components/game/SaveStatus";
import { Button } from "../../../../../components/ui/Button";
import { useSave } from "../../../../../session/SaveProvider";
import { StarIcon, StarOutlineIcon } from "../../../../../components/ui/Icon";

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

  // Net ionic terms
  const reactantAsts = level.netIonic.reactants.map((term) =>
    term.kind === "ion"
      ? renderIon(getIon(term.ionId), term.count)
      : term.compound.formula,
  );

  const productAsts = level.netIonic.products.map((term) =>
    term.kind === "ion"
      ? renderIon(getIon(term.ionId), term.count)
      : term.compound.formula,
  );

  const spectatorNames = level.spectators
    .map((s) => getIon(s.ionId).nameTh)
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="text-xl font-bold text-navy">
          {isComplete ? "ผ่านด่านสำเร็จ" : "ขั้นที่ 5 · สมการไอออนิกสุทธิ"}
        </h2>
        <p className="text-sm text-navy/70">
          {isComplete
            ? "ยินดีด้วย! คุณได้สรุปสมการไอออนิกสุทธิและบันทึกคะแนนเรียบร้อยแล้ว"
            : "สมการที่แสดงเฉพาะไอออนและสารที่มีส่วนร่วมในการเกิดปฏิกิริยาจริง"}
        </p>
      </div>

      {/* Net Ionic Equation Display Box */}
      <div className="flex flex-col items-center gap-3 rounded-card bg-gold/10 p-6 shadow-card border-2 border-gold max-w-2xl w-full">
        <span className="text-xs font-bold text-navy">สมการไอออนิกสุทธิ:</span>
        <div className="flex flex-wrap items-center justify-center gap-3 text-2xl font-bold text-navy">
          {reactantAsts.map((ast, idx) => (
            <span key={idx} className="flex items-center gap-2">
              {idx > 0 && <span>+</span>}
              <EquationView ast={ast} />
            </span>
          ))}
          <span>→</span>
          {productAsts.map((ast, idx) => (
            <span key={idx} className="flex items-center gap-2">
              {idx > 0 && <span>+</span>}
              <EquationView ast={ast} />
            </span>
          ))}
        </div>

        <div className="mt-2 flex flex-col gap-1 text-xs text-navy/80 border-t border-gold/30 pt-3 w-full">
          <div>
            <span className="font-bold">ตะกอนที่เกิดขึ้น: </span>
            <span>{level.precipitate.nameTh} ({level.precipitate.formula.map((p) => p.value).join("")})</span>
          </div>
          {spectatorNames && (
            <div>
              <span className="font-bold">ไอออนตัวประกอบที่ถูกตัด: </span>
              <span>{spectatorNames}</span>
            </div>
          )}
        </div>
      </div>

      {/* When in netIonicResult phase */}
      {!isComplete && (
        <div className="flex justify-center">
          <Button
            variant="gold"
            className="px-8 py-3 text-lg"
            onClick={() => dispatch({ type: "COMPLETE_LEVEL", at: Date.now() })}
          >
            ดูผลคะแนนและจบด่าน
          </Button>
        </div>
      )}

      {/* When in levelComplete phase */}
      {isComplete && (
        <div className="flex flex-col items-center gap-6 w-full max-w-md rounded-card bg-white p-6 shadow-card border border-border">
          {/* Stars Display */}
          <div className="flex items-center justify-center gap-2 text-4xl text-gold" aria-label={`ได้รับ ${stars} ดาว`}>
            {[1, 2, 3].map((starIndex) =>
              starIndex <= stars ? (
                <StarIcon key={starIndex} />
              ) : (
                <StarOutlineIcon key={starIndex} className="text-navy/25" />
              ),
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 w-full text-center">
            <div className="rounded-card bg-canvas p-3 border border-navy/10">
              <div className="text-xs text-navy/70">คะแนนที่ได้</div>
              <div className="text-2xl font-bold text-navy">{score} / 100</div>
            </div>
            <div className="rounded-card bg-canvas p-3 border border-navy/10">
              <div className="text-xs text-navy/70">เวลาที่ใช้</div>
              <div className="text-2xl font-bold text-navy">{elapsedSec} วินาที</div>
            </div>
          </div>

          {/* Save Status */}
          <div className="flex items-center justify-center">
            <SaveStatus
              status={saveStatus}
              onRetry={retry}
              onExport={exportJson}
            />
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-wrap justify-center gap-3 w-full">
            {level.id < 50 && (
              <Button
                variant="gold"
                className="flex-1 min-w-[140px]"
                onClick={onNextLevel}
              >
                เล่นด่าน {level.id + 1} ต่อ
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={onLevels}
            >
              เลือกด่าน
            </Button>
            <Button
              variant="navy"
              className="w-full"
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
