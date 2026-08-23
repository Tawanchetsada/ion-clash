"use client";

import { MESSAGES } from "../../config/messages";
import { SOLUBILITY_7_RULES } from "../../presentation/solubility";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { HintIcon } from "../ui/Icon";

export type SolubilityDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * แผงตารางกฎการละลายน้ำ 7 ข้อระหว่างเล่นเกม — เปิดดูได้โดยไม่หักคะแนน
 *
 * ข้อห้าม:
 * 1. ห้ามไฮไลต์แถวที่เกี่ยวกับด่านปัจจุบัน (เป็นการเฉลย)
 * 2. ห้ามยิง USE_HINT (ไม่หักคะแนน)
 */
export function SolubilityDialog({ open, onClose }: SolubilityDialogProps) {
  return (
    <Dialog open={open} titleTh={MESSAGES.ui.rules} onClose={onClose}>
      <div className="flex flex-col gap-3 text-left">
        {/* คำแนะนำวิธีใช้ */}
        <div className="rounded-lg bg-blue/10 p-3 border border-blue/20 text-xs leading-relaxed text-navy">
          {MESSAGES.ui.rulesDialog.instruction}
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
          {/* รายการกฎการละลาย 7 ข้อ */}
          <div className="flex flex-col gap-2.5">
            {SOLUBILITY_7_RULES.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-navy/15 bg-white p-3 shadow-2xs space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border/80 pb-2">
                  <h4 className="font-bold text-navy text-sm">
                    {r.title}
                  </h4>
                  <div className="flex items-center gap-1">
                    <span className="text-navy/70 text-[11px]">
                      {r.exception
                        ? MESSAGES.ui.rulesDialog.statusNormal
                        : MESSAGES.ui.rulesDialog.status}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-bold ${
                        r.isNormalSoluble
                          ? "bg-blue/15 text-blue"
                          : "bg-gold-light text-navy"
                      }`}
                    >
                      {r.normalStatus}
                    </span>
                  </div>
                </div>

                <p className="text-navy/90 leading-relaxed">
                  {r.general}
                </p>

                {r.exception && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 rounded-md bg-canvas p-2 border border-border">
                    <div className="text-navy/90">
                      <strong className="text-error font-bold">{MESSAGES.ui.rulesDialog.exceptionPrefix}</strong> {r.exception}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] shrink-0">
                      <span className="text-navy/70">{MESSAGES.ui.rulesDialog.statusException}</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold ${
                          !r.isNormalSoluble
                            ? "bg-blue/15 text-blue"
                            : "bg-gold-light text-navy"
                        }`}
                      >
                        {r.exceptionStatus}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* กรอบ "จำให้แม่น" */}
          <div className="rounded-xl bg-gold-surface p-4 border-2 border-gold/50 text-navy space-y-2.5 shadow-2xs text-xs">
            <div className="flex items-center gap-2 border-b border-gold/30 pb-1.5">
              <span className="text-base text-navy">
                <HintIcon />
              </span>
              <h4 className="font-extrabold text-sm text-navy">
                {MESSAGES.ui.rulesDialog.summaryTitle}
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-lg bg-white/90 p-2.5 border border-gold/20 shadow-2xs">
                <p className="font-bold text-blue mb-0.5">{MESSAGES.ui.rulesDialog.alwaysSolubleLabel}</p>
                <p className="font-medium text-navy/90">{MESSAGES.ui.rulesDialog.alwaysSolubleIons}</p>
              </div>
              <div className="rounded-lg bg-white/90 p-2.5 border border-gold/20 shadow-2xs">
                <p className="font-bold text-navy mb-0.5">{MESSAGES.ui.rulesDialog.mostlySolubleLabel}</p>
                <p className="font-medium text-navy/90">{MESSAGES.ui.rulesDialog.mostlySolubleIons}</p>
              </div>
              <div className="rounded-lg bg-white/90 p-2.5 border border-gold/20 shadow-2xs">
                <p className="font-bold text-error mb-0.5">{MESSAGES.ui.rulesDialog.mostlyInsolubleLabel}</p>
                <p className="font-medium text-navy/90">{MESSAGES.ui.rulesDialog.mostlyInsolubleIons}</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-navy/80 leading-relaxed pt-1">
            {MESSAGES.ui.rulesDialog.note}
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="gold" onClick={onClose}>
            {MESSAGES.ui.rulesDialog.close}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
