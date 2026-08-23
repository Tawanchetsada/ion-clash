import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HintViewer } from "./HintViewer";

describe("HintViewer", () => {
  const hints = [
    "คำใบ้ที่หนึ่ง: สารนี้ตกตะกอน",
    "คำใบ้ที่สอง: ไอออนบวกคือ Ca2+",
    "คำใบ้ที่สาม: ดุลสมการด้วยเลข 2",
  ];

  it("ไม่แสดงผลอะไรเมื่อ hintsUsed เป็น 0", () => {
    const { container } = render(<HintViewer hints={hints} hintsUsed={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("แสดงคำใบ้แรกเมื่อ hintsUsed เป็น 1 และไม่มีปุ่มลูกศร", () => {
    render(<HintViewer hints={hints} hintsUsed={1} />);

    expect(screen.getByText("คำใบ้ที่ 1:")).toBeInTheDocument();
    expect(screen.getByText(hints[0]!)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "คำใบ้ก่อนหน้า" })).not.toBeInTheDocument();
  });

  it("เมื่อ hintsUsed เป็น 2 จะเปิดคำใบ้ล่าสุด (2) พร้อมมีปุ่มลูกศรและ dots", () => {
    render(<HintViewer hints={hints} hintsUsed={2} />);

    // คำใบ้ล่าสุดต้องถูกเลือก
    expect(screen.getByText("คำใบ้ที่ 2:")).toBeInTheDocument();
    expect(screen.getByText(hints[1]!)).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    const prevBtn = screen.getByRole("button", { name: "คำใบ้ก่อนหน้า" });
    const nextBtn = screen.getByRole("button", { name: "คำใบ้ถัดไป" });

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled(); // อยู่ที่อันสุดท้ายแล้ว

    // กดปุ่มย้อนกลับไปดูคำใบ้ที่ 1
    act(() => {
      prevBtn.click();
    });

    expect(screen.getByText("คำใบ้ที่ 1:")).toBeInTheDocument();
    expect(screen.getByText(hints[0]!)).toBeInTheDocument();
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // กดปุ่มถัดไปเพื่อกลับมาคำใบ้ที่ 2
    act(() => {
      nextBtn.click();
    });

    expect(screen.getByText("คำใบ้ที่ 2:")).toBeInTheDocument();
    expect(screen.getByText(hints[1]!)).toBeInTheDocument();
  });

  it("สามารถกดที่ dot เพื่อสลับคำใบ้ได้", () => {
    render(<HintViewer hints={hints} hintsUsed={3} />);

    const dot1 = screen.getByRole("button", { name: "คำใบ้ที่ 1:" });
    const dot3 = screen.getByRole("button", { name: "คำใบ้ที่ 3:" });

    act(() => {
      dot1.click();
    });

    expect(screen.getByText("คำใบ้ที่ 1:")).toBeInTheDocument();
    expect(screen.getByText(hints[0]!)).toBeInTheDocument();

    act(() => {
      dot3.click();
    });

    expect(screen.getByText("คำใบ้ที่ 3:")).toBeInTheDocument();
    expect(screen.getByText(hints[2]!)).toBeInTheDocument();
  });

  it("รองรับ touch swipe ในการเลื่อนคำใบ้", () => {
    render(<HintViewer hints={hints} hintsUsed={3} />);

    // เริ่มต้นที่คำใบ้ที่ 3
    expect(screen.getByText("คำใบ้ที่ 3:")).toBeInTheDocument();

    const container = screen.getByRole("status");

    // ปัดขวา (deltaX > 40) -> ย้อนกลับไปคำใบ้ที่ 2
    fireEvent.touchStart(container, {
      touches: [{ clientX: 200 }],
    });
    fireEvent.touchEnd(container, {
      changedTouches: [{ clientX: 260 }],
    });

    expect(screen.getByText("คำใบ้ที่ 2:")).toBeInTheDocument();
    expect(screen.getByText(hints[1]!)).toBeInTheDocument();

    // ปัดซ้าย (deltaX < -40) -> ถัดไปคำใบ้ที่ 3
    fireEvent.touchStart(container, {
      touches: [{ clientX: 200 }],
    });
    fireEvent.touchEnd(container, {
      changedTouches: [{ clientX: 140 }],
    });

    expect(screen.getByText("คำใบ้ที่ 3:")).toBeInTheDocument();
    expect(screen.getByText(hints[2]!)).toBeInTheDocument();
  });
});
