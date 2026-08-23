import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CutPairList } from "./CutPairList";

describe("CutPairList", () => {
  it("ว่างเปล่าแสดงข้อความว่ายังไม่ได้ตัด", () => {
    render(<CutPairList pairLabelsTh={[]} />);
    expect(screen.getByText("ยังไม่ได้ตัดไอออนผู้ชมคู่ใด")).toBeInTheDocument();
  });

  it("มีคู่แล้วแสดงเป็นรายการข้อความ ไม่ใช่แค่ภาพเส้น", () => {
    render(<CutPairList pairLabelsTh={["ตัดแล้ว: โซเดียมไอออน ทั้งสองข้าง"]} />);
    expect(screen.getByRole("list", { name: "รายการไอออนผู้ชมที่ตัดแล้ว" })).toBeInTheDocument();
    expect(screen.getByText("ตัดแล้ว: โซเดียมไอออน ทั้งสองข้าง")).toBeInTheDocument();
  });
});
