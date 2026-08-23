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
import { EquationArrow } from "../../../../../components/game/EquationArrow";
import { ProblemBar } from "../../../../../components/game/ProblemBar";

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

  const slotRoles: Record<string, string> = useMemo(
    () => ({
      [slotIds[0] ?? ""]: "ไอออนบวก",
      [slotIds[1] ?? ""]: "ไอออนลบ",
      [slotIds[2] ?? ""]: "ไอออนบวก",
      [slotIds[3] ?? ""]: "ไอออนลบ",
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

  function renderTrayCard(card: (typeof allReactantCards)[number]) {
    const isAssigned = assignedSet.has(card.instanceId);
    const source = { kind: "card", instanceId: card.instanceId } as const;
    const isHeld = placement.isHeld(source);
    const view = ionCardView(card);

    if (isAssigned) {
      return (
        <span className="flex h-[calc(var(--card-size,5rem)*0.95)] w-[var(--card-size,5rem)] items-center justify-center rounded-card border border-dashed border-border px-1 text-center text-[calc(var(--card-size,5rem)*0.13)] leading-tight text-navy/40">
          (อยู่ในช่อง)
        </span>
      );
    }

    return (
      <IonCard
        view={view}
        size="fluid"
        selected={isHeld}
        isDragging={
          placement.dragging?.source.kind === "card" &&
          placement.dragging.source.instanceId === card.instanceId
        }
        onSelect={() => {
          placement.toggleHold(source);
          announce(
            isHeld
              ? `ยกเลิกการเลือก ${view.ariaLabel}`
              : `เลือก ${view.ariaLabel} แล้ว กดที่ช่องปลายทางเพื่อวาง`,
          );
        }}
        onPointerDown={
          isArranging ? placement.dragHandlersFor(source).onPointerDown : undefined
        }
      />
    );
  }

  function renderSlot(idx: number) {
    const slotId = slotIds[idx]!;
    const assignedCardId = assignedMap.get(slotId) ?? null;
    const assignedCard = assignedCardId ? cardMap.get(assignedCardId) : null;
    const cardView = assignedCard ? ionCardView(assignedCard) : null;
    const source = assignedCardId
      ? ({ kind: "slot", slotId, instanceId: assignedCardId } as const)
      : null;

    return (
      <IonSlot
        slotId={slotId}
        slotLabelTh={slotLabels[slotId] ?? `ช่องที่ ${idx + 1}`}
        roleHintTh={slotRoles[slotId]}
        assignedIon={cardView}
        size="fluid"
        isDropTarget={placement.activeTargetId === slotId}
        selected={source ? placement.isHeld(source) : false}
        onActivate={() => placement.activateTarget({ kind: "slot", slotId })}
        onSelect={source ? () => placement.toggleHold(source) : undefined}
        onRemove={
          assignedCardId
            ? () => {
                dispatch({ type: "REMOVE_ION", slotId });
                announce("นำไอออนออกจากช่องแล้ว");
              }
            : undefined
        }
        onPointerDown={source ? placement.dragHandlersFor(source).onPointerDown : undefined}
      />
    );
  }

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
            : "ขั้นที่ 2 · แลกเปลี่ยนคู่ไอออนสร้างผลิตภัณฑ์"}
        </h2>
        <p className="text-sm text-navy/70">
          {isBalancing
            ? "กรอกตัวเลขสัมประสิทธิ์หน้าสารตั้งต้นและผลิตภัณฑ์เพื่อดุลสมการให้สมบูรณ์"
            : "ลากหรือแตะเลือกไอออนบวกและไอออนลบเพื่อจับคู่ผลิตภัณฑ์ใหม่ (ไอออนบวกต้องอยู่หน้าไอออนลบ)"}
        </p>
      </div>

      {/* แถบโจทย์ค้างไว้ตลอดขั้นเล่น ตามเอกสาร UI หน้า 07 — ผู้เล่นต้องมองย้อน
          ได้ว่าโจทย์ให้สารอะไรมา โดยยังไม่เฉลยผลิตภัณฑ์ */}
      <ProblemBar
        reactants={[
          { formula: level.reactantA.formula, phaseTh: level.reactantA.phase },
          { formula: level.reactantB.formula, phaseTh: level.reactantB.phase },
        ]}
      />

      {/*
        แถวเดียวแนวนอน: ไอออนตั้งต้น 4 ใบ → ช่องผลิตภัณฑ์ 4 ช่อง ตามเอกสาร UI หน้า 07

        ต้องอยู่บรรทัดเดียวกันจริง ๆ เพราะนักเรียนที่ยังอ่านสมการไม่คล่องต้อง
        เห็นพร้อมกันว่าอะไรอยู่หน้าลูกศรและอะไรอยู่หลัง — และต้อง **กว้างพอดีจอ**
        ไม่ใช่เลื่อนดูทีละครึ่ง ซึ่งให้ผลเสียเดียวกับการตัดขึ้นบรรทัดใหม่

        วิธีที่ใช้คือให้ขนาดการ์ดมาจาก `--card-size` ที่คำนวณจากความกว้างของแถบ
        เอง (คลาส `fit-cards` / `fit-cards-track` ใน globals.css) การ์ด ช่องไฟ
        เครื่องหมายบวก และลูกศร จึงย่อ–ขยายพร้อมกันทั้งแถวเป็นสัดส่วนเดิม

        ต่ำกว่า 768px พับเป็นสองชั้น (ถาดบน–ช่องล่าง) พร้อมลูกศรชี้ลง เพราะมือถือ
        แนวตั้งใส่การ์ด 8 ใบในบรรทัดเดียวแล้วเล็กจนอ่านไม่ออก — จุดพับตรงกับ
        media query ของ RotatePrompt ที่ชวนให้หมุนเครื่องเป็นแนวนอนพอดี
      */}
      <div
        role="region"
        aria-label="แถวจับคู่ไอออนเป็นผลิตภัณฑ์"
        tabIndex={0}
        className="equation-scroll fit-cards w-full min-w-0 rounded-card border border-border bg-white p-3 shadow-card sm:p-4"
      >
        <div className="fit-cards-track flex flex-col items-center justify-center gap-3 md:flex-row md:items-start md:gap-[calc(var(--card-size,5rem)*0.25)]">
          {/* ฝั่งซ้าย — ถาดไอออนตั้งต้น */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-navy/70">ไอออนของสารตั้งต้น 4 ตัว</span>
            <div
              {...placement.targetPropsFor({ kind: "tray" })}
              className="flex items-center gap-[calc(var(--card-size,5rem)*0.12)] rounded-card border border-navy/10 bg-canvas p-[calc(var(--card-size,5rem)*0.12)]"
            >
              {allReactantCards.map((card, idx) => (
                <span
                  key={card.instanceId}
                  className="flex items-center gap-[calc(var(--card-size,5rem)*0.12)]"
                >
                  {idx > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-[calc(var(--card-size,5rem)*0.28)] font-bold leading-none text-navy/60"
                    >
                      +
                    </span>
                  )}
                  {renderTrayCard(card)}
                </span>
              ))}
            </div>
          </div>

          {/* ลูกศรกลางแถว — ชี้ขวาเมื่อเรียงแถวเดียว ชี้ลงเมื่อพับสองชั้น */}
          <div className="flex items-center justify-center px-1 md:min-h-[calc(var(--card-size,5rem)*1.6)]">
            <EquationArrow breakpoint="md" className="text-gold" />
          </div>

          {/* ฝั่งขวา — ช่องผลิตภัณฑ์ 4 ช่องเรียงต่อกัน */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-navy/70">ช่องไอออนสารผลิตภัณฑ์ 4 ช่อง</span>
            <div className="flex items-start gap-[calc(var(--card-size,5rem)*0.12)] rounded-card border border-border bg-panel p-[calc(var(--card-size,5rem)*0.12)]">
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={slotIds[idx]}
                  className="flex items-start gap-[calc(var(--card-size,5rem)*0.12)]"
                >
                  {idx > 0 && (
                    <span
                      aria-hidden="true"
                      className="mt-[calc(var(--card-size,5rem)*0.33)] text-[calc(var(--card-size,5rem)*0.28)] font-bold leading-none text-navy/60"
                    >
                      +
                    </span>
                  )}
                  {renderSlot(idx)}
                </span>
              ))}
            </div>
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
            <EquationArrow />
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
