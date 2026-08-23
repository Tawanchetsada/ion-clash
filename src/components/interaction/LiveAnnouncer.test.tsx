import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnnouncerProvider, useAnnouncer } from "./LiveAnnouncer";

function TestAnnounceComponent({ message }: { message: string }) {
  const { announce } = useAnnouncer();
  return (
    <button type="button" onClick={() => announce(message)}>
      ประกาศ
    </button>
  );
}

describe("LiveAnnouncer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("แสดงสถานะ role=status และ aria-live=polite", () => {
    render(
      <AnnouncerProvider>
        <div>เนื้อหา</div>
      </AnnouncerProvider>,
    );

    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toBeInTheDocument();
    expect(statusRegion).toHaveAttribute("aria-live", "polite");
  });

  it("เมื่อเรียก announce จะอัปเดตข้อความใน status region", () => {
    render(
      <AnnouncerProvider>
        <TestAnnounceComponent message="วางไอออนเงินในช่องที่ 1 แล้ว" />
      </AnnouncerProvider>,
    );

    const button = screen.getByRole("button", { name: "ประกาศ" });
    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toHaveTextContent("วางไอออนเงินในช่องที่ 1 แล้ว");
  });
});
