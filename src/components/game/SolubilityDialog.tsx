"use client";

import { useMemo } from "react";
import { MESSAGES } from "../../config/messages";
import { solubilityTableView } from "../../presentation/solubility";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

export type SolubilityDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * แผงตารางกฎการละลายน้ำ 11 ข้อระหว่างเล่นเกม — เปิดดูได้โดยไม่หักคะแนน
 *
 * ข้อห้าม:
 * 1. ห้ามไฮไลต์แถวที่เกี่ยวกับด่านปัจจุบัน (เป็นการเฉลย)
 * 2. ห้ามยิง USE_HINT (ไม่หักคะแนน)
 */
export function SolubilityDialog({ open, onClose }: SolubilityDialogProps) {
  const rules = useMemo(() => solubilityTableView(), []);

  return (
    <Dialog open={open} titleTh={MESSAGES.ui.rules} onClose={onClose}>
      <div className="flex flex-col gap-4 text-left">
        <p className="text-xs text-navy/70">
          {MESSAGES.ui.rulesDialog.tip}
        </p>

        <div className="max-h-[60vh] overflow-y-auto rounded-card border border-border bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-panel text-navy font-bold sticky top-0">
                <th className="py-2 px-2.5 w-12 text-center">{MESSAGES.ui.rulesDialog.colOrder}</th>
                <th className="py-2 px-2.5">{MESSAGES.ui.rulesDialog.colRule}</th>
                <th className="py-2 px-2.5 w-24 text-center">{MESSAGES.ui.rulesDialog.colOutcome}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rules.map((rule) => (
                <tr key={rule.order} className="hover:bg-canvas/50">
                  <td className="py-2 px-2.5 text-center font-bold text-navy/70">
                    {rule.order}
                  </td>
                  <td className="py-2 px-2.5 text-navy leading-relaxed">
                    {rule.descriptionTh}
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-bold ${
                        rule.phase === "aq"
                          ? "bg-blue/15 text-blue"
                          : "bg-gold/30 text-navy"
                      }`}
                    >
                      {rule.phase === "aq"
                        ? MESSAGES.ui.rulesDialog.outcomeSoluble
                        : MESSAGES.ui.rulesDialog.outcomePrecipitate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="gold" onClick={onClose}>
            {MESSAGES.ui.rulesDialog.close}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
