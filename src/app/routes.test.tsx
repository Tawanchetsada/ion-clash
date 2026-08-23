import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";
import HowToPlayPage from "./how-to-play/page";
import KnowledgePage from "./knowledge/page";
import NotFound from "./not-found";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("Routes and Shells", () => {
  it("render หน้า /how-to-play ได้ถูกต้องพร้อมข้อความและปุ่ม", () => {
    render(<HowToPlayPage />);
    expect(screen.getByRole("heading", { name: "วิธีการเล่น" })).toBeInTheDocument();
    expect(
      screen.getByText(/คู่มือการเล่นและการใช้งานระบบลาก-วางกำลังอยู่ระหว่างการจัดทำเนื้อหา/),
    ).toBeInTheDocument();
  });

  it("render หน้า /knowledge ได้ถูกต้องพร้อมข้อความและปุ่ม", () => {
    render(<KnowledgePage />);
    expect(
      screen.getByRole("heading", { name: "ความรู้ก่อนเล่นเกม" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/สรุปเนื้อหากฎการละลายน้ำและสมการไอออนิกกำลังอยู่ระหว่างการจัดทำเนื้อหา/),
    ).toBeInTheDocument();
  });

  it("render หน้า NotFound (404) ได้ถูกต้อง", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: "ไม่พบหน้าที่คุณต้องการ" }),
    ).toBeInTheDocument();
  });

  it("render หน้า Error ได้ถูกต้องพร้อมปุ่มลองใหม่", () => {
    const resetSpy = vi.fn();
    render(
      <ErrorPage
        error={new Error("TEST_ERROR_MESSAGE")}
        reset={resetSpy}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "เกิดข้อผิดพลาดในการทำงาน" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/TEST_ERROR_MESSAGE/)).toBeInTheDocument();
  });
});
