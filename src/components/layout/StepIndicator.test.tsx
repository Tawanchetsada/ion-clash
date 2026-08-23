import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StepIndicator } from "./StepIndicator";
import type { ProgressStep } from "./StepIndicator";

describe("StepIndicator", () => {
  it("มี aria-current=step อยู่ที่ขั้นเดียวเท่านั้น ตรงกับ current ที่ส่งมา", () => {
    render(<StepIndicator current={3} />);
    const current = screen.getAllByText((_, el) => el?.getAttribute("aria-current") === "step");
    expect(current).toHaveLength(1);
  });

  it("current เป็น null (นอกวงจรเล่น) ไม่มีขั้นไหน aria-current เลย", () => {
    render(<StepIndicator current={null} />);
    const current = screen.queryAllByText(
      (_, el) => el?.getAttribute("aria-current") === "step",
    );
    expect(current).toHaveLength(0);
  });

  it.each([1, 2, 3, 4, 5] as ProgressStep[])("current=%i render ครบ 5 วง", (step) => {
    render(<StepIndicator current={step} />);
    expect(screen.getAllByText(/^[1-5]$/)).toHaveLength(5);
  });

  it("ขั้นที่ผ่านแล้วสามารถกดได้เมื่อส่ง onStepClick", async () => {
    const onStepClick = vi.fn();
    render(<StepIndicator current={3} onStepClick={onStepClick} />);

    // ขั้นที่ 1 และ 2 เป็นปุ่มที่กดได้
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);

    buttons[0]?.click();
    expect(onStepClick).toHaveBeenCalledWith(1);

    buttons[1]?.click();
    expect(onStepClick).toHaveBeenCalledWith(2);
  });
});
