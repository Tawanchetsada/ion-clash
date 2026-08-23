import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createDefaultSave } from "../../storage/defaults";
import { levelGridView } from "../../presentation/levels";
import { DifficultyGroup } from "./DifficultyGroup";

describe("DifficultyGroup", () => {
  it("แสดงชื่อช่วงความยากเป็นหัวข้อ และมี 10 ด่านต่อช่วง", () => {
    const save = createDefaultSave({ now: () => new Date("2026-01-01T00:00:00Z") });
    const [easy] = levelGridView(save);
    if (!easy) throw new Error("fixture ผิด");

    render(<DifficultyGroup view={easy} onOpenLevel={() => {}} />);
    expect(screen.getByRole("heading", { name: "ง่าย" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(10);
  });
});
