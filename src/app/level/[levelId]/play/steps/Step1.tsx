"use client";

import type { BuiltLevel } from "../../../../../data/buildLevel";
import type { GameEvent } from "../../../../../domain/game/events";
import { reactantIonCards } from "../../../../../domain/game/instances";
import type { GameState } from "../../../../../domain/game/types";
import { CompoundCard } from "../../../../../components/game/CompoundCard";
import { IonCard } from "../../../../../components/game/IonCard";
import { Button } from "../../../../../components/ui/Button";
import { compoundCardView, ionCardView } from "../../../../../presentation/cards";

export type Step1Props = {
  state: GameState;
  level: BuiltLevel;
  dispatch: (event: GameEvent) => void;
};

export function Step1({ state, level, dispatch }: Step1Props) {
  const reactant1View = compoundCardView(level.reactantA, { revealed: false });
  const reactant2View = compoundCardView(level.reactantB, { revealed: false });

  const reactantCards = reactantIonCards(level);
  const isDissociated = state.phase === "dissociateReactants";

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="text-xl font-bold text-navy">ขั้นที่ 1 · แตกตัวสารตั้งต้นเป็นไอออน</h2>
        <p className="text-sm text-navy/70">
          สารละลายอิเล็กโทรไลต์แตกตัวเป็นไอออนบวกและไอออนลบอย่างสมบูรณ์ในน้ำ
        </p>
      </div>

      {/* Initial Reactants Equation */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-card bg-white p-4 shadow-card border border-border">
        <CompoundCard view={reactant1View} />
        <span className="text-xl font-bold text-navy">+</span>
        <CompoundCard view={reactant2View} />
      </div>

      {/* Dissociated Ions Display */}
      {isDissociated && (
        <div className="flex flex-col items-center gap-4">
          <span className="text-sm font-semibold text-navy">
            ไอออนที่แตกตัวในสารละลาย (4 ไอออน):
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 rounded-card bg-canvas p-4 border border-navy/10">
            {reactantCards.map((card) => {
              const view = ionCardView(card);
              return <IonCard key={card.instanceId} view={view} />;
            })}
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap justify-center gap-3">
        {state.phase === "levelIntro" && (
          <Button
            variant="gold"
            onClick={() => dispatch({ type: "START_LEVEL", at: Date.now() })}
          >
            เริ่มแยกไอออน
          </Button>
        )}

        {state.phase === "dissociateReactants" && (
          <Button
            variant="gold"
            onClick={() => dispatch({ type: "CONTINUE" })}
          >
            ไปยังขั้นจัดเรียงไอออน
          </Button>
        )}
      </div>
    </div>
  );
}
