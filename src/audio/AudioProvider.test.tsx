import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioProvider, useAudio } from "./AudioProvider";

const playMock = vi.fn();
const unlockMock = vi.fn();
const preloadMock = vi.fn().mockResolvedValue(undefined);

vi.mock("./engine", () => ({
  AudioEngine: class FakeAudioEngine {
    play = playMock;
    unlock = unlockMock;
    preload = preloadMock;
  },
}));

function Harness() {
  const audio = useAudio();
  return (
    <>
      <button onClick={() => audio.play("correct")}>เล่นเสียง</button>
      <button onClick={() => audio.unlock()}>ปลดล็อกเสียง</button>
    </>
  );
}

function Bare() {
  useAudio();
  return null;
}

beforeEach(() => {
  playMock.mockClear();
  unlockMock.mockClear();
  preloadMock.mockClear();
});

describe("AudioProvider", () => {
  it("useAudio นอก AudioProvider throw ทันที", () => {
    expect(() => render(<Bare />)).toThrow("useAudio ต้องอยู่ใต้ AudioProvider");
  });

  it("preload ถูกเรียกตอน mount เมื่อ enabled: true", () => {
    render(
      <AudioProvider enabled>
        <Harness />
      </AudioProvider>,
    );
    expect(preloadMock).toHaveBeenCalledOnce();
  });

  it("ไม่ preload เมื่อ enabled: false — ไม่โหลดเสียงถ้าผู้เล่นปิดไว้", () => {
    render(
      <AudioProvider enabled={false}>
        <Harness />
      </AudioProvider>,
    );
    expect(preloadMock).not.toHaveBeenCalled();
  });

  it("play() ส่ง enabled flag ปัจจุบันไปยัง engine เสมอ", async () => {
    const user = userEvent.setup();
    render(
      <AudioProvider enabled={false}>
        <Harness />
      </AudioProvider>,
    );
    await user.click(screen.getByRole("button", { name: "เล่นเสียง" }));
    expect(playMock).toHaveBeenCalledWith("correct", { enabled: false });
  });

  it("unlock() เรียก engine.unlock() ตรง ๆ", async () => {
    const user = userEvent.setup();
    render(
      <AudioProvider enabled>
        <Harness />
      </AudioProvider>,
    );
    await user.click(screen.getByRole("button", { name: "ปลดล็อกเสียง" }));
    expect(unlockMock).toHaveBeenCalledOnce();
  });
});
