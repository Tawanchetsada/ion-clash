import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageShell } from "./PageShell";

describe("PageShell", () => {
  it("render children ในแท็ก main", () => {
    render(<PageShell>เนื้อหาหน้า</PageShell>);
    const main = screen.getByRole("main");
    expect(main).toContainElement(screen.getByText("เนื้อหาหน้า"));
  });

  it("มี min-w-0 เสมอ — ป้องกัน flex item ของ body ดันทั้งหน้าให้เลื่อนแนวนอน", () => {
    // body ใน layout.tsx เป็น flex flex-col ทำให้ PageShell เป็น flex item
    // เสมอ ถ้าไม่มี min-w-0 ลูกหลานที่กว้าง (เช่นแถบสมการ) จะดันความกว้าง
    // ทั้งหน้าเกิน viewport แทนที่จะหดแล้วให้แถบนั้นเลื่อนในตัวเอง — เจอบั๊กนี้
    // จริงตอนทดสอบหน้าคลัง component ที่ 390px
    render(<PageShell>เนื้อหาหน้า</PageShell>);
    const main = screen.getByRole("main");
    expect(main).toHaveClass("min-w-0");
    expect(main).toHaveClass("w-full");
  });
});
