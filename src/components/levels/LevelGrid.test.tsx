import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSave } from "../../storage/defaults";
import { levelGridView } from "../../presentation/levels";
import { LevelGrid } from "./LevelGrid";

describe("LevelGrid", () => {
  it("render ครบ 50 ปุ่มด่าน จัดกลุ่มตามความยาก", () => {
    const save = createDefaultSave({ now: () => new Date("2026-01-01T00:00:00Z") });
    render(<LevelGrid groups={levelGridView(save)} onOpenLevel={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(50);
  });

  it("กดด่านที่ปลดล็อกแล้วส่ง levelId ที่ถูกต้อง", async () => {
    const save = createDefaultSave({ now: () => new Date("2026-01-01T00:00:00Z") });
    const onOpenLevel = vi.fn();
    const user = userEvent.setup();
    render(<LevelGrid groups={levelGridView(save)} onOpenLevel={onOpenLevel} />);

    await user.click(screen.getByRole("button", { name: /ด่าน 01/ }));
    expect(onOpenLevel).toHaveBeenCalledWith(1);
  });
});
