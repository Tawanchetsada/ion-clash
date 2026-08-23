import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getLevel } from "../../../../../data/levels";
import { createInitialState } from "../../../../../domain/game/gameMachine";
import { Step3 } from "./Step3";
import type { GameState } from "../../../../../domain/game/types";

const level = getLevel(1); // AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)

function stateAt(phase: GameState["phase"]): GameState {
  return { ...createInitialState(level), phase };
}

describe("Step3 · ตรวจผลิตภัณฑ์", () => {
  it("กล่องขวาแสดงไอออนแยกกันคนละใบ ไม่รวมเป็นสูตรสารประกอบที่ละลายน้ำ", () => {
    // เอกสาร UI หน้า 09 วาด Na⁺ กับ NO₃⁻ เป็นการ์ดสองใบ ไม่ใช่ NaNO₃ ใบเดียว
    // และถูกต้องทางเคมีด้วย — สารที่ละลายน้ำไม่ได้เกิดขึ้นจริงเป็นก้อน
    render(<Step3 state={stateAt("validateProducts")} level={level} dispatch={vi.fn()} />);

    expect(screen.getByText("โซเดียมไอออน")).toBeInTheDocument();
    expect(screen.getByText("ไนเตรตไอออน")).toBeInTheDocument();
    expect(screen.queryByText(level.aqueousProduct.nameTh)).toBeNull();
  });

  it("ใช้คำว่าผลิตภัณฑ์กับตะกอนเท่านั้น ไม่ใช้กับไอออนที่ยังละลายอยู่", () => {
    render(<Step3 state={stateAt("validateProducts")} level={level} dispatch={vi.fn()} />);

    expect(screen.getByText("ผลิตภัณฑ์ที่เป็นตะกอน")).toBeInTheDocument();
    expect(screen.getByText("ไอออนที่ยังคงอยู่ในสารละลาย")).toBeInTheDocument();
  });

  it("ตะกอนเป็นการ์ดทองได้เมื่อผ่านการตรวจแล้วเท่านั้น", () => {
    const cardHtml = (phase: GameState["phase"]) => {
      const view = render(<Step3 state={stateAt(phase)} level={level} dispatch={vi.fn()} />);
      const html = view.getByRole("group", { name: /ซิลเวอร์คลอไรด์/ }).innerHTML;
      view.unmount();
      return html;
    };

    expect(cardHtml("arrangeProductIons")).not.toContain("bg-gold");
    expect(cardHtml("validateProducts")).toContain("bg-gold");
  });

  it("ปุ่มไปขั้นถัดไปไม่มีลูกศรตกแต่งในข้อความ", () => {
    render(<Step3 state={stateAt("validateProducts")} level={level} dispatch={vi.fn()} />);
    const next = screen.getByRole("button", { name: /ไปขั้นตัดไอออนตัวประกอบ/ });
    expect(next.textContent).not.toContain("→");
  });
});
