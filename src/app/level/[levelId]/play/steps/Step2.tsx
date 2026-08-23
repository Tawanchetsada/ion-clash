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
import { CheckIcon } from "../../../../../components/ui/Icon";
import { MESSAGES } from "../../../../../config/messages";
import { ionCardView } from "../../../../../presentation/cards";
import { EquationArrow } from "../../../../../components/game/EquationArrow";
import { EquationView } from "../../../../../components/game/EquationView";
import { ProblemBar } from "../../../../../components/game/ProblemBar";
import { AtomBalanceTable } from "../../../../../components/game/AtomBalanceTable";
import type { AtomBalanceRow } from "../../../../../components/game/AtomBalanceTable";
import { getIon } from "../../../../../domain/chemistry/ions";
import { renderIon, renderCompoundFormula } from "../../../../../domain/chemistry/formula";

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

  // สัมประสิทธิ์หน้า 4 สารประกอบในสมการโมเลกุล [Reactant A, Reactant B, Precipitate, Aqueous]
  // เริ่มต้นเป็น 1 ทุกตัวเพื่อความสะดวกในการดุลสมการ
  const [molecularCoeffs, setMolecularCoeffs] = useState<(number | null)[]>([
    1,
    1,
    1,
    1,
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

  const isArranging = state.phase === "arrangeProductIons";

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
    disabled: !isArranging,
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

  // ── Sub-step เมื่ออยู่ใน phase balanceEquation ─────────────────
  // เริ่มที่ crissCross (2.2) ก่อน แล้วผู้เล่นกดถัดไปเป็น balancing (2.3)
  const [balanceSubStep, setBalanceSubStep] = useState<"crissCross" | "balancing">("crissCross");

  const isBalancing = state.phase === "balanceEquation" && balanceSubStep === "balancing";
  const isCrissCross = state.phase === "balanceEquation" && balanceSubStep === "crissCross";

  // ── Criss-Cross Data ─────────────────────────────────────────
  const crissCrossData = useMemo(() => {
    const precipitate = level.precipitate;
    const aqueous = level.aqueousProduct;
    const precipCation = getIon(precipitate.cationId);
    const precipAnion = getIon(precipitate.anionId);
    const aqCation = getIon(aqueous.cationId);
    const aqAnion = getIon(aqueous.anionId);

    return {
      precip: {
        cation: precipCation,
        anion: precipAnion,
        cationCount: precipitate.cationCount,
        anionCount: precipitate.anionCount,
        formula: precipitate.formula,
        nameTh: precipitate.nameTh,
      },
      aqueous: {
        cation: aqCation,
        anion: aqAnion,
        cationCount: aqueous.cationCount,
        anionCount: aqueous.anionCount,
        formula: renderCompoundFormula(aqCation, aqAnion, aqueous.cationCount, aqueous.anionCount),
        nameTh: aqueous.nameTh,
      },
    };
  }, [level]);

  // ── Atom Balance Table Rows (นับตามสัมประสิทธิ์ 4 สารประกอบ) ──
  const atomBalanceRows: AtomBalanceRow[] = useMemo(() => {
    const ions = [
      { id: level.reactantA.cationId, ion: getIon(level.reactantA.cationId) },
      { id: level.reactantA.anionId, ion: getIon(level.reactantA.anionId) },
      { id: level.reactantB.cationId, ion: getIon(level.reactantB.cationId) },
      { id: level.reactantB.anionId, ion: getIon(level.reactantB.anionId) },
    ];

    const seen = new Set<string>();
    const uniqueIons = ions.filter((i) => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });

    const coeffA = molecularCoeffs[0];
    const coeffB = molecularCoeffs[1];
    const coeffC = molecularCoeffs[2];
    const coeffD = molecularCoeffs[3];

    return uniqueIons.map((entry) => {
      const { id, ion } = entry;

      let leftCount: number | null = null;
      if (coeffA !== null || coeffB !== null) {
        leftCount = 0;
        if (level.reactantA.cationId === id) leftCount += (coeffA ?? 0) * level.reactantA.cationCount;
        if (level.reactantA.anionId === id) leftCount += (coeffA ?? 0) * level.reactantA.anionCount;
        if (level.reactantB.cationId === id) leftCount += (coeffB ?? 0) * level.reactantB.cationCount;
        if (level.reactantB.anionId === id) leftCount += (coeffB ?? 0) * level.reactantB.anionCount;
      }

      let rightCount: number | null = null;
      if (coeffC !== null || coeffD !== null) {
        rightCount = 0;
        // c corresponds to precipitate (level.precipitate)
        if (level.precipitate.cationId === id) rightCount += (coeffC ?? 0) * level.precipitate.cationCount;
        if (level.precipitate.anionId === id) rightCount += (coeffC ?? 0) * level.precipitate.anionCount;
        // d corresponds to aqueous product (level.aqueousProduct)
        if (level.aqueousProduct.cationId === id) rightCount += (coeffD ?? 0) * level.aqueousProduct.cationCount;
        if (level.aqueousProduct.anionId === id) rightCount += (coeffD ?? 0) * level.aqueousProduct.anionCount;
      }

      return {
        key: id,
        formula: renderIon(ion, 1),
        leftCount,
        rightCount,
      };
    });
  }, [molecularCoeffs, level]);

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
          if (!isArranging) return;
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
        isDropTarget={isArranging && placement.activeTargetId === slotId}
        selected={isArranging && source ? placement.isHeld(source) : false}
        onActivate={isArranging ? () => placement.activateTarget({ kind: "slot", slotId }) : undefined}
        onSelect={isArranging && source ? () => placement.toggleHold(source) : undefined}
        onRemove={
          isArranging && assignedCardId
            ? () => {
                dispatch({ type: "REMOVE_ION", slotId });
                announce("นำไอออนออกจากช่องแล้ว");
              }
            : undefined
        }
        onPointerDown={isArranging && source ? placement.dragHandlersFor(source).onPointerDown : undefined}
      />
    );
  }

  function handleMolecularCoeffChange(index: number, value: number | null) {
    setMolecularCoeffs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const isMolecularBalanceComplete = molecularCoeffs.every((c) => c !== null);

  function handleCheckMolecularBalance() {
    // Dispatch values to stateMachine (0: A, 1: B, 2: C, 3: D)
    for (let i = 0; i < 4; i++) {
      dispatch({
        type: "SET_COEFFICIENT",
        index: i,
        value: molecularCoeffs[i] ?? null,
      });
    }
    dispatch({ type: "CHECK_BALANCE" });
  }

  return (
    <div
      className="flex flex-col items-center gap-6 text-center w-full"
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
          ขั้นที่ 2 · แลกเปลี่ยนคู่ไอออนและดุลสมการเคมี
        </h2>
        <p className="text-sm text-navy/70">
          จับคู่ไอออนบวก-ลบใหม่ เขียนสูตรสารประกอบโดยการคูณไขว้ประจุ และดุลสมการเคมี
        </p>
      </div>

      {/* แถบโจทย์ค้างไว้ตลอดขั้นเล่น */}
      <ProblemBar
        reactants={[
          { formula: level.reactantA.formula, phaseTh: level.reactantA.phase },
          { formula: level.reactantB.formula, phaseTh: level.reactantB.phase },
        ]}
      />

      {/* ── กล่อง 2.1: แลกเปลี่ยนคู่ไอออนสร้างผลิตภัณฑ์ ──────────────────────── */}
      <div className="w-full max-w-4xl rounded-card border border-border bg-white p-4 shadow-card sm:p-6 text-left">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-navy/10 px-2.5 py-1 text-xs font-bold text-navy">
              2.1
            </span>
            <h3 className="text-base sm:text-lg font-bold text-navy">
              {MESSAGES.ui.box21Title}
            </h3>
          </div>
          {!isArranging && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
              <CheckIcon className="text-xs" /> {MESSAGES.ui.box21Done}
            </span>
          )}
        </div>

        <div
          role="region"
          aria-label="แถวจับคู่ไอออนเป็นผลิตภัณฑ์"
          tabIndex={0}
          className="equation-scroll fit-cards w-full min-w-0"
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

            {/* ลูกศรกลางแถว */}
            <div className="flex items-center justify-center px-1 md:min-h-[calc(var(--card-size,5rem)*1.6)]">
              <EquationArrow breakpoint="md" className="text-gold" />
            </div>

            {/* ฝั่งขวา — ช่องผลิตภัณฑ์ */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-start gap-[calc(var(--card-size,5rem)*0.15)]">
                {/* ช่องย่อยที่ 1: ผลิตภัณฑ์ที่เป็นตะกอน */}
                <div className="flex flex-col items-center gap-1 rounded-card border border-gold/60 bg-gold-surface p-[calc(var(--card-size,5rem)*0.12)] shadow-xs">
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

                {/* เครื่องหมาย + */}
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

        {/* ปุ่มควบคุมเฉพาะ 2.1 */}
        {isArranging && (
          <div className="flex flex-wrap justify-center gap-3 mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "PREV_STEP" })}
            >
              {MESSAGES.ui.backToStep1}
            </Button>
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
          </div>
        )}
      </div>

      {/* ── กล่อง 2.2: เขียนสูตรสารประกอบไอออนิก (คูณไขว้) ────────────────────── */}
      {!isArranging && (
        <div className="w-full max-w-4xl rounded-card border border-border bg-white p-4 shadow-card sm:p-6 text-left">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-gold/20 px-2.5 py-1 text-xs font-bold text-navy">
                2.2
              </span>
              <h3 className="text-base sm:text-lg font-bold text-navy">
                {MESSAGES.ui.box22Title}
              </h3>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* แถวที่ 1: ตะกอน */}
            <div className="flex flex-col gap-3 rounded-xl border border-gold/40 bg-gold-surface p-4 sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="rounded-md bg-gold-light px-2.5 py-1 text-xs font-bold text-navy self-start">
                  {MESSAGES.ui.crissCrossPrecipLabel}
                </span>
                <span className="text-sm font-semibold text-navy">
                  {crissCrossData.precip.nameTh}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 sm:gap-6 py-2 md:flex-row">
                {/* Cation + Anion Group */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {/* Cation */}
                  <div className="flex flex-col items-center">
                    <span className="rounded-full bg-blue/15 px-2 py-0.5 text-[11px] font-bold text-blue">
                      ประจุ +{crissCrossData.precip.cation.charge}
                    </span>
                    <div className="mt-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-lg sm:text-xl font-bold text-navy shadow-2xs">
                      <EquationView ast={renderIon(crissCrossData.precip.cation, 1)} />
                    </div>
                  </div>

                  <span className="text-lg font-bold text-navy/40">+</span>

                  {/* Anion */}
                  <div className="flex flex-col items-center">
                    <span className="rounded-full bg-error/15 px-2 py-0.5 text-[11px] font-bold text-error">
                      ประจุ -{Math.abs(crissCrossData.precip.anion.charge)}
                    </span>
                    <div className="mt-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-lg sm:text-xl font-bold text-navy shadow-2xs">
                      <EquationView ast={renderIon(crissCrossData.precip.anion, 1)} />
                    </div>
                  </div>
                </div>

                {/* Arrow / Transition */}
                <div className="flex items-center gap-1.5 px-2 text-center text-gold font-bold text-sm sm:text-base md:flex-col">
                  <span>คูณไขว้ประจุ</span>
                  <EquationArrow breakpoint="md" className="text-gold text-lg sm:text-xl" />
                </div>

                {/* Result Formula */}
                <div className="flex flex-col items-center">
                  <span className="rounded-full bg-gold-light px-2.5 py-0.5 text-[11px] font-bold text-navy">
                    สูตรตะกอน (s)
                  </span>
                  <div className="mt-1 rounded-lg border-2 border-gold bg-white px-4 py-2 text-lg sm:text-xl font-bold text-navy shadow-xs">
                    <EquationView ast={crissCrossData.precip.formula} />
                    <span className="ml-1 text-xs font-semibold text-navy/60">(s)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/90 p-3 text-center text-xs sm:text-sm leading-relaxed text-navy/80 border border-navy/10">
                ประจุ <strong>+{crissCrossData.precip.cation.charge}</strong> ของ {crissCrossData.precip.cation.nameStemTh} ไขว้ไปเป็นตัวห้อย <strong>{crissCrossData.precip.anionCount}</strong> ของ {crissCrossData.precip.anion.nameStemTh} และประจุ <strong>-{Math.abs(crissCrossData.precip.anion.charge)}</strong> ไขว้ไปเป็นตัวห้อย <strong>{crissCrossData.precip.cationCount}</strong>{crissCrossData.precip.cationCount === 1 && crissCrossData.precip.anionCount === 1 ? " (ตัวห้อย 1 ละไว้ไม่เขียน)" : ""}
              </div>
            </div>

            {/* แถวที่ 2: สารละลาย */}
            <div className="flex flex-col gap-3 rounded-xl border border-navy/15 bg-canvas/60 p-4 sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="rounded-md bg-blue/15 px-2.5 py-1 text-xs font-bold text-navy self-start">
                  {MESSAGES.ui.crissCrossAqLabel}
                </span>
                <span className="text-sm font-semibold text-navy">
                  {crissCrossData.aqueous.nameTh}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 sm:gap-6 py-2 md:flex-row">
                {/* Cation + Anion Group */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {/* Cation */}
                  <div className="flex flex-col items-center">
                    <span className="rounded-full bg-blue/15 px-2 py-0.5 text-[11px] font-bold text-blue">
                      ประจุ +{crissCrossData.aqueous.cation.charge}
                    </span>
                    <div className="mt-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-lg sm:text-xl font-bold text-navy shadow-2xs">
                      <EquationView ast={renderIon(crissCrossData.aqueous.cation, 1)} />
                    </div>
                  </div>

                  <span className="text-lg font-bold text-navy/40">+</span>

                  {/* Anion */}
                  <div className="flex flex-col items-center">
                    <span className="rounded-full bg-error/15 px-2 py-0.5 text-[11px] font-bold text-error">
                      ประจุ -{Math.abs(crissCrossData.aqueous.anion.charge)}
                    </span>
                    <div className="mt-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-lg sm:text-xl font-bold text-navy shadow-2xs">
                      <EquationView ast={renderIon(crissCrossData.aqueous.anion, 1)} />
                    </div>
                  </div>
                </div>

                {/* Arrow / Transition */}
                <div className="flex items-center gap-1.5 px-2 text-center text-blue font-bold text-sm sm:text-base md:flex-col">
                  <span>คูณไขว้ประจุ</span>
                  <EquationArrow breakpoint="md" className="text-blue text-lg sm:text-xl" />
                </div>

                {/* Result Formula */}
                <div className="flex flex-col items-center">
                  <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-bold text-navy">
                    สูตรสารละลาย (aq)
                  </span>
                  <div className="mt-1 rounded-lg border border-border bg-white px-4 py-2 text-lg sm:text-xl font-bold text-navy shadow-xs">
                    <EquationView ast={crissCrossData.aqueous.formula} />
                    <span className="ml-1 text-xs font-semibold text-navy/60">(aq)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/90 p-3 text-center text-xs sm:text-sm leading-relaxed text-navy/80 border border-navy/10">
                ประจุ <strong>+{crissCrossData.aqueous.cation.charge}</strong> ของ {crissCrossData.aqueous.cation.nameStemTh} ไขว้ไปเป็นตัวห้อย <strong>{crissCrossData.aqueous.anionCount}</strong> ของ {crissCrossData.aqueous.anion.nameStemTh} และประจุ <strong>-{Math.abs(crissCrossData.aqueous.anion.charge)}</strong> ไขว้ไปเป็นตัวห้อย <strong>{crissCrossData.aqueous.cationCount}</strong>{crissCrossData.aqueous.cationCount === 1 && crissCrossData.aqueous.anionCount === 1 ? " (ตัวห้อย 1 ละไว้ไม่เขียน)" : ""}
              </div>
            </div>
          </div>

          {/* ปุ่มควบคุมเมื่ออยู่ที่ 2.2 */}
          {isCrissCross && (
            <div className="flex flex-wrap justify-center gap-3 mt-6 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => dispatch({ type: "PREV_STEP" })}
              >
                {MESSAGES.ui.backToArrangement}
              </Button>
              <Button
                variant="gold"
                onClick={() => setBalanceSubStep("balancing")}
              >
                {MESSAGES.ui.goToBalance}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── กล่อง 2.3: ดุลสมการเคมี ────────────────────────────────────────── */}
      {isBalancing && (
        <div className="w-full max-w-4xl rounded-card border border-border bg-white p-4 shadow-card sm:p-6 text-left">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-navy/10 px-2.5 py-1 text-xs font-bold text-navy">
                2.3
              </span>
              <h3 className="text-base sm:text-lg font-bold text-navy">
                {MESSAGES.ui.box23Title}
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-navy/70 mb-4">
            เติมตัวเลขสัมประสิทธิ์ข้างหน้าสารแต่ละชนิดเพื่อดุลจำนวนอะตอมทั้งสองข้างให้เท่ากัน
          </p>

          {/* สมการโมเลกุล 4 สารประกอบ */}
          <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-3 text-base sm:text-lg font-bold text-navy p-3 sm:p-4 rounded-xl bg-canvas border border-border">
            {/* ฝั่งสารตั้งต้น: Reactant A + Reactant B */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Reactant A */}
              <div className="inline-flex items-center gap-1.5 rounded-card border border-navy/15 bg-white px-2.5 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={molecularCoeffs[0] ?? null}
                  compoundLabelTh={`${level.reactantA.nameTh} สารตั้งต้น`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleMolecularCoeffChange(0, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={level.reactantA.formula} />
                  <span className="text-xs font-semibold text-navy/60">({level.reactantA.phase})</span>
                </span>
              </div>

              <span className="text-navy/40 font-bold text-base sm:text-lg">+</span>

              {/* Reactant B */}
              <div className="inline-flex items-center gap-1.5 rounded-card border border-navy/15 bg-white px-2.5 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={molecularCoeffs[1] ?? null}
                  compoundLabelTh={`${level.reactantB.nameTh} สารตั้งต้น`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleMolecularCoeffChange(1, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={level.reactantB.formula} />
                  <span className="text-xs font-semibold text-navy/60">({level.reactantB.phase})</span>
                </span>
              </div>
            </div>

            {/* ลูกศรชี้ขวา */}
            <div className="flex items-center justify-center px-1">
              <EquationArrow breakpoint="md" className="text-gold text-lg sm:text-xl" />
            </div>

            {/* ฝั่งผลิตภัณฑ์: Precipitate + Aqueous Product */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Precipitate */}
              <div className="inline-flex items-center gap-1.5 rounded-card border-2 border-gold/60 bg-gold-surface px-2.5 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={molecularCoeffs[2] ?? null}
                  compoundLabelTh={`${level.precipitate.nameTh} ตะกอน`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleMolecularCoeffChange(2, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={level.precipitate.formula} />
                  <span className="text-xs font-semibold text-navy/70">(s)</span>
                </span>
              </div>

              <span className="text-navy/40 font-bold text-base sm:text-lg">+</span>

              {/* Aqueous Product */}
              <div className="inline-flex items-center gap-1.5 rounded-card border border-navy/15 bg-white px-2.5 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={molecularCoeffs[3] ?? null}
                  compoundLabelTh={`${level.aqueousProduct.nameTh} สารละลาย`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleMolecularCoeffChange(3, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={level.aqueousProduct.formula} />
                  <span className="text-xs font-semibold text-navy/60">(aq)</span>
                </span>
              </div>
            </div>
          </div>

          {/* ตารางนับจำนวนอะตอม/ไอออน */}
          <div className="mt-4 pt-4 border-t border-border">
            <AtomBalanceTable rows={atomBalanceRows} />
          </div>

          {/* ปุ่มควบคุมเฉพาะ 2.3 */}
          <div className="flex flex-wrap justify-center gap-3 mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setBalanceSubStep("crissCross")}
            >
              {MESSAGES.ui.backToCrissCross}
            </Button>
            <Button
              variant="gold"
              disabled={!isMolecularBalanceComplete}
              onClick={handleCheckMolecularBalance}
            >
              {MESSAGES.ui.checkBalance}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
