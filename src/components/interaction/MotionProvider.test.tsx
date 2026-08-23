import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MotionProvider, useMotionEnabled } from "./MotionProvider";

describe("MotionProvider", () => {
  beforeEach(() => {
    // Default mock: prefers-reduced-motion is false
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("เมื่อ enabled: true และ OS ไม่ได้เปิด reduced motion จะได้ motionEnabled = true", () => {
    const { result } = renderHook(() => useMotionEnabled(), {
      wrapper: ({ children }) => <MotionProvider enabled={true}>{children}</MotionProvider>,
    });

    expect(result.current).toBe(true);
  });

  it("เมื่อ prop enabled: false จะได้ motionEnabled = false แม้ OS อนุญาต", () => {
    const { result } = renderHook(() => useMotionEnabled(), {
      wrapper: ({ children }) => <MotionProvider enabled={false}>{children}</MotionProvider>,
    });

    expect(result.current).toBe(false);
  });

  it("เมื่อ OS เปิด prefers-reduced-motion จะได้ motionEnabled = false แม้ prop enabled = true", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true, // OS prefers reduced motion
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMotionEnabled(), {
      wrapper: ({ children }) => <MotionProvider enabled={true}>{children}</MotionProvider>,
    });

    expect(result.current).toBe(false);
  });
});
