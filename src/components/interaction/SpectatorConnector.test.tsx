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

  it("อ้อมขึ้นด้านบนของการ์ด ไม่ลากตรงผ่ากลางแถว", () => {
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

    // ห้ามมีเส้นตรงอีกต่อไป — เส้นตรงจะพาดทับการ์ดทุกใบที่ขวางอยู่ระหว่างทาง
    // รวมทั้งการ์ดตะกอนซึ่งห้ามตัด (เอกสาร UI หน้า 10 วาดเป็นเส้นอ้อม)
    expect(container.querySelector("line")).toBeNull();

    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();

    // คู่แรก (index 0) อ้อมด้านบน จึงเริ่มที่ขอบบนของการ์ด (top = 20) ไม่ใช่กลางใบ
    // และจุดควบคุมต้องอยู่เหนือขึ้นไปอีก (ค่า y ติดลบเทียบกับ 20)
    expect(path?.getAttribute("d")).toContain("M 80 20 C");
    expect(path?.getAttribute("d")).toContain("80 2,");

    // มีจุดปลายทั้งสองข้างตามเอกสาร UI
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("คู่ที่สองอ้อมด้านล่าง เพื่อไม่ให้เส้นสองเส้นทับกัน", () => {
    const containerEl = document.createElement("div");
    vi.spyOn(containerEl, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 500, height: 100, right: 500, bottom: 100, x: 0, y: 0,
      toJSON: () => {},
    });

    const makeCard = (left: number) => {
      const el = document.createElement("div");
      vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
        left, top: 20, width: 60, height: 40, right: left + 60, bottom: 60, x: left, y: 20,
        toJSON: () => {},
      });
      return el;
    };

    const containerRef = { current: containerEl };
    const cardRefs = {
      current: new Map([
        ["a1", makeCard(10)],
        ["b1", makeCard(100)],
        ["a2", makeCard(200)],
        ["b2", makeCard(300)],
      ]),
    };

    const { container } = render(
      <SpectatorConnector
        containerRef={containerRef}
        cardRefs={cardRefs}
        pairs={[
          { leftInstanceId: "a1", rightInstanceId: "b1" },
          { leftInstanceId: "a2", rightInstanceId: "b2" },
        ]}
      />,
    );

    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    // คู่แรกเริ่มที่ขอบบน (y = 20) คู่ที่สองเริ่มที่ขอบล่าง (y = 60)
    expect(paths[0]?.getAttribute("d")).toContain("M 40 20 C");
    expect(paths[1]?.getAttribute("d")).toContain("M 230 60 C");
  });

  it("อ้อมไกลขึ้นเมื่อการ์ดสองใบขึ้นบรรทัดใหม่คนละแถว", () => {
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
    // เริ่มที่ขอบบนของการ์ดซ้าย (20) ไปจบที่ขอบบนของการ์ดขวา (100)
    expect(path?.getAttribute("d")).toContain("M 80 20 C");
    expect(path?.getAttribute("d")).toContain("230 26");
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
