import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MESSAGES } from "../../config/messages";
import { RotatePrompt } from "./RotatePrompt";

/** จำลอง matchMedia ให้ตอบว่าตรงเงื่อนไขหรือไม่ตามที่กำหนด */
function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RotatePrompt", () => {
  it("ไม่แสดงอะไรเลยเมื่อจอไม่ใช่มือถือแนวตั้ง", () => {
    mockMatchMedia(false);
    const { container } = render(<RotatePrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it("แสดงคำชวนหมุนจอเมื่อเป็นมือถือแนวตั้ง", () => {
    mockMatchMedia(true);
    render(<RotatePrompt />);
    expect(
      screen.getByRole("heading", { name: MESSAGES.ui.rotatePrompt.title }),
    ).toBeInTheDocument();
  });

  it("ต้องมีทางเล่นแนวตั้งต่อได้เสมอ และกดแล้วไม่ถามซ้ำ", async () => {
    // WCAG 1.3.4 ห้ามล็อกเนื้อหาไว้กับทิศทางจอเดียว — ผู้ใช้ที่ยึดอุปกรณ์
    // ไว้กับขาตั้งหรือรถเข็นหมุนเครื่องไม่ได้ จึงต้องข้ามได้เสมอ
    mockMatchMedia(true);
    const user = userEvent.setup();
    render(<RotatePrompt />);

    const dismiss = screen.getByRole("button", { name: MESSAGES.ui.rotatePrompt.dismiss });
    await user.click(dismiss);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
