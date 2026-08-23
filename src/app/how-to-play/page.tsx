"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageShell } from "../../components/layout/PageShell";
import { IonCard } from "../../components/game/IonCard";
import { IonSlot } from "../../components/game/IonSlot";
import { DragLayer } from "../../components/interaction/DragLayer";
import { usePlacement } from "../../components/interaction/usePlacement";
import { Button } from "../../components/ui/Button";
import { SCORING } from "../../config/scoring";
import { MESSAGES } from "../../config/messages";
import { getTutorialLevel } from "../../presentation/tutorial";
import { ionCardView } from "../../presentation/cards";
import { reactantIonCards } from "../../domain/game/instances";

export default function HowToPlayPage() {
  const router = useRouter();
  const tutorialLevel = useMemo(() => getTutorialLevel(), []);
  const allCards = useMemo(() => reactantIonCards(tutorialLevel), [tutorialLevel]);

  // Interactive Sandbox Slot State: slotId -> instanceId
  const [slotAssignments, setSlotAssignments] = useState<Record<string, string>>({});

  const slotIds = ["tut-slot-0", "tut-slot-1", "tut-slot-2", "tut-slot-3"];
  const slotLabels = [
    "ช่องที่ 1 (ไอออนบวก คู่ที่ 1)",
    "ช่องที่ 2 (ไอออนลบ คู่ที่ 1)",
    "ช่องที่ 3 (ไอออนบวก คู่ที่ 2)",
    "ช่องที่ 4 (ไอออนลบ คู่ที่ 2)",
  ];

  const placement = usePlacement({
    onIntent: (intent) => {
      if (intent.kind === "place") {
        setSlotAssignments((prev) => ({
          ...prev,
          [intent.slotId]: intent.instanceId,
        }));
      } else if (intent.kind === "remove") {
        setSlotAssignments((prev) => {
          const next = { ...prev };
          delete next[intent.slotId];
          return next;
        });
      } else if (intent.kind === "move") {
        setSlotAssignments((prev) => {
          const next = { ...prev };
          const movedId = next[intent.fromSlotId];
          delete next[intent.fromSlotId];
          if (movedId) {
            next[intent.toSlotId] = movedId;
          }
          return next;
        });
      }
    },
  });

  const assignedSet = new Set(Object.values(slotAssignments));
  const cardMap = useMemo(() => {
    const map = new Map<string, (typeof allCards)[0]>();
    for (const c of allCards) {
      map.set(c.instanceId, c);
    }
    return map;
  }, [allCards]);

  const handleResetSandbox = () => {
    setSlotAssignments({});
    placement.cancel();
  };

  const handleAutoFillSandbox = () => {
    // Fill Ca2+ (0), SO4 2- (1), Na+ (2), Cl- (3)
    if (allCards.length >= 4) {
      setSlotAssignments({
        "tut-slot-0": allCards[0]!.instanceId, // Ca2+
        "tut-slot-1": allCards[3]!.instanceId, // SO4 2-
        "tut-slot-2": allCards[2]!.instanceId, // Na+
        "tut-slot-3": allCards[1]!.instanceId, // Cl-
      });
    }
  };

  return (
    <PageShell>
      <AppHeader
        onHome={() => router.push("/")}
        onHowToPlay={() => {}}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 pb-32">
        <div className="text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue/10 text-2xl font-bold text-blue"
          >
            📖
          </span>
          <h1 className="text-3xl font-bold text-navy">คู่มือวิธีการเล่นเกม Ion Clash</h1>
          <p className="mt-2 text-base text-navy/70">
            เรียนรู้ขั้นตอนการเล่น 5 ขั้นตอน รูปแบบการควบคุม และกติกาการให้คะแนน
          </p>
        </div>

        {/* Overview of 5 Steps */}
        <section className="rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-xl font-bold text-navy mb-4">5 ขั้นตอนสู่สมการไอออนิกสุทธิ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
            {MESSAGES.ui.steps.map((stepName, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-card bg-canvas p-3 border border-border"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-xs font-bold text-navy">{stepName}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3 Control Methods */}
        <section className="rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-xl font-bold text-navy mb-4">รูปแบบการควบคุม 3 วิธี (เลือกใช้ตามสะดวก)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-card bg-panel p-4 border border-border">
              <div className="flex items-center gap-2 font-bold text-navy mb-2">
                <span className="text-xl">🖱️</span>
                <h3>1. ลากและวาง (Drag & Drop)</h3>
              </div>
              <p className="text-xs text-navy/80 leading-relaxed">
                คลิก/แตะค้างที่การ์ดไอออน แล้วลากไปปล่อยลงในช่องผลิตภัณฑ์ที่ต้องการ รองรับทั้งเมาส์บนคอมพิวเตอร์และระบบสัมผัสบน iPad/แท็บเล็ต
              </p>
            </div>

            <div className="rounded-card bg-panel p-4 border border-border">
              <div className="flex items-center gap-2 font-bold text-navy mb-2">
                <span className="text-xl">👆</span>
                <h3>2. แตะสองครั้ง (Tap-to-Place)</h3>
              </div>
              <p className="text-xs text-navy/80 leading-relaxed">
                แตะที่การ์ดไอออน 1 ครั้ง (การ์ดจะขึ้นกรอบสีฟ้าเพื่อระบุว่าถูกเลือก) จากนั้นแตะที่ช่องว่างเพื่อนำการ์ดไปวาง สะดวกมากบนหน้าจอมือถือ
              </p>
            </div>

            <div className="rounded-card bg-panel p-4 border border-border">
              <div className="flex items-center gap-2 font-bold text-navy mb-2">
                <span className="text-xl">⌨️</span>
                <h3>3. คีย์บอร์ด (Keyboard)</h3>
              </div>
              <p className="text-xs text-navy/80 leading-relaxed">
                กด <strong>Tab</strong> เลื่อนโฟกัส, กด <strong>Enter</strong> หรือ <strong>Space</strong> เพื่อเลือก/วางการ์ด, และกด <strong>Escape</strong> เพื่อยกเลิกการเลือก
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Sandbox for Step 2 (Exchange & Place) */}
        <section className="rounded-card bg-white p-6 shadow-card border border-border">
          <div className="mb-4">
            <span className="inline-block px-2.5 py-1 rounded bg-blue/15 text-xs font-bold text-blue mb-1">
              ทดลองเล่นจริง
            </span>
            <h2 className="text-xl font-bold text-navy">
              ขั้นตอนที่ 2: แลกคู่ไอออนบวก–ลบสร้างผลิตภัณฑ์
            </h2>
            <p className="text-sm text-navy/70 mt-1">
              ลองทดสอบลากหรือแตะการ์ดไอออนจากถาดด้านบน มาวางจับคู่ในช่องผลิตภัณฑ์ด้านล่าง
              (กติกา: <strong>ไอออนบวกต้องอยู่หน้าไอออนลบ</strong> เสมอ)
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 rounded-card bg-panel p-6 border border-border">
            <DragLayer
              dragging={placement.dragging}
              renderGhost={(source) => {
                const card = allCards.find((c) => c.instanceId === source.instanceId);
                if (!card) return null;
                return <IonCard view={ionCardView(card)} />;
              }}
            />

            {/* Tray of source ions */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-navy/70">ถาดไอออนตั้งต้น (คลิกลากหรือแตะเลือก):</span>
              <div
                {...placement.targetPropsFor({ kind: "tray" })}
                className="flex flex-wrap items-center justify-center gap-3 rounded-card bg-white p-3 border border-border min-h-[90px] w-full max-w-lg"
              >
                {allCards.map((card) => {
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
                        (วางแล้ว)
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
                      }}
                      onPointerDown={dragHandlers.onPointerDown}
                    />
                  );
                })}
              </div>
            </div>

            <span className="text-base font-bold text-navy/40">↓ จับคู่เป็น 2 ผลิตภัณฑ์</span>

            {/* Product Slots */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* Pair 1 */}
              <div className="flex flex-col items-center gap-2 rounded-card bg-white p-3 shadow-card border border-border">
                <span className="text-xs font-bold text-navy">คู่ที่ 1 (บวก + ลบ)</span>
                <div className="flex items-center gap-2">
                  {[0, 1].map((idx) => {
                    const slotId = slotIds[idx]!;
                    const assignedCardId = slotAssignments[slotId] ?? null;
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
                        slotLabelTh={slotLabels[idx]!}
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
                                setSlotAssignments((prev) => {
                                  const next = { ...prev };
                                  delete next[slotId];
                                  return next;
                                });
                              }
                            : undefined
                        }
                        onPointerDown={dragHandlers?.onPointerDown}
                      />
                    );
                  })}
                </div>
              </div>

              <span className="text-xl font-bold text-navy">+</span>

              {/* Pair 2 */}
              <div className="flex flex-col items-center gap-2 rounded-card bg-white p-3 shadow-card border border-border">
                <span className="text-xs font-bold text-navy">คู่ที่ 2 (บวก + ลบ)</span>
                <div className="flex items-center gap-2">
                  {[2, 3].map((idx) => {
                    const slotId = slotIds[idx]!;
                    const assignedCardId = slotAssignments[slotId] ?? null;
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
                        slotLabelTh={slotLabels[idx]!}
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
                                setSlotAssignments((prev) => {
                                  const next = { ...prev };
                                  delete next[slotId];
                                  return next;
                                });
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

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleResetSandbox}>
                ล้างช่องวาง
              </Button>
              <Button variant="gold" onClick={handleAutoFillSandbox}>
                แสดงตัวอย่างการวางที่ถูกต้อง
              </Button>
            </div>
          </div>
        </section>

        {/* Card Colors Meaning */}
        <section className="rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-xl font-bold text-navy mb-4">ความหมายของแถบสีการ์ด 4 สี</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2 rounded-card bg-navy/5 p-4 text-center border border-navy/20">
              <span className="inline-block h-4 w-12 rounded-full bg-navy" />
              <span className="font-bold text-navy text-sm">สีกรมท่า (Navy)</span>
              <p className="text-xs text-navy/70">
                ใช้กับการ์ด<strong>สารตั้งต้น</strong>เริ่มต้นในสารละลาย
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-card bg-blue/5 p-4 text-center border border-blue/20">
              <span className="inline-block h-4 w-12 rounded-full bg-blue" />
              <span className="font-bold text-blue text-sm">สีน้ำเงิน (Blue)</span>
              <p className="text-xs text-navy/70">
                ใช้กับ<strong>ผลิตภัณฑ์ที่ละลายน้ำได้ (aq)</strong>
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-card bg-gold/15 p-4 text-center border border-gold/40">
              <span className="inline-block h-4 w-12 rounded-full bg-gold" />
              <span className="font-bold text-navy text-sm">สีทอง (Gold)</span>
              <p className="text-xs text-navy/70">
                ใช้กับ<strong>ตะกอนที่ไม่ละลายน้ำ (s)</strong> ที่ผ่านการตรวจแล้ว
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-card bg-green/10 p-4 text-center border border-green/30">
              <span className="inline-block h-4 w-12 rounded-full bg-green" />
              <span className="font-bold text-green text-sm">สีเขียว (Green)</span>
              <p className="text-xs text-navy/70">
                ใช้ระบุ<strong>สถานะถูกต้อง</strong> หรือสมการที่ตรวจผ่านแล้ว
              </p>
            </div>
          </div>
        </section>

        {/* Scoring and Stars (Derived directly from SCORING configuration) */}
        <section className="rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-xl font-bold text-navy mb-4">ระบบคะแนนและการคำนวณดาว</h2>
          <div className="space-y-4 text-sm text-navy/85 leading-relaxed">
            <p>
              ในแต่ละด่าน ผู้เล่นจะเริ่มต้นด้วยคะแนนเต็ม <strong>{SCORING.startScore} คะแนน</strong>:
            </p>

            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>ตรวจคำตอบผิด:</strong> หักครั้งละ {SCORING.penaltyPerWrong} คะแนน (หักสูงสุดไม่เกิน {SCORING.maxWrongPenalty} คะแนน)
              </li>
              <li>
                <strong>กดขอคำใบ้:</strong> หักครั้งละ {SCORING.penaltyPerHint} คะแนน (หักได้สูงสุด 3 ครั้ง หรือ {SCORING.maxHintPenalty} คะแนน)
              </li>
              <li>
                <strong>เกณฑ์ผ่านด่านขั้นต่ำ:</strong> ต้องได้คะแนนอย่างน้อย {SCORING.minPassScore} คะแนน
              </li>
            </ul>

            <div className="rounded-card bg-canvas p-4 border border-border">
              <h4 className="font-bold text-navy mb-2">เกณฑ์การได้รับดาว:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="rounded-card bg-white p-3 border border-border">
                  <span className="text-lg text-gold font-bold">★★★ 3 ดาว</span>
                  <p className="text-xs text-navy/70 mt-1">{SCORING.starThresholds.three} – {SCORING.startScore} คะแนน</p>
                </div>
                <div className="rounded-card bg-white p-3 border border-border">
                  <span className="text-lg text-gold font-bold">★★☆ 2 ดาว</span>
                  <p className="text-xs text-navy/70 mt-1">{SCORING.starThresholds.two} – {SCORING.starThresholds.three - 1} คะแนน</p>
                </div>
                <div className="rounded-card bg-white p-3 border border-border">
                  <span className="text-lg text-gold font-bold">★☆☆ 1 ดาว</span>
                  <p className="text-xs text-navy/70 mt-1">{SCORING.starThresholds.one} – {SCORING.starThresholds.two - 1} คะแนน</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Actions */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-white/95 px-4 py-3 backdrop-blur shadow-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link
            href="/knowledge"
            className="min-h-11 inline-flex items-center justify-center rounded-card border border-navy/20 px-6 py-2 text-sm font-bold text-navy hover:bg-canvas"
          >
            ← ศึกษาคลังความรู้
          </Link>
          <Link
            href="/levels"
            className="min-h-11 inline-flex items-center justify-center rounded-card bg-gold px-8 py-2 font-bold text-navy shadow-card hover:bg-gold/90"
          >
            ไปยังหน้าเลือกด่าน →
          </Link>
        </div>
      </footer>
    </PageShell>
  );
}
