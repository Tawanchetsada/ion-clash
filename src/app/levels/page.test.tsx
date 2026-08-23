import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeStorage } from "../../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../../storage/repository";
import { SaveProvider } from "../../session/SaveProvider";
import LevelsPage from "./page";

const pushSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("Levels Page (/levels)", () => {
  beforeEach(() => {
    pushSpy.mockClear();
  });

  it("แสดงหัวข้อ สรุปความก้าวหน้า และ 50 ด่าน", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    render(
      <SaveProvider repository={repo}>
        <LevelsPage />
      </SaveProvider>,
    );

    expect(await screen.findByRole("heading", { name: "เลือกด่าน" })).toBeInTheDocument();
    expect(screen.getByText("0/50")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();

    // First level is unlocked and can be clicked
    const level1Btn = screen.getByRole("button", { name: /^ด่าน 01/ });
    expect(level1Btn).toBeInTheDocument();

    act(() => {
      level1Btn.click();
    });

    expect(pushSpy).toHaveBeenCalledWith("/level/1/intro");
  });
});
