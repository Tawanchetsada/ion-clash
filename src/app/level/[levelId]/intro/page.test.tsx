import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeStorage } from "../../../../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../../../../storage/repository";
import { SaveProvider } from "../../../../session/SaveProvider";
import { ToastProvider } from "../../../../session/ToastProvider";
import LevelIntroPage from "./page";

const pushSpy = vi.fn();
const replaceSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: replaceSpy,
    prefetch: vi.fn(),
  }),
  notFound: vi.fn(),
}));

describe("Level Intro Page (/level/[levelId]/intro)", () => {
  beforeEach(() => {
    pushSpy.mockClear();
    replaceSpy.mockClear();
  });

  it("ผู้เล่นที่ยังไม่ได้กรอกชื่อจะถูก redirect ไปยังหน้าแรก", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    render(
      <SaveProvider repository={repo}>
        <ToastProvider>
          <LevelIntroPage params={{ levelId: "1" }} />
        </ToastProvider>
      </SaveProvider>,
    );

    expect(replaceSpy).toHaveBeenCalledWith("/");
  });

  it("แสดงสารตั้งต้น 2 ชนิด และปุ่มเริ่มเล่นเกม", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    repo.save({
      ...repo.load(),
      playerName: "S01",
    });

    render(
      <SaveProvider repository={repo}>
        <ToastProvider>
          <LevelIntroPage params={{ levelId: "1" }} />
        </ToastProvider>
      </SaveProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "ปฏิกิริยาระหว่างสารละลายอิเล็กโทรไลต์",
      }),
    ).toBeInTheDocument();

    const startBtn = screen.getByRole("button", { name: "เริ่มเล่นเกม" });
    expect(startBtn).toBeInTheDocument();

    act(() => {
      startBtn.click();
    });

    expect(pushSpy).toHaveBeenCalledWith("/level/1/play");
  });

  it("เมื่อเปิดด่านที่ยังล็อกอยู่ จะถูก redirect ไป /levels พร้อม toast", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    repo.save({
      ...repo.load(),
      playerName: "S01",
    });

    render(
      <SaveProvider repository={repo}>
        <ToastProvider>
          <LevelIntroPage params={{ levelId: "25" }} />
        </ToastProvider>
      </SaveProvider>,
    );

    await screen.findByText("กำลังตรวจสอบข้อมูลด่าน…");

    expect(replaceSpy).toHaveBeenCalledWith("/levels");
  });
});
