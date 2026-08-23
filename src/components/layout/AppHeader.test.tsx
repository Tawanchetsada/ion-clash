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

  it("มีทางไปหน้าตั้งค่าเสมอโดยไม่ต้องส่ง handler", () => {
    // ปุ่มตั้งค่าไม่ผ่าน prop เหมือนอีกสองปุ่ม เพราะถ้าต้องไล่ส่งทีละหน้า
    // จะมีวันที่ลืมสักหน้าแล้วผู้เล่นออกจากหน้านั้นไปปิดเสียงไม่ได้
    render(<AppHeader />);
    const link = screen.getByRole("link", { name: "ตั้งค่า" });
    expect(link).toHaveAttribute("href", "/settings");
  });

  it("ซ่อนปุ่มตั้งค่าได้เมื่อสั่ง", () => {
    render(<AppHeader hideSettings />);
    expect(screen.queryByRole("link", { name: "ตั้งค่า" })).not.toBeInTheDocument();
  });
});
