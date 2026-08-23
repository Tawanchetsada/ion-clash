"use client";

import { useMemo, useRef } from "react";
import type { BuiltLevel } from "../../../../../data/buildLevel";
import type { GameEvent } from "../../../../../domain/game/events";
import { completeIonicCards } from "../../../../../domain/game/instances";
import { canConfirmCancellation } from "../../../../../domain/game/selectors";
import type { GameState } from "../../../../../domain/game/types";
import { CutPairList } from "../../../../../components/game/CutPairList";
import { EquationStrip, type EquationStripCard } from "../../../../../components/game/EquationStrip";
import {
  SpectatorConnector,
  type ConnectorPair,
} from "../../../../../components/interaction/SpectatorConnector";
import { Button } from "../../../../../components/ui/Button";
import { equationCardView } from "../../../../../presentation/cards";

export type Step4Props = {
  state: GameState;
  level: BuiltLevel;
  dispatch: (event: GameEvent) => void;
};

export function Step4({ state, level, dispatch }: Step4Props) {
  const stripContainerRef = useRef<HTMLDivElement>(null);
  const cardRefsMap = useRef<Map<string, HTMLElement>>(new Map());

  const { left: initialLeftCards, right: initialRightCards } = useMemo(
    () => completeIonicCards(level),
    [level],
  );

  const registerCardRef = (instanceId: string, el: HTMLElement | null) => {
    if (el) {
      cardRefsMap.current.set(instanceId, el);
    } else {
      cardRefsMap.current.delete(instanceId);
    }
  };

  const isCardStruck = (instanceId: string) => {
    return state.canceledPairs.some(
      (p) => p.leftInstanceId === instanceId || p.rightInstanceId === instanceId,
    );
  };

  // Convert cards for EquationStrip
  const leftStripCards: readonly EquationStripCard[] = initialLeftCards.map(
    (card) => {
      const view = equationCardView(card, { revealed: true });
      const struck = isCardStruck(card.instanceId);
      const selected = state.selection?.instanceId === card.instanceId;

      return {
        view,
        struck,
        selected,
        onSelect:
          state.phase === "cancelSpectatorIons"
            ? () => {
                dispatch({ type: "SELECT_LEFT", instanceId: card.instanceId });
              }
            : undefined,
      };
    },
  );

  const rightStripCards: readonly EquationStripCard[] = initialRightCards.map(
    (card) => {
      const view = equationCardView(card, { revealed: true });
      const struck = isCardStruck(card.instanceId);
      const selected = state.selection?.instanceId === card.instanceId;

      return {
        view,
        struck,
        selected,
        onSelect:
          state.phase === "cancelSpectatorIons"
            ? () => {
                dispatch({ type: "SELECT_RIGHT", instanceId: card.instanceId });
              }
            : undefined,
      };
    },
  );

  const connectorPairs: ConnectorPair[] = state.canceledPairs.map((p) => ({
    leftInstanceId: p.leftInstanceId,
    rightInstanceId: p.rightInstanceId,
  }));

  // ป้ายภาษาไทยของคู่ที่ตัดไปแล้ว — ต้องอ่านจาก view model ไม่ใช่ `term.ionId`
  // ซึ่งเป็นรหัสภายในภาษาอังกฤษอย่าง "nitrate" แล้วหลุดขึ้นหน้าจอให้นักเรียนเห็น
  const pairLabels = state.canceledPairs.map((p, index) => {
    const cardLeft = initialLeftCards.find((c) => c.instanceId === p.leftInstanceId);
    const label = cardLeft ? equationCardView(cardLeft, { revealed: true }).nameTh : "";
    return `คู่ที่ ${index + 1}: ${label} — ตัดออกทั้งสองข้าง`;
  });

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="text-xl font-bold text-navy">ขั้นที่ 4 · ตัดไอออนตัวประกอบ</h2>
        <p className="text-sm text-navy/70">
          แตะไอออนฝั่งซ้ายและฝั่งขวาที่เหมือนกันทุกอย่างเพื่อตัดออกเป็นคู่
          เหลือไว้เฉพาะไอออนที่รวมกันเป็นตะกอน
        </p>
      </div>

      {/* Complete Ionic Equation Strip with SVG Connector */}
      <div className="w-full max-w-4xl min-w-0 rounded-card border border-border bg-white p-4 shadow-card sm:p-6">
        <EquationStrip
          left={leftStripCards}
          right={rightStripCards}
          innerRef={stripContainerRef}
          registerCardRef={registerCardRef}
          connector={
            <SpectatorConnector
              containerRef={stripContainerRef}
              cardRefs={cardRefsMap}
              pairs={connectorPairs}
              reducedMotion={false}
            />
          }
        />

        {/* List of Cut Pairs */}
        <div className="mt-4 border-t border-border pt-4">
          <CutPairList pairLabelsTh={pairLabels} />
        </div>

        {/* Undo / Reset / Confirm Actions */}
        <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={state.canceledPairs.length === 0}
              onClick={() => dispatch({ type: "UNDO" })}
            >
              ย้อนคู่ล่าสุด (UNDO)
            </Button>
            <Button
              variant="outline"
              disabled={state.canceledPairs.length === 0}
              onClick={() => dispatch({ type: "RESET" })}
            >
              ล้างการตัดทั้งหมด (RESET)
            </Button>
          </div>

          <Button
            variant="gold"
            disabled={!canConfirmCancellation(state, level)}
            onClick={() => dispatch({ type: "CONFIRM" })}
          >
            ยืนยันการตัดไอออน
          </Button>
        </div>
      </div>
    </div>
  );
}
