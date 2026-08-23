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

  it("แสดงการตั้งค่าและแก้ไขชื่อผู้เรียนได้", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

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

    const nameInput = screen.getByPlaceholderText("เช่น S01 หรือชื่อเล่น");
    expect(nameInput).toBeInTheDocument();

    const saveBtn = screen.getByRole("button", { name: "บันทึก" });
    expect(saveBtn).toBeInTheDocument();

    expect(
      screen.getByText("ยินยอมส่งข้อมูลวิจัย (Research Data Consent)"),
    ).toBeInTheDocument();
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

    const switches = await screen.findAllByRole("switch");
    const consentSwitch = switches[3];
    expect(consentSwitch).toBeDefined();
    expect(consentSwitch?.getAttribute("aria-checked")).toBe("false");

    act(() => {
      fireEvent.click(consentSwitch!);
    });

    expect(consentSwitch?.getAttribute("aria-checked")).toBe("true");
    const saved = repo.load();
    expect(saved.settings.researchConsent).toBe(true);
  });
});
