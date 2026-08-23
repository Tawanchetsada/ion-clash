import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SaveStatus } from "./SaveStatus";

describe("SaveStatus", () => {
  it("idle ไม่แสดงข้อความ", () => {
    render(<SaveStatus status="idle" />);
    expect(screen.queryByText(/บันทึก/)).not.toBeInTheDocument();
  });

  it("error มีทางออกเสมอ — ปุ่มลองใหม่และส่งออกข้อมูล", async () => {
    const onRetry = vi.fn();
    const onExport = vi.fn();
    const user = userEvent.setup();
    render(<SaveStatus status="error" onRetry={onRetry} onExport={onExport} />);

    expect(screen.getByText("บันทึกไม่สำเร็จ")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ลองบันทึกอีกครั้ง" }));
    await user.click(screen.getByRole("button", { name: "ส่งออกข้อมูล" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onExport).toHaveBeenCalledOnce();
  });

  it("เป็น aria-live=polite เพื่อประกาศการเปลี่ยนสถานะ", () => {
    const { container } = render(<SaveStatus status="saving" />);
    expect(container.firstElementChild).toHaveAttribute("aria-live", "polite");
  });
});
