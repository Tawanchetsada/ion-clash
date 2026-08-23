"use client";

import { useMemo } from "react";
import type { BuiltLevel } from "../../../../../data/buildLevel";
import type { GameEvent } from "../../../../../domain/game/events";
import { productSlotIds, reactantIonCards } from "../../../../../domain/game/instances";
import { canCheckArrangement, canCheckBalance } from "../../../../../domain/game/selectors";
import type { GameState } from "../../../../../domain/game/types";
import { CoefficientInput } from "../../../../../components/game/CoefficientInput";
import { IonCard } from "../../../../../components/game/IonCard";
import { IonSlot } from "../../../../../components/game/IonSlot";
import { DragLayer } from "../../../../../components/interaction/DragLayer";
import { intentToEvent } from "../../../../../components/interaction/intentToEvent";
import { useAnnouncer } from "../../../../../components/interaction/LiveAnnouncer";
import { usePlacement } from "../../../../../components/interaction/usePlacement";
import { Button } from "../../../../../components/ui/Button";
import { ionCardView } from "../../../../../presentation/cards";

export type Step2Props = {
  state: GameState;
  level: BuiltLevel;
  dispatch: (event: GameEvent) => void;
  onPlaySound?: (key: "place") => void;
};

export function Step2({ state, level, dispatch, onPlaySound }: Step2Props) {
  const { announce } = useAnnouncer();
  const slotIds = useMemo(() => productSlotIds(level), [level]);
  const allReactantCards = useMemo(() => reactantIonCards(level), [level]);

  const slotLabels: Record<string, string> = useMemo(
    () => ({
      [slotIds[0] ?? ""]: "ช่องที่ 1 (ไอออนบวก คู่ที่ 1)",
      [slotIds[1] ?? ""]: "ช่องที่ 2 (ไอออนลบ คู่ที่ 1)",
      [slotIds[2] ?? ""]: "ช่องที่ 3 (ไอออนบวก คู่ที่ 2)",
      [slotIds[3] ?? ""]: "ช่องที่ 4 (ไอออนลบ คู่ที่ 2)",
    }),
    [slotIds],
  );

  const placement = usePlacement({
    onIntent: (intent) => {
      const event = intentToEvent(intent);
      if (event) {
        dispatch(event);
        onPlaySound?.("place");
        if (intent.kind === "place") {
          const label = slotLabels[intent.slotId] ?? "ช่อง";
          announce(`วางไอออนลงใน ${label} แล้ว`);
        } else if (intent.kind === "remove") {
          announce("นำไอออนออกจากช่องแล้ว");
        } else if (intent.kind === "move") {
          announce("ย้ายไอออนไปยังช่องใหม่แล้ว");
        }
      }
    },
    disabled: state.phase !== "arrangeProductIons",
  });

  const assignedMap = new Map<string, string>(); // slotId -> instanceId
  const assignedSet = new Set<string>(); // instanceIds currently assigned
  for (const slot of state.slots) {
    if (slot.ionInstanceId) {
      assignedMap.set(slot.slotId, slot.ionInstanceId);
      assignedSet.add(slot.ionInstanceId);
    }
  }

  const cardMap = useMemo(() => {
    const map = new Map<string, (typeof allReactantCards)[0]>();
    for (const c of allReactantCards) {
      map.set(c.instanceId, c);
    }
    return map;
  }, [allReactantCards]);

  const isArranging = state.phase === "arrangeProductIons";
  const isBalancing = state.phase === "balanceEquation";

  return (
    <div
      className="flex flex-col items-center gap-6 text-center"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          placement.cancel();
          announce("ยกเลิกการเลือกแล้ว");
        }
      }}
    >
      <DragLayer
        dragging={placement.dragging}
        renderGhost={(source) => {
          const card = allReactantCards.find(
            (c) => c.instanceId === source.instanceId,
          );
          if (!card) return null;
          return <IonCard view={ionCardView(card)} />;
        }}
      />

      <div>
        <h2 className="text-xl font-bold text-navy">
          {isBalancing
            ? "ขั้นที่ 2 · ดุลสัมประสิทธิ์ของสมการ"
            : "ขั้นที่ 2 · แลกเปลี่ยนคู่ไอออนสร้างผลิตภัณฑ์ (4 → 4)"}
        </h2>
        <p className="text-sm text-navy/70">
          {isBalancing
            ? "กรอกตัวเลขสัมประสิทธิ์หน้าสารตั้งต้นและผลิตภัณฑ์เพื่อดุลสมการให้สมบูรณ์"
            : "ลากหรือแตะเลือกไอออนบวกและไอออนลบเพื่อจับคู่ผลิตภัณฑ์ใหม่ (ไอออนบวกต้องอยู่หน้าไอออนลบ)"}
        </p>
      </div>

      {/* Source Ion Pool (Reactants) */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-semibold text-navy/70">ไอออนตั้งต้น:</span>
        <div
          {...placement.targetPropsFor({ kind: "tray" })}
          className="flex flex-wrap items-center justify-center gap-3 rounded-card bg-canvas p-3 border border-navy/10 min-h-[100px]"
        >
          {allReactantCards.map((card) => {
            const isAssigned = assignedSet.has(card.instanceId);
            const isHeld = placement.isHeld({
              kind: "card",
              instanceId: card.instanceId,
            });
            const view = ionCardView(card);
            const dragHandlers = placement.dragHandlersFor({
              kind: "card",
              instanceId: card.instanceId,
            });

            if (isAssigned) {
              return (
                <div
                  key={card.instanceId}
                  className="h-11 w-20 rounded-card border border-dashed border-border opacity-30 flex items-center justify-center text-xs text-navy"
                >
                  (ในช่อง)
                </div>
              );
            }

            return (
              <IonCard
                key={card.instanceId}
                view={view}
                selected={isHeld}
                isDragging={
                  placement.dragging?.source.kind === "card" &&
                  placement.dragging.source.instanceId === card.instanceId
                }
                onSelect={() => {
                  placement.toggleHold({
                    kind: "card",
                    instanceId: card.instanceId,
                  });
                  announce(
                    isHeld
                      ? `ยกเลิกการเลือก ${view.ariaLabel}`
                      : `เลือก ${view.ariaLabel} แล้ว กดที่ช่องปลายทางเพื่อวาง`,
                  );
                }}
                onPointerDown={isArranging ? dragHandlers.onPointerDown : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Arrow Down Indicator */}
      <span className="text-lg font-bold text-navy/70">↓ จับคู่เป็นผลิตภัณฑ์</span>

      {/* Product Target Slots (2 pairs) */}
      <div className="flex flex-wrap items-center justify-center gap-6">
        {/* Pair 1 */}
        <div className="flex flex-col items-center gap-2 rounded-card bg-white p-3 shadow-card border border-border">
          <span className="text-xs font-bold text-navy">ผลิตภัณฑ์คู่ที่ 1</span>
          <div className="flex items-center gap-2">
            {[0, 1].map((idx) => {
              const slotId = slotIds[idx]!;
              const assignedCardId = assignedMap.get(slotId) ?? null;
              const assignedCard = assignedCardId ? cardMap.get(assignedCardId) : null;
              const cardView = assignedCard ? ionCardView(assignedCard) : null;
              const isTarget = placement.activeTargetId === slotId;
              const isHeld =
                assignedCardId != null &&
                placement.isHeld({
                  kind: "slot",
                  slotId,
                  instanceId: assignedCardId,
                });
              const dragHandlers = assignedCardId
                ? placement.dragHandlersFor({
                    kind: "slot",
                    slotId,
                    instanceId: assignedCardId,
                  })
                : undefined;

              return (
                <IonSlot
                  key={slotId}
                  slotId={slotId}
                  slotLabelTh={slotLabels[slotId] ?? `ช่องที่ ${idx + 1}`}
                  assignedIon={cardView}
                  isDropTarget={isTarget}
                  selected={isHeld}
                  onActivate={() => {
                    placement.activateTarget({ kind: "slot", slotId });
                  }}
                  onSelect={
                    assignedCardId
                      ? () => {
                          placement.toggleHold({
                            kind: "slot",
                            slotId,
                            instanceId: assignedCardId,
                          });
                        }
                      : undefined
                  }
                  onRemove={
                    assignedCardId
                      ? () => {
                          dispatch({ type: "REMOVE_ION", slotId });
                          announce("นำไอออนออกจากช่องแล้ว");
                        }
                      : undefined
                  }
                  onPointerDown={dragHandlers?.onPointerDown}
                />
              );
            })}
          </div>
        </div>

        <span className="text-2xl font-bold text-navy">+</span>

        {/* Pair 2 */}
        <div className="flex flex-col items-center gap-2 rounded-card bg-white p-3 shadow-card border border-border">
          <span className="text-xs font-bold text-navy">ผลิตภัณฑ์คู่ที่ 2</span>
          <div className="flex items-center gap-2">
            {[2, 3].map((idx) => {
              const slotId = slotIds[idx]!;
              const assignedCardId = assignedMap.get(slotId) ?? null;
              const assignedCard = assignedCardId ? cardMap.get(assignedCardId) : null;
              const cardView = assignedCard ? ionCardView(assignedCard) : null;
              const isTarget = placement.activeTargetId === slotId;
              const isHeld =
                assignedCardId != null &&
                placement.isHeld({
                  kind: "slot",
                  slotId,
                  instanceId: assignedCardId,
                });
              const dragHandlers = assignedCardId
                ? placement.dragHandlersFor({
                    kind: "slot",
                    slotId,
                    instanceId: assignedCardId,
                  })
                : undefined;

              return (
                <IonSlot
                  key={slotId}
                  slotId={slotId}
                  slotLabelTh={slotLabels[slotId] ?? `ช่องที่ ${idx + 1}`}
                  assignedIon={cardView}
                  isDropTarget={isTarget}
                  selected={isHeld}
                  onActivate={() => {
                    placement.activateTarget({ kind: "slot", slotId });
                  }}
                  onSelect={
                    assignedCardId
                      ? () => {
                          placement.toggleHold({
                            kind: "slot",
                            slotId,
                            instanceId: assignedCardId,
                          });
                        }
                      : undefined
                  }
                  onRemove={
                    assignedCardId
                      ? () => {
                          dispatch({ type: "REMOVE_ION", slotId });
                          announce("นำไอออนออกจากช่องแล้ว");
                        }
                      : undefined
                  }
                  onPointerDown={dragHandlers?.onPointerDown}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Coefficient Balancing Inputs (When in balanceEquation phase) */}
      {isBalancing && (
        <div className="flex flex-col items-center gap-3 rounded-card bg-white p-4 shadow-card border border-border">
          <span className="text-sm font-bold text-navy">สัมประสิทธิ์การดุลสมการ:</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <CoefficientInput
              value={state.coefficients[0]}
              compoundLabelTh={level.reactantA.nameTh}
              onChange={(val) => dispatch({ type: "SET_COEFFICIENT", index: 0, value: val })}
            />
            <CoefficientInput
              value={state.coefficients[1]}
              compoundLabelTh={level.reactantB.nameTh}
              onChange={(val) => dispatch({ type: "SET_COEFFICIENT", index: 1, value: val })}
            />
            <span className="text-xl font-bold text-navy">→</span>
            <CoefficientInput
              value={state.coefficients[2]}
              compoundLabelTh={level.productA.nameTh}
              onChange={(val) => dispatch({ type: "SET_COEFFICIENT", index: 2, value: val })}
            />
            <CoefficientInput
              value={state.coefficients[3]}
              compoundLabelTh={level.productB.nameTh}
              onChange={(val) => dispatch({ type: "SET_COEFFICIENT", index: 3, value: val })}
            />
          </div>
        </div>
      )}

      {/* Action Check Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        {isArranging && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                for (const s of slotIds) {
                  dispatch({ type: "REMOVE_ION", slotId: s });
                }
              }}
            >
              ล้างทุกช่อง
            </Button>
            <Button
              variant="gold"
              disabled={!canCheckArrangement(state)}
              onClick={() => dispatch({ type: "CHECK" })}
            >
              ตรวจการจัดเรียงไอออน
            </Button>
          </>
        )}

        {isBalancing && (
          <Button
            variant="gold"
            disabled={!canCheckBalance(state)}
            onClick={() => dispatch({ type: "CHECK_BALANCE" })}
          >
            ตรวจการดุลสมการ
          </Button>
        )}
      </div>
    </div>
  );
}
