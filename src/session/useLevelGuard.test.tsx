import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as levelsModule from "../data/levels";
import { createFakeStorage } from "../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../storage/repository";
import { SaveProvider } from "./SaveProvider";
import { ToastProvider, useToast } from "./ToastProvider";
import { useLevelGuard } from "./useLevelGuard";

describe("useLevelGuard", () => {
  it("คืน status: 'invalid' เมื่อ rawLevelId ไม่ใช่เลข 1-50", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SaveProvider repository={repo}>{children}</SaveProvider>
    );

    const { result: r1 } = renderHook(() => useLevelGuard("abc"), { wrapper });
    expect(r1.current.status).toBe("invalid");

    const { result: r2 } = renderHook(() => useLevelGuard("0"), { wrapper });
    expect(r2.current.status).toBe("invalid");

    const { result: r3 } = renderHook(() => useLevelGuard("99"), { wrapper });
    expect(r3.current.status).toBe("invalid");

    const { result: r4 } = renderHook(() => useLevelGuard("1.5"), { wrapper });
    expect(r4.current.status).toBe("invalid");
  });

  it("คืน status: 'locked' พร้อม requiredLevel เมื่อด่านยังไม่ปลดล็อก", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SaveProvider repository={repo}>{children}</SaveProvider>
    );

    const { result } = renderHook(() => useLevelGuard("25"), { wrapper });
    expect(result.current).toEqual({
      status: "locked",
      requiredLevel: 24,
    });
  });

  it("คืน status: 'ok' พร้อม level เมื่อด่านปลดล็อกแล้ว", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SaveProvider repository={repo}>{children}</SaveProvider>
    );

    const { result } = renderHook(() => useLevelGuard("1"), { wrapper });
    expect(result.current.status).toBe("ok");
    if (result.current.status === "ok") {
      expect(result.current.level.id).toBe(1);
    }
  });

  it("คืน status: 'broken' เมื่อ getLevel โยน error", () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    const spy = vi.spyOn(levelsModule, "getLevel").mockImplementation(() => {
      throw new Error("LEVEL_CORRUPT");
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SaveProvider repository={repo}>{children}</SaveProvider>
    );

    const { result } = renderHook(() => useLevelGuard("1"), { wrapper });
    expect(result.current).toEqual({
      status: "broken",
      code: "LEVEL_CORRUPT",
    });

    spy.mockRestore();
  });
});

describe("ToastProvider", () => {
  it("แสดง toast และปิดได้", () => {
    function TestComponent() {
      const { show } = useToast();
      return (
        <button type="button" onClick={() => show("ข้อความแจ้งเตือนทดสอบ")}>
          แสดง Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("แสดง Toast").click();
    });

    expect(screen.getByText("ข้อความแจ้งเตือนทดสอบ")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", {
      name: "ปิดข้อความแจ้งเตือน",
    });
    act(() => {
      closeBtn.click();
    });

    expect(
      screen.queryByText("ข้อความแจ้งเตือนทดสอบ"),
    ).not.toBeInTheDocument();
  });
});
