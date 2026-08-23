import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SolubilityDialog } from "./SolubilityDialog";

describe("SolubilityDialog", () => {
  it("render กฎการละลาย 7 ข้อและกรอบจำให้แม่นเมื่อ open=true", () => {
    const onClose = vi.fn();
    render(<SolubilityDialog open={true} onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "ดูกฎการละลาย" })).toBeInTheDocument();
    expect(
      screen.getByText(/วิธีใช้: ตรวจสอบไอออนในสารประกอบตามลำดับจากข้อ 1 ลงไป/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ข้อ 1 — เกลือของ Na⁺, K⁺ และ NH₄⁺"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ข้อ 7 — เกลือไทโอไซยาเนต"),
    ).toBeInTheDocument();
    expect(screen.getByText("จำให้แม่น")).toBeInTheDocument();
    expect(screen.getByText("Na⁺, K⁺, NH₄⁺ และ NO₃⁻")).toBeInTheDocument();
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
