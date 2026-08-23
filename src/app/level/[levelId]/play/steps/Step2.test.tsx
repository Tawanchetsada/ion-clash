import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getLevel } from "../../../../../data/levels";
import { createInitialState } from "../../../../../domain/game/gameMachine";
import { Step2 } from "./Step2";
import type { GameState } from "../../../../../domain/game/types";

// Level 25: Pb(NO3)2 + 2KI -> PbI2 + 2KNO3
const level25 = getLevel(25);

function stateAt(phase: GameState["phase"]): GameState {
  return { ...createInitialState(level25), phase };
}

describe("Step2 · จัดเรียงไอออน, ไขว้ประจุ และดุลสมการ", () => {
  it("ใน arrangeProductIons แสดงหัวข้อแลกเปลี่ยนคู่ไอออน และปุ่มตรวจการจัดเรียง", () => {
    render(<Step2 state={stateAt("arrangeProductIons")} level={level25} dispatch={vi.fn()} />);
    expect(screen.getByText(/แลกเปลี่ยนคู่ไอออนสร้างผลิตภัณฑ์/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" })).toBeInTheDocument();
  });

  it("เมื่อเข้าสู่ balanceEquation แสดงหน้าไขว้ประจุ (Criss-Cross) ก่อน พร้อมปุ่มถัดไป", () => {
    render(<Step2 state={stateAt("balanceEquation")} level={level25} dispatch={vi.fn()} />);
    expect(screen.getByText("เขียนสูตรสารประกอบไอออนิก (คูณไขว้)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ถัดไป: 2.3 ดุลสมการเคมี" })).toBeInTheDocument();
  });

  it("เมื่อกด 'ถัดไป: 2.3 ดุลสมการเคมี' จะสลับไปแสดงช่องกรอกสัมประสิทธิ์และตารางนับอะตอม", () => {
    render(<Step2 state={stateAt("balanceEquation")} level={level25} dispatch={vi.fn()} />);
    
    // กดปุ่มถัดไป
    const nextBtn = screen.getByRole("button", { name: "ถัดไป: 2.3 ดุลสมการเคมี" });
    fireEvent.click(nextBtn);

    // ตอนนี้ต้องเห็นตารางตรวจนับจำนวนอะตอมและปุ่มตรวจการดุลสมการ
    expect(screen.getByText("ตรวจนับจำนวนอะตอม/ไอออน")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ตรวจการดุลสมการ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ย้อนกลับไปดูการคูณไขว้ (2.2)" })).toBeInTheDocument();
  });
});
