import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageShell } from "./PageShell";

function shellOf(container: HTMLElement): HTMLElement {
  const shell = container.querySelector<HTMLElement>('[data-page-shell="true"]');
  if (!shell) throw new Error("ไม่พบ PageShell");
  return shell;
}

describe("PageShell", () => {
  it("render children", () => {
    render(<PageShell>เนื้อหาหน้า</PageShell>);
    expect(screen.getByText("เนื้อหาหน้า")).toBeInTheDocument();
  });

  it("ไม่เป็น main เอง — แต่ละหน้าประกาศ main ของตัวเองข้างใน", () => {
    // ทุกหน้าวาง AppHeader ไว้ใน PageShell แล้วตามด้วย <main> ของหน้านั้น
    // ถ้า PageShell เป็น main ด้วย จะได้ landmark ซ้อนกันและมี main สองอัน
    const { container } = render(<PageShell>เนื้อหาหน้า</PageShell>);
    expect(shellOf(container).tagName).toBe("DIV");
    expect(screen.queryByRole("main")).toBeNull();
  });

  it("มี min-w-0 เสมอ — ป้องกัน flex item ของ body ดันทั้งหน้าให้เลื่อนแนวนอน", () => {
    // body ใน layout.tsx เป็น flex flex-col ทำให้ PageShell เป็น flex item
    // เสมอ ถ้าไม่มี min-w-0 ลูกหลานที่กว้าง (เช่นแถบสมการ) จะดันความกว้าง
    // ทั้งหน้าเกิน viewport แทนที่จะหดแล้วให้แถบนั้นเลื่อนในตัวเอง — เจอบั๊กนี้
    // จริงตอนทดสอบหน้าคลัง component ที่ 390px
    const { container } = render(<PageShell>เนื้อหาหน้า</PageShell>);
    const shell = shellOf(container);
    expect(shell).toHaveClass("min-w-0");
    expect(shell).toHaveClass("w-full");
  });
});
