import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Panel } from "./Panel";
import { Pill } from "./Pill";
import { VisuallyHidden } from "./VisuallyHidden";

describe("Panel", () => {
  it("render children ได้", () => {
    render(<Panel>เนื้อหา</Panel>);
    expect(screen.getByText("เนื้อหา")).toBeInTheDocument();
  });
});

describe("Pill", () => {
  it("render ข้อความและรับ tone ได้ทุกแบบ", () => {
    render(<Pill tone="gold">3/50</Pill>);
    expect(screen.getByText("3/50")).toBeInTheDocument();
  });
});

describe("VisuallyHidden", () => {
  it("ข้อความอยู่ใน DOM แต่ซ่อนทางสายตาด้วย sr-only", () => {
    render(<VisuallyHidden>อ่านได้เฉพาะ screen reader</VisuallyHidden>);
    const node = screen.getByText("อ่านได้เฉพาะ screen reader");
    expect(node).toHaveClass("sr-only");
  });
});
