import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeedbackPanel } from "./FeedbackPanel";

describe("FeedbackPanel", () => {
  it("feedback เป็น null ไม่ render อะไรเลย", () => {
    const { container } = render(<FeedbackPanel feedback={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("error ใช้ role=alert", () => {
    render(
      <FeedbackPanel
        feedback={{ kind: "error", code: "E-CHARGE", messageTh: "ประจุรวมยังไม่เป็นศูนย์" }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("ประจุรวมยังไม่เป็นศูนย์");
  });

  it("success ใช้ role=status ไม่ใช่ alert", () => {
    render(<FeedbackPanel feedback={{ kind: "success", code: null, messageTh: "ถูกต้อง!" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("ถูกต้อง!");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("เรียก onDismiss เมื่อกดปุ่มกากบาท", () => {
    let dismissed = false;
    render(
      <FeedbackPanel
        feedback={{ kind: "success", code: null, messageTh: "ถูกต้อง!" }}
        onDismiss={() => {
          dismissed = true;
        }}
      />,
    );
    const closeBtn = screen.getByRole("button", { name: "ปิดการแจ้งเตือน" });
    act(() => {
      closeBtn.click();
    });
    expect(dismissed).toBe(true);
  });
});

