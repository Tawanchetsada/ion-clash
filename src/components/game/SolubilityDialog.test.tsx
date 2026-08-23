import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SolubilityDialog } from "./SolubilityDialog";

describe("SolubilityDialog", () => {
  it("render ตารางกฎ 11 ข้อเมื่อ open=true", () => {
    const onClose = vi.fn();
    render(<SolubilityDialog open={true} onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "ดูกฎการละลาย" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();

    // Check all 11 rows exist
    const rows = screen.getAllByRole("row");
    // 1 header row + 11 content rows = 12
    expect(rows).toHaveLength(12);

    expect(
      screen.getByText("เกลือของ Na⁺, K⁺ และ NH₄⁺ ละลายน้ำได้ทั้งหมด"),
    ).toBeInTheDocument();
  });

  it("ไม่ render อะไรเมื่อ open=false", () => {
    const onClose = vi.fn();
    render(<SolubilityDialog open={false} onClose={onClose} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("กดปุ่มปิดเรียก onClose", () => {
    const onClose = vi.fn();
    render(<SolubilityDialog open={true} onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: "ปิด" });
    closeBtn.click();
    expect(onClose).toHaveBeenCalled();
  });
});
