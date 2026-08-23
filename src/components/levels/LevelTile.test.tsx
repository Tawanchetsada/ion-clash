import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LevelTile } from "./LevelTile";
import type { LevelTileView } from "../../presentation/levels";

describe("LevelTile", () => {
  it("สามสถานะแยกกันด้วยข้อความ ไม่ใช่แค่สี", () => {
    const cases: LevelTileView[] = [
      { levelId: 1, status: "completed", statusLabelTh: "ผ่านแล้ว", stars: 3 },
      { levelId: 2, status: "current", statusLabelTh: "ด่านปัจจุบัน", stars: 0 },
      { levelId: 3, status: "locked", statusLabelTh: "ยังไม่ปลดล็อก", stars: 0 },
    ];

    for (const view of cases) {
      const { unmount } = render(<LevelTile view={view} />);
      expect(screen.getByRole("button")).toHaveAccessibleName(
        expect.stringContaining(view.statusLabelTh),
      );
      unmount();
    }
  });

  it("ด่านล็อกกดไม่ได้", async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(
      <LevelTile
        view={{ levelId: 5, status: "locked", statusLabelTh: "ยังไม่ปลดล็อก", stars: 0 }}
        onOpen={onOpen}
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("ด่านที่ปลดล็อกแล้วกดได้และเรียก onOpen", async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(
      <LevelTile
        view={{ levelId: 4, status: "current", statusLabelTh: "ด่านปัจจุบัน", stars: 0 }}
        onOpen={onOpen}
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("ใช้ไอคอน SVG ไม่ใช่อิโมจิ และไม่มีข้อความสถานะบนหน้ากระเบื้อง", () => {
    // อิโมจิหน้าตาต่างกันคนละ OS และ screen reader อ่านชื่ออิโมจิผิดบริบท
    // ส่วนข้อความสถานะทำให้กระเบื้องกว้างจนเรียงไม่ครบ 10 ใบต่อแถวที่ 390px
    const { container } = render(
      <LevelTile
        view={{ levelId: 7, status: "locked", statusLabelTh: "ยังไม่ปลดล็อก", stars: 0 }}
      />,
    );
    const button = screen.getByRole("button");
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(button.textContent).not.toContain("ยังไม่ปลดล็อก");
    expect(button.textContent ?? "").not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    // ข้อความยังอยู่ครบในชื่อที่ screen reader อ่าน
    expect(button).toHaveAccessibleName(expect.stringContaining("ยังไม่ปลดล็อก"));
  });
});
