import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import KnowledgePage from "./page";

const pushSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("Knowledge Page (/knowledge)", () => {
  beforeEach(() => {
    pushSpy.mockClear();
  });

  it("แสดงหัวข้อหลัก คลังความรู้เคมี ม.4 และปุ่มเริ่มเล่นเลย", () => {
    render(<KnowledgePage />);

    expect(screen.getByRole("heading", { name: "คลังความรู้เคมี ม.4" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /เริ่มเล่นเลย/ })).toHaveAttribute("href", "/levels");
  });

  it("แสดงครบทั้ง 4 หัวข้อแบบ accordion และสามารถเปิด-ปิดได้", () => {
    render(<KnowledgePage />);

    // Check all 4 topic buttons
    const btn1 = screen.getByRole("button", { name: /การแตกตัวของสารประกอบไอออนิกในน้ำ/ });
    const btn2 = screen.getByRole("button", { name: /กฎการละลายน้ำของสารประกอบไอออนิก/ });
    const btn3 = screen.getByRole("button", { name: /ไอออนตัวประกอบ/ });
    const btn4 = screen.getByRole("button", { name: /การดุลสมการเคมีและอัตราส่วนอย่างต่ำ/ });

    expect(btn1).toBeInTheDocument();
    expect(btn2).toBeInTheDocument();
    expect(btn3).toBeInTheDocument();
    expect(btn4).toBeInTheDocument();

    // Section 1 is open by default
    expect(btn1).toHaveAttribute("aria-expanded", "true");
    expect(btn2).toHaveAttribute("aria-expanded", "false");

    // Click section 2 to open
    act(() => {
      btn2.click();
    });
    expect(btn2).toHaveAttribute("aria-expanded", "true");
    // ตารางกฎ 11 ข้อปรากฏ
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("ปุ่มหน้าหลักและวิธีเล่นใน Header ทำงานได้", () => {
    render(<KnowledgePage />);

    const homeBtn = screen.getByRole("button", { name: "หน้าหลัก" });
    const howToPlayBtn = screen.getByRole("button", { name: "วิธีเล่น" });

    act(() => {
      homeBtn.click();
    });
    expect(pushSpy).toHaveBeenCalledWith("/");

    act(() => {
      howToPlayBtn.click();
    });
    expect(pushSpy).toHaveBeenCalledWith("/how-to-play");
  });
});
