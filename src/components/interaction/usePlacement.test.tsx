import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlacementSource, PlacementTarget } from "./types";
import { usePlacement } from "./usePlacement";

describe("usePlacement", () => {
  const cardSourceA: PlacementSource = {
    kind: "card",
    instanceId: "L1:react:a:cat",
  };

  const cardSourceB: PlacementSource = {
    kind: "card",
    instanceId: "L1:react:a:ani",
  };

  const slotTarget0: PlacementTarget = {
    kind: "slot",
    slotId: "L1:slot:0",
  };

  const slotSource0: PlacementSource = {
    kind: "slot",
    slotId: "L1:slot:0",
    instanceId: "L1:react:a:cat",
  };

  const trayTarget: PlacementTarget = {
    kind: "tray",
  };

  it("toggleHold บนตัวที่ยังไม่ถือ จะทำให้กลายเป็นตัวที่ถูกถือ", () => {
    const onIntent = vi.fn();
    const { result } = renderHook(() => usePlacement({ onIntent }));

    expect(result.current.held).toBeNull();
    expect(result.current.isHeld(cardSourceA)).toBe(false);

    act(() => {
      result.current.toggleHold(cardSourceA);
    });

    expect(result.current.held).toEqual(cardSourceA);
    expect(result.current.isHeld(cardSourceA)).toBe(true);
  });

  it("toggleHold บนตัวที่ถืออยู่แล้ว จะเป็นการปล่อย (ยกเลิกการถือ)", () => {
    const onIntent = vi.fn();
    const { result } = renderHook(() => usePlacement({ onIntent }));

    act(() => {
      result.current.toggleHold(cardSourceA);
    });
    expect(result.current.isHeld(cardSourceA)).toBe(true);

    act(() => {
      result.current.toggleHold(cardSourceA);
    });
    expect(result.current.held).toBeNull();
    expect(result.current.isHeld(cardSourceA)).toBe(false);
  });

  it("toggleHold ตัวใหม่ขณะถือตัวเก่า จะเปลี่ยนไปถือตัวใหม่", () => {
    const onIntent = vi.fn();
    const { result } = renderHook(() => usePlacement({ onIntent }));

    act(() => {
      result.current.toggleHold(cardSourceA);
    });
    expect(result.current.isHeld(cardSourceA)).toBe(true);

    act(() => {
      result.current.toggleHold(cardSourceB);
    });
    expect(result.current.isHeld(cardSourceA)).toBe(false);
    expect(result.current.isHeld(cardSourceB)).toBe(true);
    expect(result.current.held).toEqual(cardSourceB);
  });

  it("activateTarget ขณะไม่ได้ถืออะไร จะไม่เกิดอะไรขึ้นและไม่เรียก onIntent", () => {
    const onIntent = vi.fn();
    const { result } = renderHook(() => usePlacement({ onIntent }));

    act(() => {
      result.current.activateTarget(slotTarget0);
    });

    expect(onIntent).not.toHaveBeenCalled();
    expect(result.current.held).toBeNull();
  });

  it("activateTarget ขณะถือการ์ด จะส่ง place intent และล้าง held", () => {
    const onIntent = vi.fn();
    const { result } = renderHook(() => usePlacement({ onIntent }));

    act(() => {
      result.current.toggleHold(cardSourceA);
    });

    act(() => {
      result.current.activateTarget(slotTarget0);
    });

    expect(onIntent).toHaveBeenCalledTimes(1);
    expect(onIntent).toHaveBeenCalledWith({
      kind: "place",
      instanceId: "L1:react:a:cat",
      slotId: "L1:slot:0",
    });
    expect(result.current.held).toBeNull();
  });

  it("activateTarget บน tray ขณะถือการ์ดใน slot จะส่ง remove intent", () => {
    const onIntent = vi.fn();
    const { result } = renderHook(() => usePlacement({ onIntent }));

    act(() => {
      result.current.toggleHold(slotSource0);
    });

    act(() => {
      result.current.activateTarget(trayTarget);
    });

    expect(onIntent).toHaveBeenCalledWith({
      kind: "remove",
      slotId: "L1:slot:0",
    });
    expect(result.current.held).toBeNull();
  });

  it("cancel() ล้างสถานะ held", () => {
    const onIntent = vi.fn();
    const { result } = renderHook(() => usePlacement({ onIntent }));

    act(() => {
      result.current.toggleHold(cardSourceA);
    });
    expect(result.current.held).toEqual(cardSourceA);

    act(() => {
      result.current.cancel();
    });
    expect(result.current.held).toBeNull();
  });

  it("เมื่อ disabled: true จะไม่เปลี่ยนสถานะและไม่เรียก onIntent", () => {
    const onIntent = vi.fn();
    const { result } = renderHook(() => usePlacement({ onIntent, disabled: true }));

    act(() => {
      result.current.toggleHold(cardSourceA);
    });
    expect(result.current.held).toBeNull();
    expect(result.current.isHeld(cardSourceA)).toBe(false);

    act(() => {
      result.current.activateTarget(slotTarget0);
    });
    expect(onIntent).not.toHaveBeenCalled();
  });

  it("targetPropsFor สร้าง attributes ถูกต้อง", () => {
    const onIntent = vi.fn();
    const { result } = renderHook(() => usePlacement({ onIntent }));

    expect(result.current.targetPropsFor(slotTarget0)).toEqual({
      "data-drop-target": "slot",
      "data-slot-id": "L1:slot:0",
    });

    expect(result.current.targetPropsFor(trayTarget)).toEqual({
      "data-drop-target": "tray",
    });
  });
});
