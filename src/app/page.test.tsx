import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeStorage } from "../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../storage/repository";
import { SaveProvider } from "../session/SaveProvider";
import Home from "./page";

const pushSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("Home Page (/) ", () => {
  beforeEach(() => {
    pushSpy.mockClear();
  });

  it("แสดงโลโก้และปุ่มเริ่มเกมสำหรับผู้เล่นใหม่ เมื่อกดเริ่มเกมจะเปิด Dialog กรอกชื่อ", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    render(
      <SaveProvider repository={repo}>
        <Home />
      </SaveProvider>,
    );

    // Initial render / wait for save to load
    expect(await screen.findByRole("heading", { name: "ION CLASH" })).toBeInTheDocument();
    expect(
      screen.getByText("เกมฝึกสร้างสมการไอออนิกสุทธิผ่านการ์ดแม่เหล็ก"),
    ).toBeInTheDocument();

    const startBtn = await screen.findByRole("button", { name: "เริ่มเกม" });
    act(() => {
      startBtn.click();
    });

    // Modal opens for player name
    expect(
      screen.getByRole("heading", { name: "ยินดีต้อนรับสู่ Ion Clash" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("* แนะนำให้ใช้ชื่อเล่นหรือรหัสนิสิต ไม่ต้องใส่ชื่อจริงเต็ม"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ยินยอมส่งข้อมูลผลการเรียนเพื่อการวิจัย", { exact: false }),
    ).toBeInTheDocument();
  });

  it("กรอกชื่อและยืนยันเพื่อบันทึกชื่อและความยินยอมลง save", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    render(
      <SaveProvider repository={repo}>
        <Home />
      </SaveProvider>,
    );

    const startBtn = await screen.findByRole("button", { name: "เริ่มเกม" });
    act(() => {
      startBtn.click();
    });

    const nameInput = screen.getByLabelText("ชื่อหรือรหัสผู้เรียน:");
    act(() => {
      fireEvent.change(nameInput, { target: { value: "S01" } });
    });

    const submitBtn = screen.getByRole("button", { name: "เข้าสู่เกม" });
    act(() => {
      fireEvent.click(submitBtn);
    });

    expect(pushSpy).toHaveBeenCalledWith("/levels");
    const saved = repo.load();
    expect(saved.playerName).toBe("S01");
    expect(saved.settings.researchConsent).toBe(true);
  });

  it("เมื่อมีข้อมูลผู้เรียนเดิม กดเริ่มเกมจะพาไปยังหน้าภาพรวมด่าน (/levels) ทันที", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });
    const initial = repo.load();
    repo.save({
      ...initial,
      playerName: "StudentA",
      unlockedLevel: 5,
      lastPlayedLevel: 4,
    });

    render(
      <SaveProvider repository={repo}>
        <Home />
      </SaveProvider>,
    );

    const startBtn = await screen.findByRole("button", {
      name: "เริ่มเกม",
    });
    expect(startBtn).toBeInTheDocument();

    act(() => {
      startBtn.click();
    });

    expect(pushSpy).toHaveBeenCalledWith("/levels");
  });
});
