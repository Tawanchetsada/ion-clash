import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeStorage } from "../../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../../storage/repository";
import { SaveProvider } from "../../session/SaveProvider";
import { ToastProvider } from "../../session/ToastProvider";
import SettingsPage from "./page";

const pushSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("Settings Page (/settings)", () => {
  beforeEach(() => {
    pushSpy.mockClear();
  });

  it("แสดงข้อมูลผู้เรียนเป็นแบบอ่านอย่างเดียวและมีปุ่มเล่นใหม่ด้วยชื่อใหม่", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    repo.save({
      ...repo.load(),
      playerName: "S01",
    });

    render(
      <SaveProvider repository={repo}>
        <ToastProvider>
          <SettingsPage />
        </ToastProvider>
      </SaveProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "การตั้งค่า" }),
    ).toBeInTheDocument();

    expect(screen.getByText("S01")).toBeInTheDocument();
    expect(screen.getByText("ไม่สามารถแก้ไขชื่อได้")).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: "เล่นใหม่ด้วยชื่อใหม่" });
    expect(resetBtn).toBeInTheDocument();

    act(() => {
      resetBtn.click();
    });

    expect(
      screen.getByRole("heading", { name: "เริ่มเล่นใหม่ด้วยชื่อใหม่หรือไม่?" }),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: "ยืนยันและเริ่มใหม่" });
    act(() => {
      confirmBtn.click();
    });

    expect(pushSpy).toHaveBeenCalledWith("/");
    const saved = repo.load();
    expect(saved.playerName).toBe("");
  });

  it("เปลี่ยนการตั้งค่าความยินยอมวิจัยและบันทึกลง save", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    repo.save({
      ...repo.load(),
      settings: {
        sound: true,
        music: false,
        reducedMotion: false,
        researchConsent: false,
      },
    });

    render(
      <SaveProvider repository={repo}>
        <ToastProvider>
          <SettingsPage />
        </ToastProvider>
      </SaveProvider>,
    );

    const musicSwitch = screen.getByRole("switch", { name: "เปิดปิดเพลงพื้นหลัง" });
    const consentSwitch = screen.getByRole("switch", { name: "เปิดปิดการยินยอมส่งข้อมูลวิจัย" });
    expect(consentSwitch).toBeDefined();
    expect(consentSwitch.getAttribute("aria-checked")).toBe("false");

    act(() => {
      fireEvent.click(consentSwitch);
    });

    expect(consentSwitch.getAttribute("aria-checked")).toBe("true");
    let saved = repo.load();
    expect(saved.settings.researchConsent).toBe(true);

    // ทดสอบเปิดเพลงพื้นหลัง
    expect(musicSwitch.getAttribute("aria-checked")).toBe("false");
    act(() => {
      fireEvent.click(musicSwitch);
    });
    expect(musicSwitch.getAttribute("aria-checked")).toBe("true");
    saved = repo.load();
    expect(saved.settings.music).toBe(true);
  });
});
