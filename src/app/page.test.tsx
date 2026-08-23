import { act, render, screen } from "@testing-library/react";
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
      screen.getByText("แยกไอออน • สร้างตะกอน • ตัดไอออนผู้ชม"),
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
  });

  it("แสดงปุ่มเล่นต่อด่าน XX เมื่อมีข้อมูลการเล่นเดิม", async () => {
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

    const continueBtn = await screen.findByRole("button", {
      name: "เล่นต่อด่าน 4",
    });
    expect(continueBtn).toBeInTheDocument();

    act(() => {
      continueBtn.click();
    });

    expect(pushSpy).toHaveBeenCalledWith("/level/4/intro");
  });
});
