import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoefficientInput } from "./CoefficientInput";

describe("CoefficientInput", () => {
  it("เริ่มต้นเป็นช่องว่างเสมอ ไม่เติม 1 ให้ล่วงหน้า", () => {
    render(<CoefficientInput value={null} compoundLabelTh="AgCl" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("มี label ผูกกับ input จริง", () => {
    render(<CoefficientInput value={null} compoundLabelTh="AgCl" onChange={() => {}} />);
    expect(screen.getByLabelText("สัมประสิทธิ์หน้า AgCl")).toBeInTheDocument();
  });

  it("รับเลข 1-9 หลักเดียว", () => {
    const onChange = vi.fn();
    render(<CoefficientInput value={null} compoundLabelTh="AgCl" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "2" } });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("ลบจนว่างแล้วส่ง null", () => {
    const onChange = vi.fn();
    render(<CoefficientInput value={2} compoundLabelTh="AgCl" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it.each(["0", "2.5", "-1", "abc", "10"])("ปฏิเสธค่า %s ไม่เรียก onChange", (invalid) => {
    const onChange = vi.fn();
    render(<CoefficientInput value={null} compoundLabelTh="AgCl" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: invalid } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("errorTh แสดงผ่าน role=alert และผูกกับ input ด้วย aria-describedby", () => {
    render(
      <CoefficientInput
        value={2}
        compoundLabelTh="AgCl"
        errorTh="อัตราส่วนยังไม่ต่ำสุด"
        onChange={() => {}}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("อัตราส่วนยังไม่ต่ำสุด");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-describedby", alert.id);
  });
});
