import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioProvider } from "../../../../audio/AudioProvider";
import { AnnouncerProvider } from "../../../../components/interaction/LiveAnnouncer";
import { MotionProvider } from "../../../../components/interaction/MotionProvider";
import { createFakeStorage } from "../../../../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../../../../storage/repository";
import { SaveProvider } from "../../../../session/SaveProvider";
import { ToastProvider } from "../../../../session/ToastProvider";
import PlayPage from "./page";

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

describe("Play Page (/level/[levelId]/play)", () => {
  beforeEach(() => {
    pushSpy.mockClear();
    replaceSpy.mockClear();
  });

  it("ผู้เล่นที่ยังไม่ได้กรอกชื่อจะถูก redirect ไปยังหน้าแรก", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    render(
      <SaveProvider repository={repo}>
        <AudioProvider enabled={false}>
          <MotionProvider enabled={false}>
            <AnnouncerProvider>
              <ToastProvider>
                <PlayPage params={{ levelId: "1" }} />
              </ToastProvider>
            </AnnouncerProvider>
          </MotionProvider>
        </AudioProvider>
      </SaveProvider>,
    );

    expect(replaceSpy).toHaveBeenCalledWith("/");
  });

  it("render ด่าน 1 ใน Step 1 และกดเริ่มเพื่อแตกตัวสารตั้งต้นได้", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    repo.save({
      ...repo.load(),
      playerName: "S01",
    });

    render(
      <SaveProvider repository={repo}>
        <AudioProvider enabled={false}>
          <MotionProvider enabled={false}>
            <AnnouncerProvider>
              <ToastProvider>
                <PlayPage params={{ levelId: "1" }} />
              </ToastProvider>
            </AnnouncerProvider>
          </MotionProvider>
        </AudioProvider>
      </SaveProvider>,
    );

    // Initial step 1
    expect(
      await screen.findByRole("heading", {
        name: "ขั้นที่ 1 · แตกตัวสารตั้งต้นเป็นไอออน",
      }),
    ).toBeInTheDocument();

    const startBtn = screen.getByRole("button", { name: "เริ่มแยกไอออน" });
    expect(startBtn).toBeInTheDocument();

    act(() => {
      startBtn.click();
    });

    expect(
      screen.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน" }),
    ).toBeInTheDocument();
  });

  it("เมื่อเปิดด่านที่ยังล็อกอยู่ จะถูก redirect ไป /levels", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    repo.save({
      ...repo.load(),
      playerName: "S01",
    });

    render(
      <SaveProvider repository={repo}>
        <AudioProvider enabled={false}>
          <MotionProvider enabled={false}>
            <AnnouncerProvider>
              <ToastProvider>
                <PlayPage params={{ levelId: "25" }} />
              </ToastProvider>
            </AnnouncerProvider>
          </MotionProvider>
        </AudioProvider>
      </SaveProvider>,
    );

    await screen.findByText("กำลังตรวจสอบข้อมูลด่าน…");
    expect(replaceSpy).toHaveBeenCalledWith("/levels");
  });

  it("สามารถเปิดแผงดูกฎการละลายได้โดยไม่หักคะแนน", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    repo.save({
      ...repo.load(),
      playerName: "S01",
    });

    render(
      <SaveProvider repository={repo}>
        <AudioProvider enabled={false}>
          <MotionProvider enabled={false}>
            <AnnouncerProvider>
              <ToastProvider>
                <PlayPage params={{ levelId: "1" }} />
              </ToastProvider>
            </AnnouncerProvider>
          </MotionProvider>
        </AudioProvider>
      </SaveProvider>,
    );

    const rulesBtn = await screen.findByRole("button", { name: "ดูกฎการละลาย" });
    expect(rulesBtn).toBeInTheDocument();

    act(() => {
      rulesBtn.click();
    });

    expect(screen.getByRole("dialog", { name: "ดูกฎการละลาย" })).toBeInTheDocument();
    expect(screen.getByText("ข้อ 1 — เกลือของ Na⁺, K⁺ และ NH₄⁺")).toBeInTheDocument();
    expect(screen.getByText("จำให้แม่น")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "ปิด" });
    act(() => {
      closeBtn.click();
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
