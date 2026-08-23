import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SpectatorConnector } from "./SpectatorConnector";

describe("SpectatorConnector", () => {
  beforeEach(() => {
    // Mock requestAnimationFrame to run immediately
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  it("วาดเส้นตรง <line> เมื่อการ์ดสองใบอยู่แถวเดียวกัน", () => {
    const containerEl = document.createElement("div");
    vi.spyOn(containerEl, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 100,
      right: 500,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const cardLeftEl = document.createElement("div");
    vi.spyOn(cardLeftEl, "getBoundingClientRect").mockReturnValue({
      left: 50,
      top: 20,
      width: 60,
      height: 40,
      right: 110,
      bottom: 60,
      x: 50,
      y: 20,
      toJSON: () => {},
    });

    const cardRightEl = document.createElement("div");
    vi.spyOn(cardRightEl, "getBoundingClientRect").mockReturnValue({
      left: 200,
      top: 20,
      width: 60,
      height: 40,
      right: 260,
      bottom: 60,
      x: 200,
      y: 20,
      toJSON: () => {},
    });

    const containerRef = { current: containerEl };
    const cardRefs = {
      current: new Map([
        ["L1:left:1", cardLeftEl],
        ["L1:right:1", cardRightEl],
      ]),
    };

    const { container } = render(
      <SpectatorConnector
        containerRef={containerRef}
        cardRefs={cardRefs}
        pairs={[{ leftInstanceId: "L1:left:1", rightInstanceId: "L1:right:1" }]}
      />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");

    const line = container.querySelector("line");
    expect(line).toBeInTheDocument();
    expect(line).toHaveAttribute("x1", "80"); // 50 + 30
    expect(line).toHaveAttribute("y1", "40"); // 20 + 20
    expect(line).toHaveAttribute("x2", "230"); // 200 + 30
    expect(line).toHaveAttribute("y2", "40"); // 20 + 20
  });

  it("วาดเส้นโค้ง <path> เมื่อการ์ดสองใบอยู่คนละแถว (top ต่างกันมาก)", () => {
    const containerEl = document.createElement("div");
    vi.spyOn(containerEl, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 200,
      right: 500,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const cardLeftEl = document.createElement("div");
    vi.spyOn(cardLeftEl, "getBoundingClientRect").mockReturnValue({
      left: 50,
      top: 20,
      width: 60,
      height: 40,
      right: 110,
      bottom: 60,
      x: 50,
      y: 20,
      toJSON: () => {},
    });

    const cardRightEl = document.createElement("div");
    vi.spyOn(cardRightEl, "getBoundingClientRect").mockReturnValue({
      left: 200,
      top: 100, // คนละบรรทัด (top ต่างกัน 80px > 20px)
      width: 60,
      height: 40,
      right: 260,
      bottom: 140,
      x: 200,
      y: 100,
      toJSON: () => {},
    });

    const containerRef = { current: containerEl };
    const cardRefs = {
      current: new Map([
        ["L1:left:1", cardLeftEl],
        ["L1:right:1", cardRightEl],
      ]),
    };

    const { container } = render(
      <SpectatorConnector
        containerRef={containerRef}
        cardRefs={cardRefs}
        pairs={[{ leftInstanceId: "L1:left:1", rightInstanceId: "L1:right:1" }]}
      />,
    );

    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute("d")).toContain("M 80 40 C");
  });

  it("ไม่ throw และไม่วาดเส้นเมื่อหา element ของการ์ดไม่เจอ", () => {
    const containerRef = { current: document.createElement("div") };
    const cardRefs = { current: new Map() };

    const { container } = render(
      <SpectatorConnector
        containerRef={containerRef}
        cardRefs={cardRefs}
        pairs={[{ leftInstanceId: "L1:left:missing", rightInstanceId: "L1:right:missing" }]}
      />,
    );

    expect(container.querySelector("svg")).toBeNull();
  });
});
