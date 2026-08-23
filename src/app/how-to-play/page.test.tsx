import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HowToPlayPage from "./page";
import { SCORING } from "../../config/scoring";

const pushSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("How to Play Page (/how-to-play)", () => {
  beforeEach(() => {
    pushSpy.mockClear();
  });

  it("แสดงหัวข้อคู่มือวิธีการเล่น และ 5 ขั้นตอนของเกม", () => {
    render(<HowToPlayPage />);

    expect(
      screen.getByRole("heading", { name: "คู่มือวิธีการเล่นเกม Ion Clash" }),
    ).toBeInTheDocument();
    expect(screen.getByText("5 ขั้นตอนสู่สมการไอออนิกสุทธิ")).toBeInTheDocument();
    expect(screen.getByText("เข้าสู่เกม")).toBeInTheDocument();
    expect(screen.getByText("ไอออน 4 ไป 4")).toBeInTheDocument();
    expect(screen.getByText("ตรวจผลิตภัณฑ์")).toBeInTheDocument();
    expect(screen.getByText("ตัดไอออนผู้ชม")).toBeInTheDocument();
    expect(screen.getByText("สมการไอออนิกสุทธิ")).toBeInTheDocument();
  });

  it("แสดงวิธีการควบคุมทั้ง 3 รูปแบบ (ลาก-วาง, แตะสองครั้ง, คีย์บอร์ด)", () => {
    render(<HowToPlayPage />);

    expect(screen.getByText(/1\. ลากและวาง/)).toBeInTheDocument();
    expect(screen.getByText(/2\. แตะสองครั้ง/)).toBeInTheDocument();
    expect(screen.getByText(/3\. คีย์บอร์ด/)).toBeInTheDocument();
  });

  it("มีปุ่มลิงก์ไปยังหน้ากระดานทดลองเล่นจริง (/how-to-play/sandbox)", () => {
    render(<HowToPlayPage />);

    expect(
      screen.getByRole("heading", { name: /กระดานทดลองเล่นจริง/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /เปิดกระดานทดลองเล่นจริง/ }),
    ).toHaveAttribute("href", "/how-to-play/sandbox");
  });

  it("แสดงคะแนนและเกณฑ์ดาวตรงกับ SCORING config", () => {
    render(<HowToPlayPage />);

    expect(
      screen.getAllByText(new RegExp(`${SCORING.startScore} คะแนน`)).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(new RegExp(`${SCORING.penaltyPerWrong} คะแนน`)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${SCORING.penaltyPerHint} คะแนน`)),
    ).toBeInTheDocument();
  });

  it("มีปุ่มนำทางไปยัง /knowledge และ /levels", () => {
    render(<HowToPlayPage />);

    expect(screen.getByRole("link", { name: /ศึกษาคลังความรู้/ })).toHaveAttribute(
      "href",
      "/knowledge",
    );
    expect(screen.getByRole("link", { name: /ไปยังหน้าเลือกด่าน/ })).toHaveAttribute(
      "href",
      "/levels",
    );
  });
});
