"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../../components/layout/AppHeader";
import { PageShell } from "../../../components/layout/PageShell";
import { IonCard } from "../../../components/game/IonCard";
import { IonSlot } from "../../../components/game/IonSlot";
import { EquationArrow } from "../../../components/game/EquationArrow";
import { DragLayer } from "../../../components/interaction/DragLayer";
import { usePlacement } from "../../../components/interaction/usePlacement";
import type { PlacementSource } from "../../../components/interaction/types";
import { Button } from "../../../components/ui/Button";
import { MESSAGES } from "../../../config/messages";
import { getTutorialLevel } from "../../../presentation/tutorial";
import { ionCardView } from "../../../presentation/cards";
import { reactantIonCards } from "../../../domain/game/instances";
import { AtomBalanceTable } from "../../../components/game/AtomBalanceTable";
import type { AtomBalanceRow } from "../../../components/game/AtomBalanceTable";
import { CoefficientInput } from "../../../components/game/CoefficientInput";
import { EquationView } from "../../../components/game/EquationView";
import { CheckIcon, FlaskIcon } from "../../../components/ui/Icon";
import { renderIon } from "../../../domain/chemistry/formula";
import { getIon } from "../../../domain/chemistry/ions";

export default function HowToPlaySandboxPage() {
  const router = useRouter();
  const tutorialLevel = useMemo(() => getTutorialLevel(), []);
  const allCards = useMemo(() => reactantIonCards(tutorialLevel), [tutorialLevel]);

  const precipCat = useMemo(() => getIon(tutorialLevel.precipitate.cationId), [tutorialLevel]);
  const precipAni = useMemo(() => getIon(tutorialLevel.precipitate.anionId), [tutorialLevel]);
  const aqCat = useMemo(() => getIon(tutorialLevel.aqueousProduct.cationId), [tutorialLevel]);
  const aqAni = useMemo(() => getIon(tutorialLevel.aqueousProduct.anionId), [tutorialLevel]);

  const reactACat = useMemo(() => getIon(tutorialLevel.reactantA.cationId), [tutorialLevel]);
  const reactAAni = useMemo(() => getIon(tutorialLevel.reactantA.anionId), [tutorialLevel]);
  const reactBCat = useMemo(() => getIon(tutorialLevel.reactantB.cationId), [tutorialLevel]);
  const reactBAni = useMemo(() => getIon(tutorialLevel.reactantB.anionId), [tutorialLevel]);

  // Interactive Sandbox Slot State: slotId -> instanceId
  const [slotAssignments, setSlotAssignments] = useState<Record<string, string>>({});

  const cardMap = useMemo(
    () => new Map(allCards.map((c) => [c.instanceId, c])),
    [allCards],
  );

  const placement = usePlacement({
    onIntent: (intent) => {
      if (intent.kind === "place") {
        setSlotAssignments((prev) => {
          const next = { ...prev };
          for (const [s, c] of Object.entries(next)) {
            if (c === intent.instanceId) delete next[s];
          }
          next[intent.slotId] = intent.instanceId;
          return next;
        });
      } else if (intent.kind === "move") {
        setSlotAssignments((prev) => {
          const next = { ...prev };
          const cardId = next[intent.fromSlotId];
          delete next[intent.fromSlotId];
          if (cardId) next[intent.toSlotId] = cardId;
          return next;
        });
      } else if (intent.kind === "remove") {
        setSlotAssignments((prev) => {
          const next = { ...prev };
          delete next[intent.slotId];
          return next;
        });
      }
    },
  });

  const placedCardIds = new Set(Object.values(slotAssignments));
  const freeCards = allCards.filter((c) => !placedCardIds.has(c.instanceId));

  const isBox21Done =
    slotAssignments["tut-slot-0"] === "tut:cacl2:ca" &&
    slotAssignments["tut-slot-1"] === "tut:na2so4:so4" &&
    slotAssignments["tut-slot-2"] === "tut:na2so4:na" &&
    slotAssignments["tut-slot-3"] === "tut:cacl2:cl";

  const handleResetSandbox = () => {
    setSlotAssignments({});
  };

  const handleAutoFillSandbox = () => {
    setSlotAssignments({
      "tut-slot-0": "tut:cacl2:ca",
      "tut-slot-1": "tut:na2so4:so4",
      "tut-slot-2": "tut:na2so4:na",
      "tut-slot-3": "tut:cacl2:cl",
    });
  };

  // สัมประสิทธิ์จำลองสำหรับ 2.3 [CaCl2, Na2SO4, CaSO4, NaCl]
  const [sandboxCoeffs, setSandboxCoeffs] = useState<(number | null)[]>([1, 1, 1, 1]);

  const handleSandboxCoeffChange = (index: number, value: number | null) => {
    setSandboxCoeffs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const isSandboxBalanced =
    sandboxCoeffs[0] === 1 &&
    sandboxCoeffs[1] === 1 &&
    sandboxCoeffs[2] === 1 &&
    sandboxCoeffs[3] === 2;

  const sandboxAtomRows: AtomBalanceRow[] = useMemo(() => {
    const coeffA = sandboxCoeffs[0];
    const coeffB = sandboxCoeffs[1];
    const coeffC = sandboxCoeffs[2];
    const coeffD = sandboxCoeffs[3];

    return [
      {
        key: reactACat.ionId,
        formula: renderIon(reactACat, 1),
        leftCount: coeffA != null ? coeffA * tutorialLevel.reactantA.cationCount : null,
        rightCount: coeffC != null ? coeffC * tutorialLevel.precipitate.cationCount : null,
      },
      {
        key: reactAAni.ionId,
        formula: renderIon(reactAAni, 1),
        leftCount: coeffA != null ? coeffA * tutorialLevel.reactantA.anionCount : null,
        rightCount: coeffD != null ? coeffD * tutorialLevel.aqueousProduct.anionCount : null,
      },
      {
        key: reactBCat.ionId,
        formula: renderIon(reactBCat, 1),
        leftCount: coeffB != null ? coeffB * tutorialLevel.reactantB.cationCount : null,
        rightCount: coeffD != null ? coeffD * tutorialLevel.aqueousProduct.cationCount : null,
      },
      {
        key: reactBAni.ionId,
        formula: renderIon(reactBAni, 1),
        leftCount: coeffB != null ? coeffB * tutorialLevel.reactantB.anionCount : null,
        rightCount: coeffC != null ? coeffC * tutorialLevel.precipitate.anionCount : null,
      },
    ];
  }, [
    sandboxCoeffs,
    tutorialLevel,
    reactACat,
    reactAAni,
    reactBCat,
    reactBAni,
  ]);

  const renderSlot = (slotId: string, labelTh: string, roleHintTh: string) => {
    const cardId = slotAssignments[slotId];
    const card = cardId ? cardMap.get(cardId) : null;
    const assignedIon = card ? ionCardView(card) : null;
    const source: PlacementSource = cardId
      ? { kind: "slot", slotId, instanceId: cardId }
      : { kind: "card", instanceId: "" };
    const isHeld = cardId ? placement.isHeld(source) : false;
    const dragHandlers = cardId ? placement.dragHandlersFor(source) : { onPointerDown: () => {} };

    return (
      <IonSlot
        slotId={slotId}
        slotLabelTh={labelTh}
        roleHintTh={roleHintTh}
        assignedIon={assignedIon}
        isDropTarget={placement.activeTargetId === slotId}
        selected={isHeld}
        isDragging={
          cardId
            ? placement.dragging?.source.kind === "slot" &&
              placement.dragging.source.slotId === slotId
            : false
        }
        onActivate={() => placement.activateTarget({ kind: "slot", slotId })}
        onRemove={() => {
          setSlotAssignments((prev) => {
            const next = { ...prev };
            delete next[slotId];
            return next;
          });
        }}
        onSelect={cardId ? () => placement.toggleHold(source) : undefined}
        onPointerDown={cardId ? dragHandlers.onPointerDown : undefined}
      />
    );
  };

  return (
    <PageShell>
      <AppHeader
        onHome={() => router.push("/")}
        onLevels={() => router.push("/levels")}
        onHowToPlay={() => router.push("/how-to-play")}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 pb-32">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <Button
            variant="outline"
            onClick={() => router.push("/how-to-play")}
            className="flex items-center gap-1.5"
          >
            ← กลับไปหน้าวิธีเล่น
          </Button>
          <div className="flex items-center gap-2 text-sm font-bold text-navy">
            <FlaskIcon className="text-gold text-lg" />
            <span>กระดานทดลองเล่นจริง (Interactive Sandbox)</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
            ทดลองจัดเรียงไอออนและดุลสมการเคมี
          </h1>
          <p className="mt-1 text-sm text-navy/70">
            สารตั้งต้นตัวอย่าง: แคลเซียมคลอไรด์ (CaCl₂) + โซเดียมซัลเฟต (Na₂SO₄)
          </p>
        </div>

        {/* ── กล่อง 2.1: แลกเปลี่ยนคู่ไอออน ──────────────────────── */}
        <div className="w-full rounded-card border border-border bg-white p-4 sm:p-6 shadow-card text-left">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-navy/10 px-2.5 py-1 text-xs font-bold text-navy">
                2.1
              </span>
              <h2 className="text-base sm:text-lg font-bold text-navy">
                {MESSAGES.ui.box21Title}
              </h2>
            </div>
            {isBox21Done && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <CheckIcon className="text-xs" /> {MESSAGES.ui.box21Done}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* สมการสารตั้งต้น -> ช่องผลิตภัณฑ์ */}
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-navy/15 bg-canvas/60 p-4 md:flex-row">
              {/* สารตั้งต้นทั้งสองตัว */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-card border border-navy/15 bg-white px-3 py-2 text-sm sm:text-base font-bold text-navy shadow-2xs">
                  <EquationView ast={tutorialLevel.reactantA.formula} />
                  <span className="ml-1 text-xs font-normal text-navy/60">(aq)</span>
                </span>
                <span className="text-lg font-bold text-navy/40">+</span>
                <span className="rounded-card border border-navy/15 bg-white px-3 py-2 text-sm sm:text-base font-bold text-navy shadow-2xs">
                  <EquationView ast={tutorialLevel.reactantB.formula} />
                  <span className="ml-1 text-xs font-normal text-navy/60">(aq)</span>
                </span>
              </div>

              {/* ลูกศรชี้ไปผลิตภัณฑ์ */}
              <div className="flex items-center justify-center text-navy/40">
                <EquationArrow breakpoint="md" />
              </div>

              {/* ช่องวางไอออนผลิตภัณฑ์ 2 คู่ */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* คู่ที่ 1 (ตะกอน) */}
                <div className="flex items-center gap-2 rounded-xl border-2 border-gold/60 bg-gold-surface p-2 shadow-2xs">
                  {renderSlot("tut-slot-0", "ช่องที่ 1 (ไอออนบวก คู่ที่ 1)", "ไอออนบวก")}
                  {renderSlot("tut-slot-1", "ช่องที่ 2 (ไอออนลบ คู่ที่ 1)", "ไอออนลบ")}
                </div>

                <span className="text-lg font-bold text-navy/40">+</span>

                {/* คู่ที่ 2 (สารละลาย) */}
                <div className="flex items-center gap-2 rounded-xl border border-navy/20 bg-white/60 p-2 shadow-2xs">
                  {renderSlot("tut-slot-2", "ช่องที่ 3 (ไอออนบวก คู่ที่ 2)", "ไอออนบวก")}
                  {renderSlot("tut-slot-3", "ช่องที่ 4 (ไอออนลบ คู่ที่ 2)", "ไอออนลบ")}
                </div>
              </div>
            </div>

            {/* แหล่งการ์ดไอออนอิสระให้หยิบวาง */}
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-panel p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy">
                  การ์ดไอออนสารตั้งต้นที่แตกตัวแล้ว (ลากหรือแตะเพื่อนำไปวางในช่องด้านบน):
                </span>
                <span className="text-xs text-navy/60">
                  เหลือ {freeCards.length} / {allCards.length} ใบ
                </span>
              </div>
              <div className="flex min-h-[5.5rem] flex-wrap items-center justify-center gap-3 py-2">
                {freeCards.length === 0 ? (
                  <span className="text-xs text-navy/50 italic">
                    วางการ์ดครบทุกใบแล้ว (กดปุ่มถังขยะใต้ช่องเพื่อนำออก)
                  </span>
                ) : (
                  freeCards.map((c) => {
                    const source: PlacementSource = { kind: "card", instanceId: c.instanceId };
                    const isHeld = placement.isHeld(source);
                    const dragHandlers = placement.dragHandlersFor(source);

                    return (
                      <IonCard
                        key={c.instanceId}
                        view={ionCardView(c)}
                        selected={isHeld}
                        isDragging={
                          placement.dragging?.source.kind === "card" &&
                          placement.dragging.source.instanceId === c.instanceId
                        }
                        onSelect={() => placement.toggleHold(source)}
                        onPointerDown={dragHandlers.onPointerDown}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* ปุ่มควบคุม Sandbox 2.1 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button
                variant="outline"
                onClick={handleResetSandbox}
                disabled={Object.keys(slotAssignments).length === 0}
                className="text-xs py-1.5 px-3"
              >
                {MESSAGES.ui.clearAllSlots}
              </Button>
              <Button
                variant="gold"
                onClick={handleAutoFillSandbox}
                className="text-xs py-1.5 px-3"
              >
                แสดงตัวอย่างการวางที่ถูกต้อง
              </Button>
            </div>
          </div>
        </div>

        {/* ── กล่อง 2.2: เขียนสูตรสารประกอบไอออนิก (คูณไขว้) ────── */}
        <div className="w-full rounded-card border border-border bg-white p-4 sm:p-6 shadow-card text-left">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-navy/10 px-2.5 py-1 text-xs font-bold text-navy">
                2.2
              </span>
              <h2 className="text-base sm:text-lg font-bold text-navy">
                {MESSAGES.ui.box22Title}
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* ตะกอน CaSO4 */}
            <div className="flex flex-col gap-3 rounded-xl border border-gold/40 bg-gold-surface p-4 sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="rounded-md bg-gold-light px-2.5 py-1 text-xs font-bold text-navy self-start">
                  {MESSAGES.ui.crissCrossPrecipLabel}
                </span>
                <span className="text-sm font-semibold text-navy">
                  {tutorialLevel.precipitate.nameTh}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 sm:gap-6 py-2 md:flex-row">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="flex flex-col items-center">
                    <span className="rounded-full bg-blue/15 px-2 py-0.5 text-[11px] font-bold text-blue">
                      ประจุ +{precipCat.charge}
                    </span>
                    <div className="mt-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-lg sm:text-xl font-bold text-navy shadow-2xs">
                      <EquationView ast={renderIon(precipCat, 1)} />
                    </div>
                  </div>

                  <span className="text-lg font-bold text-navy/40">+</span>

                  <div className="flex flex-col items-center">
                    <span className="rounded-full bg-error/15 px-2 py-0.5 text-[11px] font-bold text-error">
                      ประจุ -{Math.abs(precipAni.charge)}
                    </span>
                    <div className="mt-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-lg sm:text-xl font-bold text-navy shadow-2xs">
                      <EquationView ast={renderIon(precipAni, 1)} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 text-center text-gold font-bold text-sm sm:text-base md:flex-col">
                  <span>คูณไขว้ประจุ</span>
                  <EquationArrow breakpoint="md" className="text-gold text-lg sm:text-xl" />
                </div>

                <div className="flex flex-col items-center">
                  <span className="rounded-full bg-gold-light px-2.5 py-0.5 text-[11px] font-bold text-navy">
                    สูตรตะกอน (s)
                  </span>
                  <div className="mt-1 rounded-lg border-2 border-gold bg-white px-4 py-2 text-lg sm:text-xl font-bold text-navy shadow-xs">
                    <EquationView ast={tutorialLevel.precipitate.formula} />
                    <span className="ml-1 text-xs font-semibold text-navy/60">(s)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/90 p-3 text-center text-xs sm:text-sm leading-relaxed text-navy/80 border border-navy/10">
                ประจุ <strong>+{precipCat.charge}</strong> ของ {precipCat.nameStemTh} ไขว้ไปเป็นตัวห้อย <strong>{tutorialLevel.precipitate.anionCount}</strong> ของ {precipAni.nameStemTh} และประจุ <strong>-{Math.abs(precipAni.charge)}</strong> ไขว้ไปเป็นตัวห้อย <strong>{tutorialLevel.precipitate.cationCount}</strong> (ตัวห้อย 1 ละไว้ไม่เขียน)
              </div>
            </div>

            {/* สารละลาย NaCl */}
            <div className="flex flex-col gap-3 rounded-xl border border-navy/15 bg-canvas/60 p-4 sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="rounded-md bg-blue/15 px-2.5 py-1 text-xs font-bold text-navy self-start">
                  {MESSAGES.ui.crissCrossAqLabel}
                </span>
                <span className="text-sm font-semibold text-navy">
                  {tutorialLevel.aqueousProduct.nameTh}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 sm:gap-6 py-2 md:flex-row">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="flex flex-col items-center">
                    <span className="rounded-full bg-blue/15 px-2 py-0.5 text-[11px] font-bold text-blue">
                      ประจุ +{aqCat.charge}
                    </span>
                    <div className="mt-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-lg sm:text-xl font-bold text-navy shadow-2xs">
                      <EquationView ast={renderIon(aqCat, 1)} />
                    </div>
                  </div>

                  <span className="text-lg font-bold text-navy/40">+</span>

                  <div className="flex flex-col items-center">
                    <span className="rounded-full bg-error/15 px-2 py-0.5 text-[11px] font-bold text-error">
                      ประจุ -{Math.abs(aqAni.charge)}
                    </span>
                    <div className="mt-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-lg sm:text-xl font-bold text-navy shadow-2xs">
                      <EquationView ast={renderIon(aqAni, 1)} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 text-center text-blue font-bold text-sm sm:text-base md:flex-col">
                  <span>คูณไขว้ประจุ</span>
                  <EquationArrow breakpoint="md" className="text-blue text-lg sm:text-xl" />
                </div>

                <div className="flex flex-col items-center">
                  <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-bold text-navy">
                    สูตรสารละลาย (aq)
                  </span>
                  <div className="mt-1 rounded-lg border border-border bg-white px-4 py-2 text-lg sm:text-xl font-bold text-navy shadow-xs">
                    <EquationView ast={tutorialLevel.aqueousProduct.formula} />
                    <span className="ml-1 text-xs font-semibold text-navy/60">(aq)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/90 p-3 text-center text-xs sm:text-sm leading-relaxed text-navy/80 border border-navy/10">
                ประจุ <strong>+{aqCat.charge}</strong> ของ {aqCat.nameStemTh} ไขว้ไปเป็นตัวห้อย <strong>{tutorialLevel.aqueousProduct.anionCount}</strong> ของ {aqAni.nameStemTh} และประจุ <strong>-{Math.abs(aqAni.charge)}</strong> ไขว้ไปเป็นตัวห้อย <strong>{tutorialLevel.aqueousProduct.cationCount}</strong> (ตัวห้อย 1 ละไว้ไม่เขียน)
              </div>
            </div>
          </div>
        </div>

        {/* ── กล่อง 2.3: ดุลสมการเคมี ──────────────────────── */}
        <div className="w-full rounded-card border border-border bg-white p-4 sm:p-6 shadow-card text-left">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-navy/10 px-2.5 py-1 text-xs font-bold text-navy">
                2.3
              </span>
              <h2 className="text-base sm:text-lg font-bold text-navy">
                {MESSAGES.ui.box23Title} (ทดลองดุลสมการ)
              </h2>
            </div>
            {isSandboxBalanced && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <CheckIcon className="text-xs" /> ดุลสมการถูกต้องแล้ว
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-navy/70 mb-4">
            ทดลองปรับเปลี่ยนตัวเลขสัมประสิทธิ์เพื่อสังเกตจำนวนอะตอมทั้งสองข้างในตารางแบบเรียลไทม์
          </p>

          {/* สมการโมเลกุล 4 สารประกอบ */}
          <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 md:flex-row md:gap-3 text-base sm:text-lg font-bold text-navy p-3 sm:p-4 rounded-xl bg-canvas border border-border">
            {/* ฝั่งสารตั้งต้น */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-card border border-navy/15 bg-white px-2.5 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={sandboxCoeffs[0] ?? null}
                  compoundLabelTh={`${tutorialLevel.reactantA.nameTh} สารตั้งต้น`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleSandboxCoeffChange(0, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={tutorialLevel.reactantA.formula} />
                  <span className="text-xs font-semibold text-navy/60">({tutorialLevel.reactantA.phase})</span>
                </span>
              </div>

              <span className="text-navy/40 font-bold">+</span>

              <div className="inline-flex items-center gap-1.5 rounded-card border border-navy/15 bg-white px-2.5 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={sandboxCoeffs[1] ?? null}
                  compoundLabelTh={`${tutorialLevel.reactantB.nameTh} สารตั้งต้น`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleSandboxCoeffChange(1, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={tutorialLevel.reactantB.formula} />
                  <span className="text-xs font-semibold text-navy/60">({tutorialLevel.reactantB.phase})</span>
                </span>
              </div>
            </div>

            {/* ลูกศรชี้ */}
            <div className="text-navy/40">
              <EquationArrow breakpoint="md" />
            </div>

            {/* ฝั่งผลิตภัณฑ์ */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-card border-2 border-gold/50 bg-gold-surface px-2.5 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={sandboxCoeffs[2] ?? null}
                  compoundLabelTh={`${tutorialLevel.precipitate.nameTh} ตะกอน`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleSandboxCoeffChange(2, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={tutorialLevel.precipitate.formula} />
                  <span className="text-xs font-semibold text-navy/60">(s)</span>
                </span>
              </div>

              <span className="text-navy/40 font-bold">+</span>

              <div className="inline-flex items-center gap-1.5 rounded-card border border-navy/15 bg-white px-2.5 py-1.5 shadow-2xs">
                <CoefficientInput
                  value={sandboxCoeffs[3] ?? null}
                  compoundLabelTh={`${tutorialLevel.aqueousProduct.nameTh} สารละลาย`}
                  hideLabel
                  size="sm"
                  onChange={(val) => handleSandboxCoeffChange(3, val)}
                />
                <span className="inline-flex items-baseline gap-0.5">
                  <EquationView ast={tutorialLevel.aqueousProduct.formula} />
                  <span className="text-xs font-semibold text-navy/60">(aq)</span>
                </span>
              </div>
            </div>
          </div>

          {/* ตารางตรวจสอบการดุลอะตอม */}
          <div className="mt-4">
            <AtomBalanceTable rows={sandboxAtomRows} />
          </div>

          {/* ปุ่มควบคุม Sandbox 2.3 */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setSandboxCoeffs([1, 1, 1, 1])}
              className="text-xs py-1.5 px-3"
            >
              รีเซ็ตสัมประสิทธิ์ (เป็น 1)
            </Button>
            <Button
              variant="gold"
              onClick={() => setSandboxCoeffs([1, 1, 1, 2])}
              className="text-xs py-1.5 px-3"
            >
              แสดงเฉลยการดุลสมการ
            </Button>
          </div>
        </div>

        {/* Back button at bottom */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => router.push("/how-to-play")}
          >
            ← กลับไปหน้าคู่มือวิธีเล่น
          </Button>
        </div>
      </main>

      <DragLayer
        dragging={placement.dragging}
        renderGhost={(source) => {
          if (source.kind === "card") {
            const card = cardMap.get(source.instanceId);
            return card ? <IonCard view={ionCardView(card)} /> : null;
          }
          if (source.kind === "slot") {
            const cardId = slotAssignments[source.slotId];
            const card = cardId ? cardMap.get(cardId) : null;
            return card ? <IonCard view={ionCardView(card)} /> : null;
          }
          return null;
        }}
      />
    </PageShell>
  );
}
