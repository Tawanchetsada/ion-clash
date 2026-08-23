"use client";

import { useReducer, useRef, useState } from "react";
import { getLevel } from "../../../data/levels";
import {
  createInitialState,
  reduce,
} from "../../../domain/game/gameMachine";
import {
  completeIonicCards,
  productSlotIds,
  reactantIonCards,
} from "../../../domain/game/instances";
import {
  canCheckArrangement,
  canConfirmCancellation,
} from "../../../domain/game/selectors";
import type { GameEvent } from "../../../domain/game/events";
import type { GameState } from "../../../domain/game/types";
import {
  equationCardView,
  ionCardView,
} from "../../../presentation/cards";
import { AudioProvider, useAudio } from "../../../audio/AudioProvider";
import {
  AnnouncerProvider,
  useAnnouncer,
} from "../../../components/interaction/LiveAnnouncer";
import {
  MotionProvider,
  useMotionEnabled,
} from "../../../components/interaction/MotionProvider";
import { usePlacement } from "../../../components/interaction/usePlacement";
import { intentToEvent } from "../../../components/interaction/intentToEvent";
import { DragLayer } from "../../../components/interaction/DragLayer";
import {
  SpectatorConnector,
  type ConnectorPair,
} from "../../../components/interaction/SpectatorConnector";
import { IonCard } from "../../../components/game/IonCard";
import { IonSlot } from "../../../components/game/IonSlot";
import { EquationStrip, type EquationStripCard } from "../../../components/game/EquationStrip";
import { FeedbackPanel } from "../../../components/game/FeedbackPanel";
import { CutPairList } from "../../../components/game/CutPairList";
import { Button } from "../../../components/ui/Button";
import { Panel } from "../../../components/ui/Panel";
import { PageShell } from "../../../components/layout/PageShell";

const level = getLevel(1); // AgNO3 + NaCl -> AgCl(s) + NaNO3(aq)
const reactantCards = reactantIonCards(level);
const slotIds = productSlotIds(level);
const { left: initialLeftCards, right: initialRightCards } = completeIonicCards(level);

const SLOT_LABELS: Record<string, string> = {
  [slotIds[0] ?? ""]: "ช่องที่ 1 (ไอออนบวก คู่ที่ 1)",
  [slotIds[1] ?? ""]: "ช่องที่ 2 (ไอออนลบ คู่ที่ 1)",
  [slotIds[2] ?? ""]: "ช่องที่ 3 (ไอออนบวก คู่ที่ 2)",
  [slotIds[3] ?? ""]: "ช่องที่ 4 (ไอออนลบ คู่ที่ 2)",
};

export function InteractionHarness() {
  return (
    <AudioProvider enabled={true}>
      <AnnouncerProvider>
        <MotionProvider>
          <HarnessContent />
        </MotionProvider>
      </AnnouncerProvider>
    </AudioProvider>
  );
}

function HarnessContent() {
  const [state, dispatch] = useReducer(
    (s: GameState, e: GameEvent) => reduce(s, e, level),
    undefined,
    () => createInitialState(level),
  );

  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const { play } = useAudio();
  const { announce } = useAnnouncer();
  const motionEnabled = useMotionEnabled();

  const stripContainerRef = useRef<HTMLDivElement>(null);
  const cardRefsMap = useRef<Map<string, HTMLElement>>(new Map());

  const registerCardRef = (instanceId: string, el: HTMLElement | null) => {
    if (el) {
      cardRefsMap.current.set(instanceId, el);
    } else {
      cardRefsMap.current.delete(instanceId);
    }
  };

  const dispatchEvent = (event: GameEvent) => {
    setEventLogs((prev) => [
      `${new Date().toLocaleTimeString()} - [${event.type}] ${JSON.stringify(event)}`,
      ...prev.slice(0, 19),
    ]);
    dispatch(event);
  };

  // Setup placement hook for arrangeProductIons phase
  const placement = usePlacement({
    onIntent: (intent) => {
      const event = intentToEvent(intent);
      if (event) {
        dispatchEvent(event);
        play("place");
        if (intent.kind === "place") {
          const slotLabel = SLOT_LABELS[intent.slotId] ?? "ช่อง";
          announce(`วางไอออนลงใน ${slotLabel} แล้ว`);
        } else if (intent.kind === "remove") {
          announce(`นำไอออนออกจากช่องแล้ว`);
        } else if (intent.kind === "move") {
          announce(`ย้ายไอออนไปยังช่องใหม่แล้ว`);
        }
      }
    },
    disabled: state.phase !== "arrangeProductIons",
  });

  // Map assigned instance IDs
  const assignedInstanceMap = new Map<string, string>(); // slotId -> instanceId
  const assignedSlotsSet = new Set<string>(); // instanceId set
  for (const slot of state.slots) {
    if (slot.ionInstanceId) {
      assignedInstanceMap.set(slot.slotId, slot.ionInstanceId);
      assignedSlotsSet.add(slot.ionInstanceId);
    }
  }

  // Keyboard navigation for arrangement container
  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      placement.cancel();
      announce("ยกเลิกการเลือกแล้ว");
    }
  };

  // Spectator cancellation pairs
  const connectorPairs: ConnectorPair[] = state.canceledPairs.map((p) => ({
    leftInstanceId: p.leftInstanceId,
    rightInstanceId: p.rightInstanceId,
  }));

  const isCardStruck = (instanceId: string) => {
    return state.canceledPairs.some(
      (p) => p.leftInstanceId === instanceId || p.rightInstanceId === instanceId,
    );
  };

  // Convert cards for EquationStrip
  const leftStripCards: readonly EquationStripCard[] = initialLeftCards.map((card) => {
    const isRevealed = state.phase !== "arrangeProductIons";
    const view = equationCardView(card, { revealed: isRevealed });
    const struck = isCardStruck(card.instanceId);
    const selected = state.selection?.instanceId === card.instanceId;

    return {
      view,
      struck,
      selected,
      onSelect:
        state.phase === "cancelSpectatorIons"
          ? () => {
              dispatchEvent({ type: "SELECT_LEFT", instanceId: card.instanceId });
            }
          : undefined,
    };
  });

  const rightStripCards: readonly EquationStripCard[] = initialRightCards.map((card) => {
    const isRevealed = state.phase !== "arrangeProductIons";
    const view = equationCardView(card, { revealed: isRevealed });
    const struck = isCardStruck(card.instanceId);
    const selected = state.selection?.instanceId === card.instanceId;

    return {
      view,
      struck,
      selected,
      onSelect:
        state.phase === "cancelSpectatorIons"
          ? () => {
              dispatchEvent({ type: "SELECT_RIGHT", instanceId: card.instanceId });
            }
          : undefined,
    };
  });

  const pairLabels = state.canceledPairs.map((p, index) => {
    const cardLeft = initialLeftCards.find((c) => c.instanceId === p.leftInstanceId);
    const label = cardLeft ? cardLeft.term.kind === "ion" ? cardLeft.term.ionId : "ตะกอน" : "";
    return `คู่ที่ ${index + 1}: ${label}`;
  });

  return (
    <PageShell>
      <div className="flex flex-col gap-6" onKeyDown={handleContainerKeyDown}>
        {/* Header Controls */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">สนามซ้อม Interaction (/dev/interaction)</h1>
            <p className="text-sm text-navy/70">
              ทดสอบ 3 โหมด: Pointer Drag, แตะเลือกสองครั้ง, คีย์บอร์ด (Tab/Enter/Space/Escape)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy">
              สถานะ: {state.phase}
            </span>
            <Button
              variant="outline"
              className="px-3 py-1.5 text-sm"
              onClick={() => {
                dispatch({ type: "START_LEVEL", at: Date.now() });
                dispatch({ type: "SHOW_IONS" });
                dispatch({ type: "CONTINUE" });
              }}
            >
              รีเซ็ตสู่ขั้นวางไอออน
            </Button>
          </div>
        </header>

        {/* Phase 1: Intro / Dissociate Controls */}
        {state.phase === "levelIntro" && (
          <Panel title="ด่านที่ 1 · ซิลเวอร์ไนเตรต + โซเดียมคลอไรด์">
            <p className="mb-4 text-navy">กดปุ่มด้านล่างเพื่อเริ่มจำลองการเล่น</p>
            <Button
              onClick={() => {
                dispatchEvent({ type: "START_LEVEL", at: Date.now() });
              }}
            >
              เริ่มเล่นด่าน 1
            </Button>
          </Panel>
        )}

        {state.phase === "dissociateReactants" && (
          <Panel title="ขั้นที่ 1 · แตกตัวสารตั้งต้นเป็นไอออน">
            <p className="mb-4 text-navy">สารละลายอิเล็กโทรไลต์แตกตัวเป็นไอออนบวกและไอออนลบ</p>
            <div className="flex gap-3">
              <Button onClick={() => dispatchEvent({ type: "SHOW_IONS" })}>แสดงไอออน</Button>
              <Button onClick={() => dispatchEvent({ type: "CONTINUE" })}>
                ไปยังขั้นจัดเรียงไอออน
              </Button>
            </div>
          </Panel>
        )}

        {/* Phase 2: Arrange Product Ions */}
        {state.phase === "arrangeProductIons" && (
          <div className="flex flex-col gap-6">
            {/* Reactant Tray */}
            <Panel title="ถาดไอออนสารตั้งต้น (ลาก หรือ แตะเพื่อเลือก)">
              <div
                {...placement.targetPropsFor({ kind: "tray" })}
                className="flex flex-wrap gap-4 rounded-card border border-dashed border-border p-4 bg-canvas min-h-20 items-center"
              >
                {reactantCards.map((card) => {
                  const isAssigned = assignedSlotsSet.has(card.instanceId);
                  const isHeld = placement.isHeld({ kind: "card", instanceId: card.instanceId });
                  const cardView = ionCardView(card);
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
                      view={cardView}
                      selected={isHeld}
                      isDragging={
                        placement.dragging?.source.kind === "card" &&
                        placement.dragging.source.instanceId === card.instanceId
                      }
                      onSelect={() => {
                        placement.toggleHold({ kind: "card", instanceId: card.instanceId });
                        announce(
                          isHeld
                            ? `ยกเลิกการเลือก ${cardView.ariaLabel}`
                            : `เลือก ${cardView.ariaLabel} แล้ว กด Enter ที่ช่องปลายทางเพื่อวาง`,
                        );
                      }}
                      onPointerDown={dragHandlers.onPointerDown}
                    />
                  );
                })}
              </div>
            </Panel>

            {/* Product Slots */}
            <Panel title="ช่องผลิตภัณฑ์ (4 ช่อง: แลกคู่ไอออนบวก-ลบ)">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Pair 1 */}
                <div className="rounded-card border border-border p-4 bg-canvas flex flex-col items-center gap-3">
                  <span className="text-sm font-bold text-navy">ผลิตภัณฑ์คู่ที่ 1</span>
                  <div className="flex items-center gap-3">
                    {slotIds.slice(0, 2).map((slotId, index) => {
                      const assignedInstanceId = assignedInstanceMap.get(slotId);
                      const assignedCard = assignedInstanceId
                        ? reactantCards.find((c) => c.instanceId === assignedInstanceId)
                        : null;
                      const assignedView = assignedCard ? ionCardView(assignedCard) : null;
                      const isTarget = placement.activeTargetId === slotId;
                      const isHeld =
                        assignedInstanceId != null &&
                        placement.isHeld({
                          kind: "slot",
                          slotId,
                          instanceId: assignedInstanceId,
                        });
                      const dragHandlers = assignedInstanceId
                        ? placement.dragHandlersFor({
                            kind: "slot",
                            slotId,
                            instanceId: assignedInstanceId,
                          })
                        : undefined;

                      return (
                        <IonSlot
                          key={slotId}
                          slotId={slotId}
                          slotLabelTh={SLOT_LABELS[slotId] ?? `ช่องที่ ${index + 1}`}
                          assignedIon={assignedView}
                          isDropTarget={isTarget}
                          selected={isHeld}
                          onActivate={() => {
                            placement.activateTarget({ kind: "slot", slotId });
                          }}
                          onSelect={
                            assignedInstanceId
                              ? () => {
                                  placement.toggleHold({
                                    kind: "slot",
                                    slotId,
                                    instanceId: assignedInstanceId,
                                  });
                                }
                              : undefined
                          }
                          onRemove={
                            assignedInstanceId
                              ? () => {
                                  dispatchEvent({ type: "REMOVE_ION", slotId });
                                  announce(`นำไอออนออกจากช่องแล้ว`);
                                }
                              : undefined
                          }
                          onPointerDown={dragHandlers?.onPointerDown}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Pair 2 */}
                <div className="rounded-card border border-border p-4 bg-canvas flex flex-col items-center gap-3">
                  <span className="text-sm font-bold text-navy">ผลิตภัณฑ์คู่ที่ 2</span>
                  <div className="flex items-center gap-3">
                    {slotIds.slice(2, 4).map((slotId, index) => {
                      const assignedInstanceId = assignedInstanceMap.get(slotId);
                      const assignedCard = assignedInstanceId
                        ? reactantCards.find((c) => c.instanceId === assignedInstanceId)
                        : null;
                      const assignedView = assignedCard ? ionCardView(assignedCard) : null;
                      const isTarget = placement.activeTargetId === slotId;
                      const isHeld =
                        assignedInstanceId != null &&
                        placement.isHeld({
                          kind: "slot",
                          slotId,
                          instanceId: assignedInstanceId,
                        });
                      const dragHandlers = assignedInstanceId
                        ? placement.dragHandlersFor({
                            kind: "slot",
                            slotId,
                            instanceId: assignedInstanceId,
                          })
                        : undefined;

                      return (
                        <IonSlot
                          key={slotId}
                          slotId={slotId}
                          slotLabelTh={SLOT_LABELS[slotId] ?? `ช่องที่ ${index + 3}`}
                          assignedIon={assignedView}
                          isDropTarget={isTarget}
                          selected={isHeld}
                          onActivate={() => {
                            placement.activateTarget({ kind: "slot", slotId });
                          }}
                          onSelect={
                            assignedInstanceId
                              ? () => {
                                  placement.toggleHold({
                                    kind: "slot",
                                    slotId,
                                    instanceId: assignedInstanceId,
                                  });
                                }
                              : undefined
                          }
                          onRemove={
                            assignedInstanceId
                              ? () => {
                                  dispatchEvent({ type: "REMOVE_ION", slotId });
                                  announce(`นำไอออนออกจากช่องแล้ว`);
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

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  className="px-3 py-1.5 text-sm"
                  onClick={() => {
                    for (const slotId of slotIds) {
                      dispatchEvent({ type: "REMOVE_ION", slotId });
                    }
                  }}
                >
                  ล้างทุกช่อง
                </Button>
                <Button
                  disabled={!canCheckArrangement(state)}
                  onClick={() => {
                    dispatchEvent({ type: "CHECK" });
                    play("correct");
                  }}
                >
                  ตรวจการจัดเรียงไอออน
                </Button>
              </div>
            </Panel>

            {/* Drag Ghost Layer */}
            <DragLayer
              dragging={placement.dragging}
              renderGhost={(source) => {
                const card = reactantCards.find((c) => c.instanceId === source.instanceId);
                if (!card) return null;
                return <IonCard view={ionCardView(card)} />;
              }}
            />
          </div>
        )}

        {/* Phase 3 & 4: Validate Products */}
        {(state.phase === "validateProducts" || state.phase === "balanceEquation") && (
          <Panel title="ขั้นที่ 3 · ตรวจสอบสถานะการตกตะกอน (Validation & Gold Tone)">
            <p className="mb-4 text-navy">
              AgCl เป็นสารไม่ละลายน้ำตามกฎการละลาย จึงเปลี่ยนเป็นการ์ดทอง (Gold Tone)
            </p>
            <Button
              onClick={() => {
                dispatchEvent({ type: "CONFIRM_PRODUCTS" });
                play("gold");
              }}
            >
              ยืนยันและไปขั้นตัดไอออนตัวประกอบ
            </Button>
          </Panel>
        )}

        {/* Phase 5: Cancel Spectator Ions with SpectatorConnector */}
        {state.phase === "cancelSpectatorIons" && (
          <Panel title="ขั้นที่ 4 · ตัดไอออนตัวประกอบ (Spectator Ions Cancellation)">
            <p className="mb-4 text-sm text-navy/80">
              แตะไอออนฝั่งซ้ายและฝั่งขวาเพื่อตัดคู่ไอออนตัวประกอบ เส้น SVG จะเชื่อมโยงคู่ที่ถูกตัด
            </p>

            <div className="flex flex-col gap-4">
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
                    reducedMotion={!motionEnabled}
                  />
                }
              />

              <CutPairList pairLabelsTh={pairLabels} />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-sm"
                    disabled={state.canceledPairs.length === 0}
                    onClick={() => dispatchEvent({ type: "UNDO" })}
                  >
                    ย้อนคู่ล่าสุด (UNDO)
                  </Button>
                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-sm"
                    disabled={state.canceledPairs.length === 0}
                    onClick={() => dispatchEvent({ type: "RESET" })}
                  >
                    ล้างการตัดทั้งหมด (RESET)
                  </Button>
                </div>
                <Button
                  disabled={!canConfirmCancellation(state, level)}
                  onClick={() => {
                    dispatchEvent({ type: "CONFIRM" });
                    play("correct");
                  }}
                >
                  ยืนยันการตัดไอออน
                </Button>
              </div>
            </div>
          </Panel>
        )}

        {/* Phase 6: Net Ionic Result */}
        {state.phase === "netIonicResult" && (
          <Panel title="ขั้นที่ 5 · สมการไอออนิกสุทธิ (Net Ionic Equation)">
            <p className="mb-4 text-navy font-bold">
              Ag⁺(aq) + Cl⁻(aq) → AgCl(s)
            </p>
            <Button
              onClick={() => {
                dispatchEvent({ type: "COMPLETE_LEVEL", at: Date.now() });
                play("levelup");
              }}
            >
              ผ่านด่าน 1 สำเร็จ!
            </Button>
          </Panel>
        )}

        {state.phase === "levelComplete" && (
          <Panel title="ยินดีด้วย! คุณผ่านด่านที่ 1 แล้ว">
            <p className="mb-4 text-navy">จบการทดสอบ Interaction Flow สมบูรณ์</p>
            <Button
              onClick={() => {
                dispatchEvent({ type: "REPLAY", at: Date.now() });
              }}
            >
              เล่นใหม่อีกรอบ
            </Button>
          </Panel>
        )}

        {/* Feedback Messages */}
        {state.lastFeedback && (
          <FeedbackPanel feedback={state.lastFeedback} />
        )}

        {/* Event Logs for Developer Inspection */}
        <Panel title="บันทึก Event ของเกม (Game Event Log)">
          <div className="max-h-40 overflow-y-auto rounded bg-navy/5 p-2 font-mono text-xs text-navy">
            {eventLogs.length === 0 ? (
              <p className="text-navy/50">ยังไม่มี event ที่ถูกส่ง</p>
            ) : (
              eventLogs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
