import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AtomBalanceTable } from "./AtomBalanceTable";
import type { AtomBalanceRow } from "./AtomBalanceTable";

describe("AtomBalanceTable", () => {
  const sampleRows: AtomBalanceRow[] = [
    {
      key: "lead-2plus",
      formula: [{ kind: "text", value: "Pb" }, { kind: "sup", value: "2+" }],
      leftCount: 1,
      rightCount: 1,
    },
    {
      key: "iodide",
      formula: [{ kind: "text", value: "I" }, { kind: "sup", value: "-" }],
      leftCount: 1,
      rightCount: 2,
    },
    {
      key: "potassium-plus",
      formula: [{ kind: "text", value: "K" }, { kind: "sup", value: "+" }],
      leftCount: null,
      rightCount: null,
    },
  ];

  it("แสดงหัวข้อตารางและคอลัมน์ถูกต้อง", () => {
    render(<AtomBalanceTable rows={sampleRows} />);
    expect(screen.getByText("ตรวจนับจำนวนอะตอม/ไอออน")).toBeInTheDocument();
    expect(screen.getByText("ไอออน/ธาตุ")).toBeInTheDocument();
    expect(screen.getByText("ฝั่งซ้าย")).toBeInTheDocument();
    expect(screen.getByText("ฝั่งขวา")).toBeInTheDocument();
  });

  it("แสดงเครื่องหมายถูกเมื่อจำนวนสองข้างเท่ากัน", () => {
    render(<AtomBalanceTable rows={sampleRows} />);
    expect(screen.getByLabelText("สมดุล")).toBeInTheDocument();
  });

  it("แสดงเครื่องหมายกากบาทเมื่อจำนวนสองข้างไม่เท่ากัน", () => {
    render(<AtomBalanceTable rows={sampleRows} />);
    expect(screen.getByLabelText("ยังไม่สมดุล")).toBeInTheDocument();
  });

  it("แสดง — เมื่อยังไม่ได้กรอกตัวเลข", () => {
    render(<AtomBalanceTable rows={sampleRows} />);
    const emptyCells = screen.getAllByText("—");
    expect(emptyCells.length).toBeGreaterThan(0);
  });
});
