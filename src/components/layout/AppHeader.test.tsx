import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("แสดงตราและเลขด่านเมื่อส่งมา", () => {
    render(<AppHeader levelLabelTh="LEVEL 01/50" />);
    expect(screen.getByText("ION CLASH")).toBeInTheDocument();
    expect(screen.getByText("LEVEL 01/50")).toBeInTheDocument();
  });

  it("ปุ่มหน้าหลักและวิธีเล่นเป็นปุ่มจริงและเรียก handler ได้", async () => {
    const onHome = vi.fn();
    const onHowToPlay = vi.fn();
    const user = userEvent.setup();
    render(<AppHeader onHome={onHome} onHowToPlay={onHowToPlay} />);

    await user.click(screen.getByRole("button", { name: "หน้าหลัก" }));
    await user.click(screen.getByRole("button", { name: "วิธีเล่น" }));

    expect(onHome).toHaveBeenCalledOnce();
    expect(onHowToPlay).toHaveBeenCalledOnce();
  });

  it("ไม่มีปุ่มปรากฏถ้าไม่ได้ส่ง handler มา", () => {
    render(<AppHeader />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
