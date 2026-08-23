"use client";

import { MESSAGES } from "../../config/messages";
import type { FormulaAst } from "../../domain/chemistry/types";
import { EquationView } from "./EquationView";
import { CheckIcon, CloseIcon } from "../ui/Icon";

export type AtomBalanceRow = {
  /** Unique key for the row (ionId) */
  key: string;
  /** Formula AST for display (e.g. Pb²⁺) */
  formula: FormulaAst;
  /** Count on the left (reactant) side, null if coefficient not yet entered */
  leftCount: number | null;
  /** Count on the right (product) side, null if coefficient not yet entered */
  rightCount: number | null;
};

export type AtomBalanceTableProps = {
  rows: AtomBalanceRow[];
};

export function AtomBalanceTable({ rows }: AtomBalanceTableProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-bold text-navy">
        {MESSAGES.ui.atomTableTitle}
      </h3>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-navy/5 text-navy font-semibold text-sm">
            <tr>
              <th className="px-4 py-3">{MESSAGES.ui.atomTableIon}</th>
              <th className="px-4 py-3 text-center">{MESSAGES.ui.atomTableLeft}</th>
              <th className="px-4 py-3 text-center">{MESSAGES.ui.atomTableRight}</th>
              <th className="px-4 py-3 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => {
              const hasCounts = row.leftCount !== null && row.rightCount !== null;
              const isBalanced = hasCounts && row.leftCount === row.rightCount;
              const isUnbalanced = hasCounts && row.leftCount !== row.rightCount;

              let rowClass = "bg-white";
              if (isBalanced) rowClass = "bg-emerald-50";
              else if (isUnbalanced) rowClass = "bg-red-50";

              return (
                <tr key={row.key} className={rowClass}>
                  <td className="px-4 py-3 font-medium">
                    <EquationView ast={row.formula} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.leftCount !== null ? row.leftCount : MESSAGES.ui.atomTableEmpty}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.rightCount !== null ? row.rightCount : MESSAGES.ui.atomTableEmpty}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isBalanced && (
                      <span
                        className="inline-flex items-center justify-center text-emerald-600 font-bold"
                        aria-label={MESSAGES.ui.atomTableBalanced}
                      >
                        <CheckIcon className="text-base" />
                      </span>
                    )}
                    {isUnbalanced && (
                      <span
                        className="inline-flex items-center justify-center text-red-500 font-bold"
                        aria-label={MESSAGES.ui.atomTableNotBalanced}
                      >
                        <CloseIcon className="text-base" />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
