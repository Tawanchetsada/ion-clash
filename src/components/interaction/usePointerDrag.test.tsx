import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlacementIntent, PlacementSource } from "./types";
import { usePointerDrag } from "./usePointerDrag";

function TestDragComponent({
  onIntent,
  source,
}: {
  onIntent: (intent: PlacementIntent) => void;
  source: PlacementSource;
}) {
  const { dragging, dragHandlersFor } = usePointerDrag({ onIntent });
  const handlers = dragHandlersFor(source);

  return (
    <div>
      <div
        data-testid="drag-source"
        style={{ touchAction: "none" }}
        onPointerDown={handlers.onPointerDown}
      >
        Drag Me
      </div>
      <div data-testid="slot-target" data-drop-target="slot" data-slot-id="L1:slot:0">
        Slot 0
      </div>
      <div data-testid="tray-target" data-drop-target="tray">
        Tray
      </div>
      <div data-testid="dragging-status">{dragging ? "dragging" : "idle"}</div>
    </div>
  );
}

describe("usePointerDrag", () => {
  const sourceCard: PlacementSource = {
    kind: "card",
    instanceId: "L1:react:a:cat",
  };

  beforeEach(() => {
    // Mock elementFromPoint in jsdom
    document.elementFromPoint = (x: number, y: number): Element | null => {
      if (x === 100 && y === 100) {
        return screen.getByTestId("slot-target");
      }
      if (x === 200 && y === 200) {
        return screen.getByTestId("tray-target");
      }
      return null;
    };

    // Mock setPointerCapture / releasePointerCapture on HTMLElement prototype
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  it("ขยับไม่เกิน 8px แล้วปล่อย จะไม่ถือว่าเป็นการลาก และไม่เรียก onIntent", () => {
    const onIntent = vi.fn();
    render(<TestDragComponent onIntent={onIntent} source={sourceCard} />);

    const dragSource = screen.getByTestId("drag-source");

    fireEvent.pointerDown(dragSource, {
      pointerId: 1,
      button: 0,
      clientX: 50,
      clientY: 50,
    });

    fireEvent.pointerMove(window, {
      pointerId: 1,
      clientX: 55,
      clientY: 50,
    });

    expect(screen.getByTestId("dragging-status")).toHaveTextContent("idle");

    fireEvent.pointerUp(window, {
      pointerId: 1,
      clientX: 55,
      clientY: 50,
    });

    expect(onIntent).not.toHaveBeenCalled();
    expect(screen.getByTestId("dragging-status")).toHaveTextContent("idle");
  });

  it("ขยับเกิน 8px แล้วปล่อยบน slot target จะส่ง place intent", () => {
    const onIntent = vi.fn();
    render(<TestDragComponent onIntent={onIntent} source={sourceCard} />);

    const dragSource = screen.getByTestId("drag-source");

    fireEvent.pointerDown(dragSource, {
      pointerId: 1,
      button: 0,
      clientX: 50,
      clientY: 50,
    });

    fireEvent.pointerMove(window, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });

    expect(screen.getByTestId("dragging-status")).toHaveTextContent("dragging");

    fireEvent.pointerUp(window, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });

    expect(onIntent).toHaveBeenCalledTimes(1);
    expect(onIntent).toHaveBeenCalledWith({
      kind: "place",
      instanceId: "L1:react:a:cat",
      slotId: "L1:slot:0",
    });
    expect(screen.getByTestId("dragging-status")).toHaveTextContent("idle");
  });

  it("เมื่อเกิด pointercancel ขณะลาก จะยกเลิกสถานะลากโดยไม่ส่ง intent", () => {
    const onIntent = vi.fn();
    render(<TestDragComponent onIntent={onIntent} source={sourceCard} />);

    const dragSource = screen.getByTestId("drag-source");

    fireEvent.pointerDown(dragSource, {
      pointerId: 1,
      button: 0,
      clientX: 50,
      clientY: 50,
    });

    fireEvent.pointerMove(window, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });

    expect(screen.getByTestId("dragging-status")).toHaveTextContent("dragging");

    fireEvent.pointerCancel(window, {
      pointerId: 1,
    });

    expect(onIntent).not.toHaveBeenCalled();
    expect(screen.getByTestId("dragging-status")).toHaveTextContent("idle");
  });
});
