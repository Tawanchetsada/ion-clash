"use client";

import { useState } from "react";
import { AppHeader } from "../../../components/layout/AppHeader";
import { StepIndicator } from "../../../components/layout/StepIndicator";
import { CoefficientInput } from "../../../components/game/CoefficientInput";
import { CompoundCard } from "../../../components/game/CompoundCard";
import { CutPairList } from "../../../components/game/CutPairList";
import { EquationStrip } from "../../../components/game/EquationStrip";
import { EquationView } from "../../../components/game/EquationView";
import { FeedbackPanel } from "../../../components/game/FeedbackPanel";
import { HintButton } from "../../../components/game/HintButton";
import { IonCard } from "../../../components/game/IonCard";
import { IonSlot } from "../../../components/game/IonSlot";
import { SaveStatus } from "../../../components/game/SaveStatus";
import { LevelGrid } from "../../../components/levels/LevelGrid";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import { Panel } from "../../../components/ui/Panel";
import { Pill } from "../../../components/ui/Pill";
import { VisuallyHidden } from "../../../components/ui/VisuallyHidden";
import { getLevel } from "../../../data/levels";
import { completeIonicCards, reactantIonCards } from "../../../domain/game/instances";
import { compoundCardView, equationCardView, ionCardView } from "../../../presentation/cards";
import { levelGridView } from "../../../presentation/levels";
import { createDefaultSave } from "../../../storage/defaults";
import { recordLevelResult } from "../../../storage/progress";
import type { ProgressStep } from "../../../components/layout/StepIndicator";
import type { ReactNode } from "react";

const level1 = getLevel(1); // AgNO3(aq) + NaCl(aq) -> AgCl(s) + NaNO3(aq)
const level11 = getLevel(11); // มี subscript จริงให้ดู (BaSO4)

const reactantCards = reactantIonCards(level1).map((card) => ionCardView(card));
const { left: leftEquation, right: rightEquation } = completeIonicCards(level1);

function buildDemoSave() {
  let save = createDefaultSave({ now: () => new Date("2026-01-01T00:00:00Z") });
  save = recordLevelResult(
    save,
    { levelId: 1, score: 100, timeMs: 42_000 },
    () => new Date("2026-01-01T00:05:00Z"),
  );
  save = recordLevelResult(
    save,
    { levelId: 2, score: 65, timeMs: 90_000 },
    () => new Date("2026-01-01T00:10:00Z"),
  );
  return save;
}

const demoSave = buildDemoSave();
const demoLevelGrid = levelGridView(demoSave);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

const STEP_OPTIONS: (ProgressStep | null)[] = [null, 1, 2, 3, 4, 5];

export function ComponentGallery() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [slotFilled, setSlotFilled] = useState(false);
  const [coefficient, setCoefficient] = useState<number | null>(null);
  const [struckIds, setStruckIds] = useState<ReadonlySet<string>>(new Set());
  const [cutPairs, setCutPairs] = useState<readonly string[]>([]);

  function toggleStruck(instanceId: string): void {
    setStruckIds((prev) => {
      const next = new Set(prev);
      if (next.has(instanceId)) next.delete(instanceId);
      else next.add(instanceId);
      return next;
    });
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8 bg-canvas p-6">
      <header>
        <h1 className="text-2xl font-bold text-navy">คลัง Component — Phase 5</h1>
        <p className="text-navy/70">
          หน้านี้มีไว้ตรวจงานระหว่างพัฒนาเท่านั้น ปิดอัตโนมัติในโปรดักชัน
        </p>
      </header>

      <Section title="AppHeader">
        <div className="w-full overflow-hidden rounded-card">
          <AppHeader levelLabelTh="LEVEL 01/50" onHome={() => {}} onHowToPlay={() => {}} />
        </div>
      </Section>

      <Section title="StepIndicator — ทุกขั้นรวม null (นอกวงจรเล่น)">
        <div className="flex flex-col gap-3">
          {STEP_OPTIONS.map((step) => (
            <StepIndicator key={String(step)} current={step} />
          ))}
        </div>
      </Section>

      <Section title="Button">
        <Button variant="navy">navy</Button>
        <Button variant="gold">gold</Button>
        <Button variant="blue">blue</Button>
        <Button variant="green">green</Button>
        <Button variant="outline">outline</Button>
        <Button variant="navy" disabled>
          disabled
        </Button>
      </Section>

      <Section title="Pill">
        <Pill tone="navy">navy</Pill>
        <Pill tone="gold">3/50</Pill>
        <Pill tone="blue">blue</Pill>
        <Pill tone="green">green</Pill>
        <Pill tone="neutral">neutral</Pill>
      </Section>

      <Section title="Panel + VisuallyHidden">
        <Panel>
          เนื้อหาในแผง
          <VisuallyHidden>ข้อความนี้อ่านได้เฉพาะ screen reader</VisuallyHidden>
        </Panel>
      </Section>

      <Section title="Dialog — focus trap, Escape, คืน focus">
        <Button variant="navy" onClick={() => setDialogOpen(true)}>
          เปิด Dialog
        </Button>
        <Dialog
          open={dialogOpen}
          titleTh="ยืนยันการออกจากด่าน"
          onClose={() => setDialogOpen(false)}
        >
          <p className="text-navy">
            มี checkpoint กลางด่านอยู่ ออกไปแล้วกลับมาเล่นต่อได้ตามเดิม
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="gold" onClick={() => setDialogOpen(false)}>
              ออกจากด่าน
            </Button>
          </div>
        </Dialog>
      </Section>

      <Section title="EquationView — subscript จริงจาก AST (BaSO4)">
        <EquationView
          ast={level11.precipitate.formula}
          ariaLabel={level11.precipitate.nameTh}
          className="text-2xl font-bold text-navy"
        />
      </Section>

      <Section title="IonCard — แตะเพื่อเลือก">
        {reactantCards.map((view) => (
          <IonCard
            key={view.instanceId}
            view={view}
            selected={selectedCardId === view.instanceId}
            onSelect={() =>
              setSelectedCardId((prev) => (prev === view.instanceId ? null : view.instanceId))
            }
          />
        ))}
      </Section>

      <Section title="CompoundCard — revealed: false เทียบ true">
        <CompoundCard view={compoundCardView(level1.precipitate, { revealed: false })} />
        <CompoundCard view={compoundCardView(level1.precipitate, { revealed: true })} />
      </Section>

      <Section title="IonSlot — ว่างเทียบมีการ์ด (แตะเพื่อสลับ)">
        <IonSlot
          slotId="demo-slot"
          slotLabelTh="ช่องที่ 1"
          assignedIon={slotFilled ? (reactantCards[0] ?? null) : null}
          onActivate={() => setSlotFilled(true)}
          onRemove={() => setSlotFilled(false)}
        />
      </Section>

      <Section title="CoefficientInput — ว่างเริ่มต้น เทียบมี error">
        <CoefficientInput value={coefficient} compoundLabelTh="AgCl" onChange={setCoefficient} />
        <CoefficientInput
          value={2}
          compoundLabelTh="NaNO3"
          errorTh="อัตราส่วนยังไม่ต่ำสุด"
          onChange={() => {}}
        />
      </Section>

      <Section title="EquationStrip — แตะการ์ดฝั่งซ้ายเพื่อสลับสถานะตัด">
        <EquationStrip
          left={leftEquation.map((card) => ({
            view: equationCardView(card, { revealed: true }),
            struck: struckIds.has(card.instanceId),
            selected: struckIds.has(card.instanceId),
            onSelect: () => toggleStruck(card.instanceId),
          }))}
          right={rightEquation.map((card) => ({
            view: equationCardView(card, { revealed: true }),
            struck: struckIds.has(card.instanceId),
          }))}
        />
      </Section>

      <Section title="CutPairList — ว่างเทียบมีรายการ">
        <CutPairList pairLabelsTh={cutPairs} />
        <Button
          variant="outline"
          onClick={() => setCutPairs((prev) => [...prev, `ตัดแล้ว: คู่ตัวอย่างที่ ${prev.length + 1}`])}
        >
          เพิ่มคู่ตัวอย่าง
        </Button>
      </Section>

      <Section title="FeedbackPanel — error (role=alert) เทียบ success (role=status)">
        <FeedbackPanel
          feedback={{ kind: "error", code: "E-CHARGE", messageTh: "ประจุรวมยังไม่เป็นศูนย์" }}
          onRetry={() => {}}
        />
        <FeedbackPanel
          feedback={{ kind: "success", code: null, messageTh: "ถูกต้อง! จับคู่ไอออนสำเร็จ" }}
        />
      </Section>

      <Section title="HintButton — เพดานอ่านจาก maxHints">
        <HintButton hintsUsed={0} maxHints={3} onUseHint={() => {}} />
        <HintButton hintsUsed={2} maxHints={3} onUseHint={() => {}} />
        <HintButton hintsUsed={3} maxHints={3} onUseHint={() => {}} />
      </Section>

      <Section title="SaveStatus — ทั้ง 4 สถานะ">
        <SaveStatus status="idle" />
        <SaveStatus status="saving" />
        <SaveStatus status="saved" />
        <SaveStatus status="error" onRetry={() => {}} onExport={() => {}} />
      </Section>

      <Section title="LevelGrid / DifficultyGroup / LevelTile — 50 ด่านจากเซฟตัวอย่าง">
        <LevelGrid groups={demoLevelGrid} onOpenLevel={() => {}} />
      </Section>
    </div>
  );
}
