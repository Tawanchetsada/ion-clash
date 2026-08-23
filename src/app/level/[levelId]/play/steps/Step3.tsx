"use client";

import type { BuiltLevel } from "../../../../../data/buildLevel";
import type { GameEvent } from "../../../../../domain/game/events";
import { isPrecipitateRevealed } from "../../../../../domain/game/selectors";
import type { GameState } from "../../../../../domain/game/types";
import { CompoundCard } from "../../../../../components/game/CompoundCard";
import { Button } from "../../../../../components/ui/Button";
import { compoundCardView } from "../../../../../presentation/cards";

export type Step3Props = {
  state: GameState;
  level: BuiltLevel;
  dispatch: (event: GameEvent) => void;
};

export function Step3({ state, level, dispatch }: Step3Props) {
  const precipitate = level.precipitate;
  const aqueous = level.aqueousProduct;

  const revealed = isPrecipitateRevealed(state);
  const precipitateView = compoundCardView(precipitate, { revealed });
  const aqueousView = compoundCardView(aqueous, { revealed });

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="text-xl font-bold text-navy">
          ขั้นที่ 3 · ตรวจสอบผลิตภัณฑ์และสถานะของสาร
        </h2>
        <p className="text-sm text-navy/70">
          ไอออนบางคู่รวมกันเกิดเป็นตะกอนที่ไม่ละลายน้ำ ในขณะที่ไอออนที่เหลือยังคงละลายอยู่ในสารละลาย
        </p>
      </div>

      {/* 2 Outcome Boxes (Precipitate vs Aqueous Solution) */}
      <div className="flex flex-wrap items-stretch justify-center gap-6">
        {/* Precipitate Box */}
        <div className="flex flex-1 min-w-[260px] max-w-sm flex-col items-center gap-3 rounded-card bg-gold/10 p-5 shadow-card border-2 border-gold">
          <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
            <span aria-hidden="true">★</span>
            <span>เกิดตะกอน (ไม่ละลายน้ำ)</span>
          </div>
          <CompoundCard view={precipitateView} />
          <span className="text-xs text-navy/70">
            สถานะของแข็ง (s) แยกตัวออกจากสารละลาย
          </span>
        </div>

        {/* Aqueous Solution Box */}
        <div className="flex flex-1 min-w-[260px] max-w-sm flex-col items-center gap-3 rounded-card bg-white p-5 shadow-card border border-border">
          <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
            <span aria-hidden="true">💧</span>
            <span>ยังคงอยู่ในสารละลาย</span>
          </div>
          <CompoundCard view={aqueousView} />
          <span className="text-xs text-navy/70">
            สถานะสารละลาย (aq) แตกตัวเป็นไอออนอิสระ
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          variant="gold"
          onClick={() => dispatch({ type: "CONFIRM_PRODUCTS" })}
        >
          ไปขั้นตัดไอออนผู้ชม →
        </Button>
      </div>
    </div>
  );
}
