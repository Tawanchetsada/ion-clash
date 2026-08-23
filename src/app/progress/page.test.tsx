import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeStorage } from "../../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../../storage/repository";
import { SaveProvider } from "../../session/SaveProvider";
import { ToastProvider } from "../../session/ToastProvider";
import ProgressPage from "./page";

const pushSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("Progress Page (/progress)", () => {
  beforeEach(() => {
    pushSpy.mockClear();
  });

  it("แสดงสรุปความก้าวหน้า ปุ่ม export, import, และ reset", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    const initial = repo.load();
    repo.save({
      ...initial,
      playerName: "StudentB",
      unlockedLevel: 3,
      completedLevels: {
        "1": {
          completed: true,
          bestScore: 100,
          stars: 3,
          bestTimeMs: 12000,
          attempts: 1,
          completedAt: new Date().toISOString(),
        },
      },
    });

    render(
      <SaveProvider repository={repo}>
        <ToastProvider>
          <ProgressPage />
        </ToastProvider>
      </SaveProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "ความก้าวหน้าและการจัดการข้อมูล",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("StudentB")).toBeInTheDocument();
    expect(screen.getByText("1 / 50")).toBeInTheDocument();
    expect(screen.getByText("ดาวรวม").parentElement).toHaveTextContent("3");
    expect(screen.getByText("100")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "ส่งออกข้อมูล (Export JSON)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "นำเข้าข้อมูล (Import JSON)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "รีเซ็ตข้อมูลทั้งหมด" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /คัดลอกผลการเรียน \(TSV\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ดาวน์โหลด CSV/ }),
    ).toBeInTheDocument();
  });

  it("แสดงแบนเนอร์ยินดีด้วยเมื่อผ่านด่าน 50", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    const initial = repo.load();
    repo.save({
      ...initial,
      playerName: "Winner",
      completedLevels: {
        "50": {
          completed: true,
          bestScore: 100,
          stars: 3,
          bestTimeMs: 20000,
          attempts: 1,
          completedAt: new Date().toISOString(),
        },
      },
    });

    render(
      <SaveProvider repository={repo}>
        <ToastProvider>
          <ProgressPage />
        </ToastProvider>
      </SaveProvider>,
    );

    expect(
      await screen.findByText("ยินดีด้วย! คุณผ่านครบทั้ง 50 ด่านของ Ion Clash แล้ว", {
        exact: false,
      }),
    ).toBeInTheDocument();
  });
});
