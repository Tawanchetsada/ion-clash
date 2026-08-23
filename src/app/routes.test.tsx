import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";
import HowToPlayPage from "./how-to-play/page";
import KnowledgePage from "./knowledge/page";
import NotFound from "./not-found";
import ResearchPage from "./research/page";

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
    expect(
      screen.getByRole("heading", { name: "คู่มือวิธีการเล่นเกม Ion Clash" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ไปยังหน้าเลือกด่าน/ }),
    ).toBeInTheDocument();
  });

  it("render หน้า /knowledge ได้ถูกต้องพร้อมข้อความและปุ่ม", () => {
    render(<KnowledgePage />);
    expect(
      screen.getByRole("heading", { name: "คลังความรู้เคมี ม.4" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /เริ่มเล่นเลย/ }),
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

  it("render หน้า /research ได้ถูกต้องพร้อมหัวข้อและส่วนนำเข้าข้อมูล", () => {
    render(<ResearchPage />);
    expect(
      screen.getByRole("heading", {
        name: /แดชบอร์ดข้อมูลวิจัยและการประเมิน E1\/E2/,
      }),
    ).toBeInTheDocument();
  });
});
