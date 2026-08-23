"use client";

import { useMemo, useState } from "react";
import type { BuiltLevel } from "../../../../../data/buildLevel";
import type { GameEvent } from "../../../../../domain/game/events";
import { productSlotIds, reactantIonCards } from "../../../../../domain/game/instances";
import { canCheckArrangement } from "../../../../../domain/game/selectors";
import type { GameState } from "../../../../../domain/game/types";
import { CoefficientInput } from "../../../../../components/game/CoefficientInput";
import { IonCard } from "../../../../../components/game/IonCard";
import { IonSlot } from "../../../../../components/game/IonSlot";
import { DragLayer } from "../../../../../components/interaction/DragLayer";
import { intentToEvent } from "../../../../../components/interaction/intentToEvent";
import { useAnnouncer } from "../../../../../components/interaction/LiveAnnouncer";
import { usePlacement } from "../../../../../components/interaction/usePlacement";
import { Button } from "../../../../../components/ui/Button";
import { MESSAGES } from "../../../../../config/messages";
import { ionCardView } from "../../../../../presentation/cards";
import { EquationArrow } from "../../../../../components/game/EquationArrow";
import { EquationView } from "../../../../../components/game/EquationView";
import { ProblemBar } from "../../../../../components/game/ProblemBar";
import { getIon } from "../../../../../domain/chemistry/ions";
import { renderIon } from "../../../../../domain/chemistry/formula";

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

  // สัมประสิทธิ์หน้าทุกไอออนและสารในสมการไอออนิกครบ 7 ตัว
  const [ionicCoeffs, setIonicCoeffs] = useState<(number | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

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



  const expectedCoeffs = useMemo(() => {
    const { a, b } = level.coefficients;
    const precipCoeff =
      level.productA.phase === "s"
        ? level.coefficients.c
        : level.coefficients.d;
    const aqCoeff =
      level.productA.phase === "s"
        ? level.coefficients.d
        : level.coefficients.c;
    return [
      a * level.reactantA.cationCount,
      a * level.reactantA.anionCount,
      b * level.reactantB.cationCount,
      b * level.reactantB.anionCount,
      precipCoeff,
      aqCoeff * level.aqueousProduct.cationCount,
      aqCoeff * level.aqueousProduct.anionCount,
    ];
  }, [level]);

  function handleIonicCoeffChange(index: number, value: number | null) {
    setIonicCoeffs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const isIonicBalanceComplete = ionicCoeffs.every((c) => c !== null);

  function handleCheckIonicBalance() {
    const isAllCorrect = ionicCoeffs.every(
      (val, idx) => val === expectedCoeffs[idx],
    );
    if (isAllCorrect) {
      dispatch({
        type: "SET_COEFFICIENT",
        index: 0,
        value: level.coefficients.a,
      });
      dispatch({
        type: "SET_COEFFICIENT",
        index: 1,
        value: level.coefficients.b,
      });
      dispatch({
        type: "SET_COEFFICIENT",
        index: 2,
        value: level.coefficients.c,
      });
      dispatch({
        type: "SET_COEFFICIENT",
        index: 3,
        value: level.coefficients.d,
      });
      dispatch({ type: "CHECK_BALANCE" });
    } else {
      // Set invalid values to trigger E-BALANCE error feedback
      dispatch({ type: "SET_COEFFICIENT", index: 0, value: 9 });
      dispatch({ type: "SET_COEFFICIENT", index: 1, value: 9 });
      dispatch({ type: "SET_COEFFICIENT", index: 2, value: 9 });
      dispatch({ type: "SET_COEFFICIENT", index: 3, value: 9 });
      dispatch({ type: "CHECK_BALANCE" });
    }
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
            ? "ขั้นที่ 2 · ดุลสัมประสิทธิ์ของสมการไอออนิก"
            : "ขั้นที่ 2 · แลกเปลี่ยนคู่ไอออนสร้างผลิตภัณฑ์"}
        </h2>
        <p className="text-sm text-navy/70">
          {isBalancing
            ? "กรอกตัวเลขสัมประสิทธิ์ข้างหน้าแต่ละไอออนและสารผลิตภัณฑ์ (สมมุติสารแต่ละตัวเป็น 1 โมล) เพื่อดุลสมการให้เท่ากันทั้งสองด้าน"
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

          {/* ฝั่งขวา — ช่องผลิตภัณฑ์แบ่งเป็น 2 ช่องย่อย: ผลิตภัณฑ์ที่เป็นตะกอน + ไอออนที่ยังคงอยู่ในสารละลาย */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-start gap-[calc(var(--card-size,5rem)*0.15)]">
              {/* ช่องย่อยที่ 1: ผลิตภัณฑ์ที่เป็นตะกอน */}
              <div className="flex flex-col items-center gap-1 rounded-card border border-gold/60 bg-gold/10 p-[calc(var(--card-size,5rem)*0.12)] shadow-xs">
                <span className="text-[calc(var(--card-size,5rem)*0.14)] font-bold text-navy">
                  ผลิตภัณฑ์ที่เป็นตะกอน
                </span>
                <div className="flex items-start gap-[calc(var(--card-size,5rem)*0.12)]">
                  {renderSlot(0)}
                  <span
                    aria-hidden="true"
                    className="mt-[calc(var(--card-size,5rem)*0.33)] text-[calc(var(--card-size,5rem)*0.28)] font-bold leading-none text-navy/60"
                  >
                    +
                  </span>
                  {renderSlot(1)}
                </div>
              </div>

              {/* เครื่องหมาย + คั่นระหว่าง 2 กลุ่มผลิตภัณฑ์ */}
              <span
                aria-hidden="true"
                className="mt-[calc(var(--card-size,5rem)*0.55)] text-[calc(var(--card-size,5rem)*0.32)] font-bold leading-none text-navy/60"
              >
                +
              </span>

              {/* ช่องย่อยที่ 2: ไอออนที่ยังคงอยู่ในสารละลาย */}
              <div className="flex flex-col items-center gap-1 rounded-card border border-border bg-panel p-[calc(var(--card-size,5rem)*0.12)] shadow-xs">
                <span className="text-[calc(var(--card-size,5rem)*0.14)] font-bold text-navy/80">
                  ไอออนที่ยังคงอยู่ในสารละลาย
                </span>
                <div className="flex items-start gap-[calc(var(--card-size,5rem)*0.12)]">
                  {renderSlot(2)}
                  <span
                    aria-hidden="true"
                    className="mt-[calc(var(--card-size,5rem)*0.33)] text-[calc(var(--card-size,5rem)*0.28)] font-bold leading-none text-navy/60"
                  >
                    +
                  </span>
                  {renderSlot(3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coefficient Balancing Inputs (When in balanceEquation phase) */}
      {isBalancing && (
        <div className="w-full max-w-5xl rounded-card border border-border bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-3 text-base sm:text-lg font-bold text-navy">
            {/* ฝั่งสารตั้งต้น: 4 ไอออน */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {/* Cation A */}
              <div className="inline-flex items-center gap-1 rounded-card border border-navy/15 bg-canvas px-2 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={ionicCoeffs[0] ?? null}
                  compoundLabelTh={`${level.reactantA.cationId} สารตั้งต้น`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleIonicCoeffChange(0, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={renderIon(getIon(level.reactantA.cationId), 1)} />
                  <span className="text-xs font-semibold text-navy/60">(aq)</span>
                </span>
              </div>

              <span className="text-navy/40 font-bold text-base sm:text-lg">+</span>

              {/* Anion A */}
              <div className="inline-flex items-center gap-1 rounded-card border border-navy/15 bg-canvas px-2 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={ionicCoeffs[1] ?? null}
                  compoundLabelTh={`${level.reactantA.anionId} สารตั้งต้น`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleIonicCoeffChange(1, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={renderIon(getIon(level.reactantA.anionId), 1)} />
                  <span className="text-xs font-semibold text-navy/60">(aq)</span>
                </span>
              </div>

              <span className="text-navy/40 font-bold text-base sm:text-lg">+</span>

              {/* Cation B */}
              <div className="inline-flex items-center gap-1 rounded-card border border-navy/15 bg-canvas px-2 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={ionicCoeffs[2] ?? null}
                  compoundLabelTh={`${level.reactantB.cationId} สารตั้งต้น`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleIonicCoeffChange(2, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={renderIon(getIon(level.reactantB.cationId), 1)} />
                  <span className="text-xs font-semibold text-navy/60">(aq)</span>
                </span>
              </div>

              <span className="text-navy/40 font-bold text-base sm:text-lg">+</span>

              {/* Anion B */}
              <div className="inline-flex items-center gap-1 rounded-card border border-navy/15 bg-canvas px-2 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={ionicCoeffs[3] ?? null}
                  compoundLabelTh={`${level.reactantB.anionId} สารตั้งต้น`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleIonicCoeffChange(3, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={renderIon(getIon(level.reactantB.anionId), 1)} />
                  <span className="text-xs font-semibold text-navy/60">(aq)</span>
                </span>
              </div>
            </div>

            {/* ลูกศรคั่น: แนวนอนชี้ขวา (md+) / แนวตั้งชี้ลง (< md) */}
            <div className="flex items-center justify-center px-1">
              <EquationArrow breakpoint="md" className="text-gold text-lg sm:text-xl" />
            </div>

            {/* ฝั่งสารผลิตภัณฑ์: 1 ตะกอน + 2 ไอออนในสารละลาย */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {/* Precipitate */}
              <div className="inline-flex items-center gap-1 rounded-card border border-gold/50 bg-gold/10 px-2 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={ionicCoeffs[4] ?? null}
                  compoundLabelTh={`${level.precipitate.nameTh} ตะกอน`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleIonicCoeffChange(4, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={level.precipitate.formula} />
                  <span className="text-xs font-semibold text-navy/70">(s)</span>
                </span>
              </div>

              <span className="text-navy/40 font-bold text-base sm:text-lg">+</span>

              {/* Aqueous Cation */}
              <div className="inline-flex items-center gap-1 rounded-card border border-navy/15 bg-canvas px-2 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={ionicCoeffs[5] ?? null}
                  compoundLabelTh={`${level.aqueousProduct.cationId} ผลิตภัณฑ์`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleIonicCoeffChange(5, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={renderIon(getIon(level.aqueousProduct.cationId), 1)} />
                  <span className="text-xs font-semibold text-navy/60">(aq)</span>
                </span>
              </div>

              <span className="text-navy/40 font-bold text-base sm:text-lg">+</span>

              {/* Aqueous Anion */}
              <div className="inline-flex items-center gap-1 rounded-card border border-navy/15 bg-canvas px-2 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={ionicCoeffs[6] ?? null}
                  compoundLabelTh={`${level.aqueousProduct.anionId} ผลิตภัณฑ์`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleIonicCoeffChange(6, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={renderIon(getIon(level.aqueousProduct.anionId), 1)} />
                  <span className="text-xs font-semibold text-navy/60">(aq)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Check Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: "PREV_STEP" })}
        >
          {isBalancing ? MESSAGES.ui.backToArrangement : MESSAGES.ui.backToStep1}
        </Button>

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
              {MESSAGES.ui.clearAllSlots}
            </Button>
            <Button
              variant="gold"
              disabled={!canCheckArrangement(state)}
              onClick={() => dispatch({ type: "CHECK" })}
            >
              {MESSAGES.ui.checkArrangement}
            </Button>
          </>
        )}

        {isBalancing && (
          <Button
            variant="gold"
            disabled={!isIonicBalanceComplete}
            onClick={handleCheckIonicBalance}
          >
            {MESSAGES.ui.checkBalance}
          </Button>
        )}
      </div>
    </div>
  );
}
