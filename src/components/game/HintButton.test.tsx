import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HintButton } from "./HintButton";

describe("HintButton", () => {
  it("แสดงจำนวนครั้งที่เหลือจาก maxHints - hintsUsed", () => {
    render(<HintButton hintsUsed={1} maxHints={3} onUseHint={() => {}} />);
    expect(screen.getByRole("button")).toHaveTextContent("เหลือ 2 ครั้ง");
  });

  it("ใช้ครบโควตาแล้วกดไม่ได้ แม้ disabled ไม่ได้ถูกส่งมา", async () => {
    const onUseHint = vi.fn();
    const user = userEvent.setup();
    render(<HintButton hintsUsed={3} maxHints={3} onUseHint={onUseHint} />);
    await user.click(screen.getByRole("button"));
    expect(onUseHint).not.toHaveBeenCalled();
  });

  it("เพดานอ่านจาก maxHints ไม่ใช่เลข 3 ตายตัว", () => {
    render(<HintButton hintsUsed={0} maxHints={2} onUseHint={() => {}} />);
    expect(screen.getByRole("button")).toHaveTextContent("เหลือ 2 ครั้ง");
  });
});
