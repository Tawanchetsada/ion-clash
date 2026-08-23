import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HowToPlaySandboxPage from "./page";

const pushSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("How to Play Sandbox Page (/how-to-play/sandbox)", () => {
  beforeEach(() => {
    pushSpy.mockClear();
  });

  it("render หัวข้อกระดานทดลองเล่นจริงและปุ่มย้อนกลับ", () => {
    render(<HowToPlaySandboxPage />);

    expect(
      screen.getByRole("heading", { name: "ทดลองจัดเรียงไอออนและดุลสมการเคมี" }),
    ).toBeInTheDocument();
    expect(screen.getByText("กระดานทดลองเล่นจริง (Interactive Sandbox)")).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /← กลับไปหน้าวิธีเล่น/ });
    expect(backBtn).toBeInTheDocument();

    act(() => {
      backBtn.click();
    });

    expect(pushSpy).toHaveBeenCalledWith("/how-to-play");
  });

  it("มีส่วน 2.1 แลกเปลี่ยนคู่ไอออนสร้างผลิตภัณฑ์ พร้อมปุ่มเติม/ล้าง", () => {
    render(<HowToPlaySandboxPage />);

    expect(screen.getByText("แลกเปลี่ยนคู่ไอออนสร้างผลิตภัณฑ์")).toBeInTheDocument();

    const autoFillBtn = screen.getByRole("button", { name: "แสดงตัวอย่างการวางที่ถูกต้อง" });
    const resetBtn = screen.getByRole("button", { name: "ล้างทุกช่อง" });

    expect(autoFillBtn).toBeInTheDocument();
    expect(resetBtn).toBeInTheDocument();

    act(() => {
      autoFillBtn.click();
    });

    expect(screen.getByText("จัดเรียงไอออนถูกต้องแล้ว")).toBeInTheDocument();

    act(() => {
      resetBtn.click();
    });

    expect(screen.queryByText("จัดเรียงไอออนถูกต้องแล้ว")).not.toBeInTheDocument();
  });

  it("มีส่วน 2.2 เขียนสูตรสารประกอบไอออนิก (คูณไขว้)", () => {
    render(<HowToPlaySandboxPage />);

    expect(screen.getByText("เขียนสูตรสารประกอบไอออนิก (คูณไขว้)")).toBeInTheDocument();
    expect(screen.getByText("ผลิตภัณฑ์ที่เป็นตะกอน (s)")).toBeInTheDocument();
    expect(screen.getByText("ไอออนที่ยังคงอยู่ในสารละลาย (aq)")).toBeInTheDocument();
  });

  it("มีส่วน 2.3 ดุลสมการเคมี ตารางตรวจนับอะตอม และปุ่มเฉลย/รีเซ็ต", () => {
    render(<HowToPlaySandboxPage />);

    expect(screen.getByText("ดุลสมการเคมี (ทดลองดุลสมการ)")).toBeInTheDocument();
    expect(screen.getByText("ตรวจนับจำนวนอะตอม/ไอออน")).toBeInTheDocument();

    const solveBalancingBtn = screen.getByRole("button", { name: "แสดงเฉลยการดุลสมการ" });
    const resetBalancingBtn = screen.getByRole("button", { name: "รีเซ็ตสัมประสิทธิ์ (เป็น 1)" });

    expect(solveBalancingBtn).toBeInTheDocument();
    expect(resetBalancingBtn).toBeInTheDocument();

    // Click solve balancing
    act(() => {
      solveBalancingBtn.click();
    });

    expect(screen.getByText("ดุลสมการถูกต้องแล้ว")).toBeInTheDocument();

    // Click reset balancing
    act(() => {
      resetBalancingBtn.click();
    });

    expect(screen.queryByText("ดุลสมการถูกต้องแล้ว")).not.toBeInTheDocument();
  });
});
